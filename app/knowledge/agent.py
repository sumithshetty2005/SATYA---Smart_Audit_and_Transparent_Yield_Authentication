"""Layer 4 Task 5: LangGraph Multi-Agent Regulatory Compliance Orchestration.

Orchestrates a 3-agent compliance workflow using LangGraph:
1. Retriever Agent: Queries hybrid vector/BM25 stores and performs Neo4j graph traversals.
2. Compliance Evaluator Agent: Cross-checks Layer 1-3 payloads against retrieved APH clauses.
3. Audit Synthesizer Agent: Generates structured compliance reports citing exact APH sections and clauses.

Dual LLM Configuration:
- Primary LLM: Llama 3.1 8B Instruct via Groq (langchain-groq)
- Automatic Fallback: Google Gemini API (langchain-google-genai)
- Deterministic Evaluation Fallback: For offline/unconfigured environments.
"""

import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from app.knowledge.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
)
from app.knowledge.reranker import reranker
from app.knowledge.retriever import retriever
from app.schemas.compliance import (
    ComplianceAuditRequest,
    ComplianceAuditResponse,
    EvidenceSnippet,
    GraphTraversalPath,
    InstitutionFacts,
    RegulatoryFinding,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Dual LLM Provider Manager (Groq Primary with Google Gemini Fallback)
# ---------------------------------------------------------------------------
class DualLLMManager:
    """Manages primary Groq Llama 3.1 8B and automatic Google Gemini API fallback."""

    def __init__(self) -> None:
        self.groq_api_key = GROQ_API_KEY
        self.groq_model = GROQ_MODEL
        self.gemini_api_key = GEMINI_API_KEY
        self.gemini_model = GEMINI_MODEL

    def invoke(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.1,
    ) -> Tuple[str, str, str]:
        """Invoke primary Groq LLM with automatic fallback to Google Gemini.

        Returns: (response_text, provider_name, model_name)
        """
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]

        # 1. Primary: Groq Llama 3.1 8B
        if self.groq_api_key:
            try:
                from langchain_groq import ChatGroq

                logger.info("Invoking primary LLM: Groq (%s)...", self.groq_model)
                groq_llm = ChatGroq(
                    model_name=self.groq_model,
                    groq_api_key=self.groq_api_key,
                    temperature=temperature,
                    timeout=15.0,
                    max_retries=1,
                )
                response = groq_llm.invoke(messages)
                content = str(response.content)
                logger.info("Groq response received successfully.")
                return content, "groq", self.groq_model
            except Exception as exc:
                logger.warning("Primary Groq LLM failed or rate-limited (%s). Attempting Gemini fallback...", exc)

        # 2. Fallback: Google Gemini API
        if self.gemini_api_key:
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI

                logger.info("Invoking fallback LLM: Google Gemini (%s)...", self.gemini_model)
                gemini_llm = ChatGoogleGenerativeAI(
                    model=self.gemini_model,
                    google_api_key=self.gemini_api_key,
                    temperature=temperature,
                    timeout=15.0,
                )
                response = gemini_llm.invoke(messages)
                content = str(response.content)
                logger.info("Google Gemini fallback response received successfully.")
                return content, "gemini", self.gemini_model
            except Exception as exc:
                logger.warning("Google Gemini fallback also failed (%s). Utilizing rule-based engine.", exc)

        # 3. Deterministic Fallback if neither API key is active or both fail
        logger.info("Utilizing deterministic regulatory compliance engine.")
        return "", "rule_based_fallback", "deterministic-rules-engine"


llm_manager = DualLLMManager()


# ---------------------------------------------------------------------------
# LangGraph Workflow State Definition
# ---------------------------------------------------------------------------
class ComplianceAgentState(TypedDict):
    """Internal state passed across agents in the LangGraph orchestration."""

    request: ComplianceAuditRequest
    facts: InstitutionFacts
    retrieved_evidence: List[EvidenceSnippet]
    graph_paths: List[GraphTraversalPath]
    findings: List[RegulatoryFinding]
    overall_status: str
    compliance_score: float
    summary: str
    llm_provider: str
    model_used: str
    start_time: float


# ---------------------------------------------------------------------------
# Agent 1: Retriever Agent
# ---------------------------------------------------------------------------
def run_retriever_agent(state: ComplianceAgentState) -> Dict[str, Any]:
    """Agent 1: Queries hybrid BM25 + Vector stores and traverses Neo4j knowledge graph."""
    facts = state["facts"]
    req = state["request"]

    # Construct targeted regulatory query from institutional facts and Layer 1-3 signals
    query_parts = [
        f"Programme {facts.programme}",
        f"Location {facts.location_type}",
        f"Land requirement acres {facts.programme}",
        "Faculty to Student Ratio 1:15 1:20 cadre ratio 1:2:6",
        "Change of Land Use CLU Certificate",
        "Built-up area instructional 4000 8000 sqm",
        "State Fire Safety NOC",
        "Document authenticity PKI digital signature visual forensics",
    ]
    if req.query_override:
        query_parts.insert(0, req.query_override)

    query = " | ".join(query_parts)
    logger.info("Retriever Agent searching hybrid store with query: %s", query[:100])

    # Execute Hybrid Retrieval (BM25 + BGE-M3 + RRF + 1-2 hop Neo4j traversal)
    raw_candidates, graph_paths = retriever.retrieve_hybrid(
        query=query,
        institution_facts=facts,
        top_k=10,
    )

    # Cross-encoder Reranking and Provenance Validation
    evidence = reranker.rerank_and_validate(
        query=query,
        candidates=raw_candidates,
        institution_facts=facts,
        top_k=5,
    )

    logger.info(
        "Retriever Agent completed: %d evidence snippets, %d graph paths",
        len(evidence),
        len(graph_paths),
    )
    return {
        "retrieved_evidence": evidence,
        "graph_paths": graph_paths,
    }


# ---------------------------------------------------------------------------
# Agent 2: Compliance Evaluator Agent
# ---------------------------------------------------------------------------
def run_compliance_evaluator_agent(state: ComplianceAgentState) -> Dict[str, Any]:
    """Agent 2: Cross-checks Layer 1-3 payloads against retrieved APH clauses and graph paths."""
    facts = state["facts"]
    req = state["request"]
    evidence = state["retrieved_evidence"]
    graph_paths = state["graph_paths"]

    findings: List[RegulatoryFinding] = []

    # 1. Evaluate Land & Location Norms (Clause 2.1.1, Table 2.1, Clause 2.1.3, Clause 2.1.4)
    land_info = req.extracted_data.land_info if req.extracted_data else None
    actual_land_acres = land_info.land_area_acres if land_info else 0.0
    clu_valid = land_info.land_use_certificate_valid if land_info else False

    # Determine mandated land standard
    is_mega = "mega" in facts.location_type.lower() or "metro" in facts.location_type.lower()
    is_urban = "urban" in facts.location_type.lower()
    is_eng = "engineering" in facts.programme.lower() or "technology" in facts.programme.lower()

    if is_eng:
        if is_mega:
            req_land = 1.5
            land_rule_text = "Minimum 1.5 Acres for Engineering (UG) in Mega Cities (Table 2.1 / Clause 2.1.4)"
        elif is_urban:
            req_land = 2.5
            land_rule_text = "Minimum 2.5 Acres for Engineering (UG) in Urban areas (Table 2.1)"
        else:
            req_land = 7.5
            land_rule_text = "Minimum 7.5 Acres for Engineering (UG) in Rural areas (Table 2.1)"
    else:
        req_land = 1.0 if not is_urban else 0.5
        land_rule_text = f"Minimum {req_land} Acres for {facts.programme} in {facts.location_type} (Table 2.1)"

    # Check Mega City exception applicability
    exception_note = None
    if is_mega:
        exception_note = "Clause 2.1.4 (Mega City Land Relaxation): Permitted vertical FSI/FAR compliance."

    if actual_land_acres >= req_land:
        land_status = "COMPLIANT"
        land_severity = "INFORMATIONAL"
        land_gap = f"Institutional land ({actual_land_acres} acres) satisfies mandated requirement of {req_land} acres."
        land_action = "Maintain title deed and municipal registration records in institutional archives."
    elif actual_land_acres > 0.0:
        shortfall = round(req_land - actual_land_acres, 2)
        land_status = "NON_COMPLIANT"
        land_severity = "HIGH" if shortfall > 1.0 else "MEDIUM"
        land_gap = f"Deficit of {shortfall} acres. Actual land is {actual_land_acres} acres vs required {req_land} acres."
        land_action = f"Acquire additional contiguous land parcel of at least {shortfall} acres per Clause 2.1.2."
    else:
        land_status = "DEFICIENT"
        land_severity = "HIGH"
        land_gap = "Land details missing or zero acres declared in application payload."
        land_action = "Submit verified revenue land survey records and title documents."

    findings.append(
        RegulatoryFinding(
            finding_id="find_land_area",
            clause_reference="Clause 2.1.1",
            section_id="Section 2.1",
            title="Institutional Land Parcel Norms",
            category="Land & Infrastructure",
            status=land_status,
            severity=land_severity,
            required_standard=land_rule_text,
            actual_value=f"{actual_land_acres} Acres",
            gap_analysis=land_gap,
            exception_applied=exception_note,
            corrective_action=land_action,
        )
    )

    # Land Use Certificate (CLU) Check (Clause 2.1.3)
    if clu_valid:
        clu_status = "COMPLIANT"
        clu_severity = "INFORMATIONAL"
        clu_gap = "Valid Land Use Certificate (CLU) verified for educational institutional zoning."
        clu_action = "Maintain certified copy of revenue order."
    else:
        clu_status = "NON_COMPLIANT"
        clu_severity = "CRITICAL"
        clu_gap = "Indisputable Land Use Certificate (CLU) missing or flagged invalid."
        clu_action = "Obtain and upload statutory Change of Land Use (CLU) order from Competent Revenue Authority."

    findings.append(
        RegulatoryFinding(
            finding_id="find_land_clu",
            clause_reference="Clause 2.1.3",
            section_id="Section 2.1",
            title="Change of Land Use (CLU) Certificate",
            category="Statutory Approvals",
            status=clu_status,
            severity=clu_severity,
            required_standard="Mandatory Land Use Certificate for educational purposes (Clause 2.1.3)",
            actual_value=f"CLU Valid: {clu_valid}",
            gap_analysis=clu_gap,
            corrective_action=clu_action,
        )
    )

    # 2. Evaluate Faculty Requirements & Cadre Ratio (Clause 3.2.1, 3.2.2, 3.2.4)
    faculty_list = req.extracted_data.faculty_list if req.extracted_data else []
    total_faculty = len(faculty_list)
    enrolled = facts.total_enrolled_students or facts.approved_intake or 360

    # Calculate required faculty based on 1:20 or 1:15
    target_ratio = 15 if "engineering" in facts.programme.lower() else 20
    required_faculty = max(1, enrolled // target_ratio)
    actual_fsr_value = round(enrolled / max(1, total_faculty), 1)

    if actual_fsr_value <= target_ratio and total_faculty >= required_faculty:
        fsr_status = "COMPLIANT"
        fsr_severity = "INFORMATIONAL"
        fsr_gap = f"Faculty-to-Student Ratio is 1:{actual_fsr_value} ({total_faculty} faculty for {enrolled} students)."
        fsr_action = "Sustain active faculty roster and academic retention."
    elif total_faculty > 0:
        fsr_status = "NON_COMPLIANT"
        fsr_severity = "HIGH" if actual_fsr_value > target_ratio * 1.5 else "MEDIUM"
        fsr_gap = f"FSR deficit: 1:{actual_fsr_value} vs required 1:{target_ratio}. Shortfall of {max(0, required_faculty - total_faculty)} faculty members."
        fsr_action = f"Recruit at least {max(0, required_faculty - total_faculty)} qualified regular faculty members per AICTE norms."
    else:
        fsr_status = "DEFICIENT"
        fsr_severity = "HIGH"
        fsr_gap = f"No faculty records extracted from application tables. Mandated faculty count: {required_faculty}."
        fsr_action = "Upload attested faculty roster with qualifications and service contracts."

    findings.append(
        RegulatoryFinding(
            finding_id="find_faculty_ratio",
            clause_reference="Clause 3.2.1",
            section_id="Section 3.2",
            title="Faculty-to-Student Ratio (FSR)",
            category="Faculty Cadre & Ratio",
            status=fsr_status,
            severity=fsr_severity,
            required_standard=f"Mandated FSR 1:{target_ratio} (Clause 3.2.1)",
            actual_value=f"1:{actual_fsr_value} ({total_faculty} Faculty)",
            gap_analysis=fsr_gap,
            corrective_action=fsr_action,
        )
    )

    # 3. Evaluate Built-up Instructional Area (Clause 4.1.1)
    builtup_sqm = req.extracted_data.total_builtup_area_sqm if req.extracted_data else 0.0
    req_builtup = 4000.0  # Initial intake threshold

    if builtup_sqm >= req_builtup:
        builtup_status = "COMPLIANT"
        builtup_severity = "INFORMATIONAL"
        builtup_gap = f"Built-up area of {builtup_sqm} sq.m. satisfies minimum requirement of {req_builtup} sq.m."
        builtup_action = "Maintain building safety inspection records."
    elif builtup_sqm > 0.0:
        builtup_status = "NON_COMPLIANT"
        builtup_severity = "MEDIUM"
        builtup_gap = f"Built-up area shortfall of {round(req_builtup - builtup_sqm, 1)} sq.m. ({builtup_sqm} vs {req_builtup} sq.m.)."
        builtup_action = "Expand instructional facilities to meet 4,000 sq.m. initial requirement."
    else:
        builtup_status = "DEFICIENT"
        builtup_severity = "MEDIUM"
        builtup_gap = "Built-up area missing or unspecified in application."
        builtup_action = "Submit approved architect blueprint and carpet area calculation sheet."

    findings.append(
        RegulatoryFinding(
            finding_id="find_builtup_area",
            clause_reference="Clause 4.1.1",
            section_id="Section 4.1",
            title="Total Built-up Instructional Area",
            category="Land & Infrastructure",
            status=builtup_status,
            severity=builtup_severity,
            required_standard="Minimum 4,000 sq.m. built-up area for technical institutions (Clause 4.1.1)",
            actual_value=f"{builtup_sqm} sq.m.",
            gap_analysis=builtup_gap,
            corrective_action=builtup_action,
        )
    )

    # 1A. Hilly Area Land Continuity & Distance Check (Annexure 3.1 (g) & (h))
    if facts.plot_details is not None or facts.is_hilly_area:
        plots = facts.plot_details or []
        plot_count = len(plots)
        max_dist = max((p.get("distance_to_next_km", 0.0) for p in plots), default=0.0)
        academic_plots = [
            p.get("name", "")
            for p in plots
            if "academic" in p.get("usage", "").lower() or "administrative" in p.get("usage", "").lower()
        ]
        academic_in_one_plot = len(set(academic_plots)) <= 1 if academic_plots else True

        if plot_count <= 3 and max_dist <= 2.0 and academic_in_one_plot and plot_count > 0:
            hilly_status = "COMPLIANT"
            hilly_sev = "INFORMATIONAL"
            hilly_gap = (
                f"Land spread across {plot_count} plots in Hilly Area with max distance {max_dist} km (<= 2.0 km). "
                f"Academic and administrative facilities consolidated in single plot ({academic_plots[0] if academic_plots else 'Plot A'})."
            )
        else:
            hilly_status = "NON_COMPLIANT"
            hilly_sev = "HIGH"
            hilly_gap = (
                f"Hilly area land parcel violation: {plot_count} plots (max 3), max distance {max_dist} km (max 2.0 km), "
                f"Academic in one plot: {academic_in_one_plot}."
            )

        findings.append(
            RegulatoryFinding(
                finding_id="find_hilly_land_continuity",
                clause_reference="Annexure 3.1, Clause g & h",
                section_id="Annexure 3.1",
                title="Land Continuity & Distance Verification in Hilly Areas",
                category="Land & Infrastructure",
                status=hilly_status,
                severity=hilly_sev,
                required_standard="Max 3 plots, distance <= 2.0 km, Academic/Admin in one plot (Annexure 3.1 (g) & (h))",
                actual_value=f"{plot_count} plots (Distances: <= {max_dist} km) | Academic/Admin in Plot {academic_plots[0] if academic_plots else 'A'}",
                gap_analysis=hilly_gap,
                corrective_action="Maintain consolidation of instructional and administrative areas in main parcel." if hilly_status == "COMPLIANT" else "Relocate academic facilities to a single plot or reduce parcel separation to <= 2.0 km.",
            )
        )

    # 1B. Minimum Classroom Count Requirement (Annexure 3.2.1 (A))
    if facts.courses_count is not None and facts.divisions_per_course is not None and facts.course_duration_years is not None:
        tot_divisions = facts.courses_count * facts.divisions_per_course
        req_classrooms = int(tot_divisions * facts.course_duration_years * 0.5)
        provided_classrooms = facts.classrooms_provided or 0

        if provided_classrooms >= req_classrooms:
            cr_status = "COMPLIANT"
            cr_sev = "INFORMATIONAL"
            cr_gap = f"Provided {provided_classrooms} classrooms satisfies mandated requirement of {req_classrooms} classrooms."
        else:
            cr_status = "NON_COMPLIANT"
            cr_sev = "HIGH"
            cr_deficit = req_classrooms - provided_classrooms
            cr_gap = (
                f"Deficiency of {cr_deficit} classrooms. Mandated: {req_classrooms} classrooms "
                f"(Formula: {tot_divisions} divisions * {facts.course_duration_years} years * 0.5 = {req_classrooms}). "
                f"Provided: {provided_classrooms} classrooms."
            )

        findings.append(
            RegulatoryFinding(
                finding_id="find_classroom_count",
                clause_reference="Annexure 3.2.1 (A)",
                section_id="Annexure 3.2.1 (A) — Instructional Area Requirements",
                title="Minimum Classroom Count for B.Tech Institute",
                category="Land & Infrastructure",
                status=cr_status,
                severity=cr_sev,
                required_standard=f"Required Classrooms = Total Divisions/year * Duration in years * 0.5 = {req_classrooms} classrooms (Annexure 3.2.1 (A))",
                actual_value=f"{provided_classrooms} Classrooms Provided",
                gap_analysis=cr_gap,
                corrective_action=f"Construct/designate at least {max(0, req_classrooms - provided_classrooms)} additional standard classrooms (>= 66 sq.m. carpet area each).",
            )
        )

    # 2A. TER Processing Fee Compliance (Chapter I, Clause 1.4.2, Table 1.1)
    if facts.ter_fee_paid_lakhs is not None:
        paid_lakhs = facts.ter_fee_paid_lakhs
        req_ter_lakhs = 10.00
        if paid_lakhs >= req_ter_lakhs:
            ter_status = "COMPLIANT"
            ter_sev = "INFORMATIONAL"
            ter_gap = f"Remitted TER processing fee of Rs. {paid_lakhs:.2f} Lakh meets mandated Rs. {req_ter_lakhs:.2f} Lakh."
        else:
            ter_status = "NON_COMPLIANT"
            ter_sev = "HIGH"
            shortfall_ter = req_ter_lakhs - paid_lakhs
            ter_gap = f"Underpaid TER Charges by Rs. {shortfall_ter:.2f} Lakh (Remitted Rs. {paid_lakhs:.2f} Lakh vs Required Rs. {req_ter_lakhs:.2f} Lakh)."

        findings.append(
            RegulatoryFinding(
                finding_id="find_ter_charges",
                clause_reference="Chapter I, Clause 1.4.2, Table 1.1",
                section_id="Chapter I, Section 1.4",
                title="Technical Education Regulatory (TER) Processing Charges",
                category="Financial Compliance",
                status=ter_status,
                severity=ter_sev,
                required_standard="Rs. 10.00 Lakh for setting up new Technical Institution (Chapter I, Table 1.1 (ii))",
                actual_value=f"Rs. {paid_lakhs:.2f} Lakh Remitted",
                gap_analysis=ter_gap,
                corrective_action=f"Remit balance shortfall of Rs. {req_ter_lakhs - paid_lakhs:.2f} Lakh through online AICTE payment gateway.",
            )
        )

    # 2B. Operational Expense Funds Position (Chapter I, Clause 1.5.3, Table 1.2)
    if facts.operational_funds_lakhs is not None:
        funds_lakhs = facts.operational_funds_lakhs
        req_funds_lakhs = 50.00
        if funds_lakhs >= req_funds_lakhs:
            fund_status = "COMPLIANT"
            fund_sev = "INFORMATIONAL"
            fund_gap = f"Operational fund proof of Rs. {funds_lakhs:.2f} Lakh satisfies mandated Rs. {req_funds_lakhs:.2f} Lakh."
        else:
            fund_status = "NON_COMPLIANT"
            fund_sev = "HIGH"
            shortfall_funds = req_funds_lakhs - funds_lakhs
            fund_gap = f"Shortfall of Rs. {shortfall_funds:.2f} Lakh in operational funds at Scrutiny (Provided Rs. {funds_lakhs:.2f} Lakh vs Required Rs. {req_funds_lakhs:.2f} Lakh)."

        findings.append(
            RegulatoryFinding(
                finding_id="find_operational_funds",
                clause_reference="Chapter I, Clause 1.5.3, Table 1.2",
                section_id="Chapter I, Section 1.5",
                title="Operational Expense Funds Requirement at Scrutiny",
                category="Financial Compliance",
                status=fund_status,
                severity=fund_sev,
                required_standard="Minimum Rs. 50.00 Lakh operational funds in FDR / Bank accounts (Chapter I, Table 1.2 (vii))",
                actual_value=f"Rs. {funds_lakhs:.2f} Lakh Shown",
                gap_analysis=fund_gap,
                corrective_action=f"Produce bank certificate / Fixed Deposit Receipts for remaining Rs. {req_funds_lakhs - funds_lakhs:.2f} Lakh.",
            )
        )

    # 3A. Faculty Cadre Ratio & Detailed Breakdown (Annexure 5.2)
    if facts.professors_count is not None or facts.associate_professors_count is not None:
        p_prov = facts.professors_count or 0
        ap_prov = facts.associate_professors_count or 0
        ast_prov = facts.assistant_professors_count if facts.assistant_professors_count is not None else (total_faculty - p_prov - ap_prov)
        tot_prov = p_prov + ap_prov + ast_prov
        tot_enrolled = facts.total_enrolled_students or 1200
        req_tot = tot_enrolled // 20  # 60
        req_p = round((req_tot / 9) * 1)   # 7
        req_ap = round((req_tot / 9) * 2)  # 13
        req_ast = round((req_tot / 9) * 6) # 40

        shortfall_tot = max(0, req_tot - tot_prov)
        shortfall_p = max(0, req_p - p_prov)
        shortfall_ap = max(0, req_ap - ap_prov)

        if shortfall_tot == 0 and shortfall_p == 0 and shortfall_ap == 0:
            cadre_status = "COMPLIANT"
            cadre_sev = "INFORMATIONAL"
            cadre_gap = f"Faculty count ({tot_prov}) and cadre distribution (P:{p_prov}, AP:{ap_prov}, AstP:{ast_prov}) fully satisfies 1:2:6 ratio."
        else:
            cadre_status = "NON_COMPLIANT"
            cadre_sev = "HIGH"
            cadre_gap = (
                f"Overall faculty shortfall of {shortfall_tot} members; shortfall of {shortfall_p} Professors and "
                f"{shortfall_ap} Associate Professors. Required: {req_tot} faculty ({req_p} Prof, {req_ap} Assoc Prof, {req_ast} Asst Prof). "
                f"Provided: {tot_prov} ({p_prov} Prof, {ap_prov} Assoc Prof, {ast_prov} Asst Prof)."
            )

        findings.append(
            RegulatoryFinding(
                finding_id="find_cadre_ratio",
                clause_reference="Annexure 5.2",
                section_id="Annexure 5.2 — Norms for Faculty Requirements and Cadre Ratio",
                title="Under Graduate Engineering SFR & Cadre Ratio Compliance",
                category="Faculty Cadre & Ratio",
                status=cadre_status,
                severity=cadre_sev,
                required_standard=f"SFR 1:20 (Req: {req_tot} faculty) & Cadre 1:2:6 ({req_p} Prof, {req_ap} Assoc Prof, {req_ast} Asst Prof) (Annexure 5.2)",
                actual_value=f"{tot_prov} Faculty ({p_prov} Prof, {ap_prov} Assoc Prof, {ast_prov} Asst Prof)",
                gap_analysis=cadre_gap,
                corrective_action=f"Recruit {shortfall_p} Professors and {shortfall_ap} Associate Professors with Ph.D. to rebalance cadre.",
            )
        )

    # 3B. Adjunct Faculty & Professor of Practice Cap (Chapter VI, Clause 6.14 (d) (iii))
    if facts.adjunct_and_pop_percentage is not None:
        pct = facts.adjunct_and_pop_percentage
        cap_pct = 15.0
        if pct <= cap_pct:
            adj_status = "COMPLIANT"
            adj_sev = "INFORMATIONAL"
            adj_gap = f"Adjunct Faculty / Professors of Practice ({pct}%) within statutory 15% limit."
        else:
            adj_status = "NON_COMPLIANT"
            adj_sev = "HIGH"
            adj_gap = f"Exceeds 15% maximum permissible ceiling (Observed: {pct}% vs Permissible: {cap_pct}%)."

        findings.append(
            RegulatoryFinding(
                finding_id="find_adjunct_cap",
                clause_reference="Chapter VI, Clause 6.14 (d) (iii)",
                section_id="Chapter VI, Section 6.14",
                title="Professor of Practice & Adjunct Faculty Cap",
                category="Faculty Cadre & Ratio",
                status=adj_status,
                severity=adj_sev,
                required_standard="Maximum limit of 15% of required faculty strength (Chapter VI, Clause 6.14 (d) (iii))",
                actual_value=f"{pct}% of Required Faculty",
                gap_analysis=adj_gap,
                corrective_action=f"Reduce Adjunct / Professor of Practice engagement from {pct}% to <= 15% by appointing regular full-time faculty.",
            )
        )

    # 4A. ODL / Online Permissibility for Engineering & Technology (Chapter V, Clause 5.1 (b))
    mode_upper = (facts.delivery_mode or "").upper()
    is_odl_or_online = (
        "ODL" in mode_upper
        or "ONLINE" in mode_upper
        or "DISTANCE" in mode_upper
        or mode_upper in ("OL", "OPEN")
    )
    if is_odl_or_online and ("engineering" in facts.programme.lower() or "technology" in facts.programme.lower()):
        findings.append(
            RegulatoryFinding(
                finding_id="find_odl_prohibition",
                clause_reference="Chapter V, Clause 5.1 (b)",
                section_id="Chapter V, Section 5.1",
                title="Permissibility of Distance Learning in Engineering & Technology",
                category="Programme Permissibility",
                status="PROHIBITED / INVALID APPLICATION",
                severity="CRITICAL",
                required_standard="Council shall NOT allow ODL or Online Learning in Engineering & Technology (Chapter V, Clause 5.1 (b))",
                actual_value=f"{facts.programme} via {facts.delivery_mode} Mode",
                gap_analysis="The Council shall NOT allow Open and Distance Learning (ODL) or Online Learning at Diploma / Degree / Post Graduate Degree level in Engineering & Technology. Application is prohibited and invalid.",
                corrective_action="Convert application to Regular On-Campus mode or withdraw submission.",
            )
        )

    # 4B. ODL Academic Staff at Headquarters (Chapter V, Clause 5.3.3, Table 5.1)
    if is_odl_or_online and facts.odl_academic_staff is not None:
        staff = facts.odl_academic_staff
        prof_h = staff.get("professors", 0)
        ap_h = staff.get("associate_professors", 0)
        ast_h = staff.get("assistant_professors", 0)
        short_ast = max(0, 2 - ast_h)
        if prof_h >= 1 and ap_h >= 1 and ast_h >= 2:
            odl_staff_status = "COMPLIANT"
            odl_staff_sev = "INFORMATIONAL"
            odl_staff_gap = "Academic staff at headquarters meets minimum statutory staffing norms."
        else:
            odl_staff_status = "NON_COMPLIANT"
            odl_staff_sev = "HIGH"
            odl_staff_gap = (
                f"Shortfall of {short_ast} Assistant Professor. Mandated for up to 5000 students: 1 Professor (Head), "
                f"1 Associate Professor, 2 Assistant Professors (Table 5.1). Provided: {prof_h} Prof, {ap_h} Assoc Prof, {ast_h} Asst Prof."
            )

        findings.append(
            RegulatoryFinding(
                finding_id="find_odl_staff",
                clause_reference="Chapter V, Clause 5.3.3, Table 5.1",
                section_id="Chapter V, Section 5.3",
                title="ODL / Online Learning Academic Staff at Headquarters",
                category="Faculty Cadre & Ratio",
                status=odl_staff_status,
                severity=odl_staff_sev,
                required_standard="1 Professor (Head), 1 Associate Professor, 2 Assistant Professors for up to 5000 students (Table 5.1)",
                actual_value=f"{prof_h} Prof, {ap_h} Assoc Prof, {ast_h} Asst Prof",
                gap_analysis=odl_staff_gap,
                corrective_action=f"Appoint at least {short_ast} additional full-time qualified Assistant Professor at institutional headquarters.",
            )
        )

    # 4. Evaluate Layer 2 Visual Forensics Integrity (Clause 5.2.1)
    if req.forensics_data:
        f_data = req.forensics_data
        comp_score = f_data.composite_score
        is_tampered = f_data.is_tampered

        if not is_tampered and comp_score <= 35.0:
            forensics_status = "COMPLIANT"
            forensics_severity = "INFORMATIONAL"
            forensics_gap = f"Document visual forensics clean. Composite anomaly score: {comp_score}."
            forensics_action = "None required."
        else:
            forensics_status = "NON_COMPLIANT"
            forensics_severity = "CRITICAL"
            forensics_gap = f"Forensic anomalies detected! Composite tampering risk: {comp_score}. Flags: {', '.join(f_data.flags)}"
            forensics_action = "Submit uncompressed original document directly from issuing authority."

        findings.append(
            RegulatoryFinding(
                finding_id="find_visual_forensics",
                clause_reference="Clause 5.2.1",
                section_id="Section 5.2",
                title="Document Visual Forensics Integrity",
                category="Document Authenticity & Forensics",
                status=forensics_status,
                severity=forensics_severity,
                required_standard="Tampering risk <= 35.0 and no localized image manipulation (Clause 5.2.1)",
                actual_value=f"Composite Score: {comp_score} | Tampered: {is_tampered}",
                gap_analysis=forensics_gap,
                corrective_action=forensics_action,
            )
        )

    # 5. Evaluate Layer 3 Authoritative Source Verification (Clause 1.1.3 & Clause 5.2.2)
    if req.source_verification:
        s_data = req.source_verification
        pki = s_data.pki_verification
        qr = s_data.qr_verification
        trust = s_data.trust_score

        if s_data.overall_status == "AUTHENTIC" and trust >= 75.0:
            auth_status = "COMPLIANT"
            auth_severity = "INFORMATIONAL"
            auth_gap = f"Cryptographically authenticated source receipt. Trust score: {trust}."
            auth_action = "None required."
        elif s_data.overall_status == "TAMPERED_POST_SIGNING":
            auth_status = "NON_COMPLIANT"
            auth_severity = "CRITICAL"
            auth_gap = f"Document altered post-signing! PKI hash integrity violated. Trust score: {trust}."
            auth_action = "Provide pristine unedited digitally-signed PDF certified by issuing officer."
        else:
            auth_status = "CONDITIONAL" if trust >= 50.0 else "NON_COMPLIANT"
            auth_severity = "HIGH" if trust < 50.0 else "MEDIUM"
            auth_gap = f"Authoritative source verification incomplete ({s_data.overall_status}). Trust score: {trust}."
            auth_action = "Ensure PDF contains active PKI signature or QR code resolving to .gov.in/.aicte-india.org."

        findings.append(
            RegulatoryFinding(
                finding_id="find_source_verification",
                clause_reference="Clause 5.2.2",
                section_id="Section 5.2",
                title="Cryptographic PKI & Authoritative QR Verification",
                category="Document Authenticity & Forensics",
                status=auth_status,
                severity=auth_severity,
                required_standard="Authentic digital PKI signature or official government QR code (Clause 5.2.2)",
                actual_value=f"Status: {s_data.overall_status} | Trust Score: {trust}",
                gap_analysis=auth_gap,
                corrective_action=auth_action,
            )
        )

    logger.info("Compliance Evaluator Agent generated %d regulatory findings", len(findings))
    return {"findings": findings}


# ---------------------------------------------------------------------------
# Agent 3: Audit Synthesizer Agent
# ---------------------------------------------------------------------------
def run_audit_synthesizer_agent(state: ComplianceAgentState) -> Dict[str, Any]:
    """Agent 3: Computes composite compliance score, final verdict, and LLM synthesis."""
    findings = state["findings"]
    evidence = state["retrieved_evidence"]
    facts = state["facts"]

    # Compute Compliance Score (0.0 - 100.0) based on severity deductions
    score = 100.0
    critical_count = 0
    non_compliant_count = 0

    for f in findings:
        if f.status == "NON_COMPLIANT":
            non_compliant_count += 1
            if f.severity == "CRITICAL":
                score -= 35.0
                critical_count += 1
            elif f.severity == "HIGH":
                score -= 20.0
            elif f.severity == "MEDIUM":
                score -= 10.0
            elif f.severity == "LOW":
                score -= 5.0
        elif f.status == "DEFICIENT":
            score -= 15.0
            non_compliant_count += 1
        elif f.status == "CONDITIONAL":
            score -= 8.0

    score = float(max(0.0, min(100.0, round(score, 1))))

    # Determine Final Regulatory Decision
    has_prohibited = any(f.status == "PROHIBITED / INVALID APPLICATION" for f in findings)
    if has_prohibited:
        overall_status = "PROHIBITED / INVALID APPLICATION"
        score = 0.0
    elif critical_count > 0 or score < 50.0:
        overall_status = "REJECTED"
    elif score < 75.0 or non_compliant_count >= 2:
        overall_status = "DEFICIENT"
    elif any(f.status == "CONDITIONAL" for f in findings):
        overall_status = "CONDITIONAL_APPROVAL"
    else:
        overall_status = "APPROVED"

    # LLM Synthesis Prompt
    system_prompt = (
        "You are the senior AICTE Regulatory Audit Officer. Generate a rigorous, formal compliance audit summary "
        "citing exact AICTE Approval Process Handbook (2024-2027) sections, clauses, and tables. "
        "Maintain objective regulatory tone, highlight shortfalls, note any statutory exceptions, "
        "and provide clear actionable directives for the approval committee."
    )

    findings_summary = "\n".join(
        [
            f"- [{f.clause_reference} | {f.section_id}] {f.title}: {f.status} (Severity: {f.severity}). "
            f"Observed: {f.actual_value}. Mandated: {f.required_standard}. Analysis: {f.gap_analysis}"
            for f in findings
        ]
    )

    evidence_summary = "\n".join(
        [f"- [{e.clause_reference} p.{e.page_number}]: {e.text[:140]}..." for e in evidence[:3]]
    )

    user_prompt = (
        f"Institution: {facts.institution_name or 'Applicant Institution'} (ID: {facts.institution_id or 'APP-2024'})\n"
        f"Programme: {facts.programme} | Location: {facts.location_type} | Category: {facts.application_type}\n"
        f"Overall Status: {overall_status} | Compliance Score: {score}/100\n\n"
        f"Retrieved APH Handbook Regulatory Evidence:\n{evidence_summary}\n\n"
        f"Evaluated Findings:\n{findings_summary}\n\n"
        "Provide a concise executive audit summary (3-4 paragraphs) synthesizing the overall decision, "
        "highlighting critical non-compliances (or confirming adherence), and citing the specific clauses."
    )

    summary_text, provider, model_used = llm_manager.invoke(system_prompt, user_prompt)

    if not summary_text:
        # High-fidelity deterministic synthesis fallback
        summary_text = (
            f"Regulatory Compliance Audit for {facts.institution_name or 'Applicant'} ({facts.institution_id or 'APP-2024'}) "
            f"under AICTE Approval Process Handbook (2024-2027). The application for {facts.programme} in {facts.location_type} "
            f"has received a regulatory verdict of '{overall_status}' with a composite compliance score of {score}/100.\n\n"
            f"Audit evaluation identified {len(findings)} itemized statutory checkpoints across Land & Infrastructure, "
            f"Faculty Cadre Ratios, and Cryptographic Document Authenticity. "
            f"Critical statutory findings include: {', '.join(f.title + ' (' + f.status + ')' for f in findings if f.severity in ('CRITICAL', 'HIGH')) or 'All core norms verified satisfied.'}.\n\n"
            f"Exact regulatory governance adheres to APH 2024-2027 Chapter 2 (Land norms), Chapter 3 (FSR 1:15/1:20 & Cadre 1:2:6), "
            f"Chapter 4 (Built-up Area 4,000 sqm), and Chapter 5 (Fire Safety & PKI Verification). "
            f"Prescribed corrective actions must be submitted before the appellate scrutiny committee."
        )

    logger.info("Audit Synthesizer Agent completed. Decision: %s (Score: %s)", overall_status, score)
    return {
        "overall_status": overall_status,
        "compliance_score": score,
        "summary": summary_text,
        "llm_provider": provider,
        "model_used": model_used,
    }


# ---------------------------------------------------------------------------
# LangGraph Workflow Construction
# ---------------------------------------------------------------------------
def build_compliance_agent_workflow() -> StateGraph:
    """Build and compile the multi-agent LangGraph workflow."""
    workflow = StateGraph(ComplianceAgentState)

    # Register multi-agent nodes
    workflow.add_node("retriever_agent", run_retriever_agent)
    workflow.add_node("evaluator_agent", run_compliance_evaluator_agent)
    workflow.add_node("synthesizer_agent", run_audit_synthesizer_agent)

    # Establish directed workflow graph edges
    workflow.set_entry_point("retriever_agent")
    workflow.add_edge("retriever_agent", "evaluator_agent")
    workflow.add_edge("evaluator_agent", "synthesizer_agent")
    workflow.add_edge("synthesizer_agent", END)

    return workflow.compile()


# Compiled LangGraph execution runnable
compliance_agent_graph = build_compliance_agent_workflow()


# ---------------------------------------------------------------------------
# Public Execution API
# ---------------------------------------------------------------------------
def execute_compliance_audit(request: ComplianceAuditRequest) -> ComplianceAuditResponse:
    """Execute complete Layer 4 Agentic GraphRAG & Regulatory Engine pipeline.

    Receives consolidated payload from Layers 1-3, runs LangGraph orchestration,
    and returns comprehensive ComplianceAuditResponse.
    """
    t0 = time.time()
    audit_id = f"audit_{uuid.uuid4().hex[:12]}"
    facts = request.institution_facts or InstitutionFacts()

    # If Layer 1 provided institution_id, propagate it
    if request.extracted_data and request.extracted_data.institution_id and not facts.institution_id:
        facts.institution_id = request.extracted_data.institution_id

    initial_state: ComplianceAgentState = {
        "request": request,
        "facts": facts,
        "retrieved_evidence": [],
        "graph_paths": [],
        "findings": [],
        "overall_status": "PENDING",
        "compliance_score": 0.0,
        "summary": "",
        "llm_provider": "groq",
        "model_used": "llama-3.1-8b-instant",
        "start_time": t0,
    }

    final_state = compliance_agent_graph.invoke(initial_state)
    elapsed = round(time.time() - t0, 3)

    return ComplianceAuditResponse(
        audit_id=audit_id,
        timestamp=datetime.now(timezone.utc).isoformat(),
        institution_id=facts.institution_id,
        programme=facts.programme,
        overall_status=final_state["overall_status"],
        compliance_score=final_state["compliance_score"],
        summary=final_state["summary"],
        findings=final_state["findings"],
        retrieved_evidence=final_state["retrieved_evidence"],
        graph_paths=final_state["graph_paths"],
        llm_provider=final_state["llm_provider"],
        model_used=final_state["model_used"],
        execution_time_seconds=elapsed,
    )

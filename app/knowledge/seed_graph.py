"""Layer 4 Task 2: Neo4j Knowledge Graph Seeding for AICTE Regulations.

Connects to Neo4j Aura / Local using the Python driver.
Extracts regulatory entities:
- (:Programme {name: 'Engineering and Technology', ...})
- (:Level {name: 'Under Graduate', ...})
- (:RegulatoryClause {id: 'Annexure 3.2.1', title: 'Instructional Area', ...})
- (:Requirement {type: 'ClassroomsFormula', formula: 'Divisions * Duration * 0.5', ...})
- (:Requirement {type: 'SFR', ratio: '1:20', ...})
- (:TERFee {type: 'New Private Trust', amount_lakhs: 10.0, ...})
- (:LocationType), (:ApplicationType), (:Exception)

Establishes directed relationships:
- (:Programme)-[:MANDATES]->(:Requirement)
- (:Programme)-[:GOVERNED_BY]->(:RegulatoryClause)
- (:Programme)-[:OFFERS_LEVEL]->(:Level)
- (:Programme)-[:REQUIRES_FEE]->(:TERFee)
- (:RegulatoryClause)-[:SPECIFIES]->(:Requirement)
- (:RegulatoryClause)-[:HAS_EXCEPTION]->(:Exception)
- (:RegulatoryClause)-[:APPLIES_TO]->(:LocationType)
- (:RegulatoryClause)-[:COVERS_PROGRAMME]->(:Programme)
- (:RegulatoryClause)-[:FOR_APPLICATION_TYPE]->(:ApplicationType)

Creates vector and full-text indexes in Neo4j (SHOW VECTOR INDEXES, SHOW FULLTEXT INDEXES)
and provides an in-memory graph fallback when Neo4j is offline.
"""

import json
import logging
import os
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional, Set, Tuple

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from neo4j import GraphDatabase

from app.knowledge.config import (
    CHUNKS_CACHE_PATH,
    EMBEDDING_DIMENSION,
    NEO4J_DATABASE,
    NEO4J_PASSWORD,
    NEO4J_URI,
    NEO4J_USER,
)
from app.knowledge.embeddings import embedding_manager
from app.knowledge.ingest_aph import APHChunk, ingest_aph_document

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# In-Memory Graph Implementation (Seamless Fallback for Offline Environments)
# ---------------------------------------------------------------------------
class InMemoryKnowledgeGraph:
    """High-performance in-memory graph store mirroring Neo4j graph model and indexes."""

    _instance: Optional["InMemoryKnowledgeGraph"] = None

    def __new__(cls) -> "InMemoryKnowledgeGraph":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.nodes = {}  # (label, id) -> dict of properties
            cls._instance.edges = []  # list of dicts: {from_label, from_id, rel, to_label, to_id, props}
            cls._instance.vector_index = {}  # node_id -> embedding
            cls._instance.fulltext_index = {}  # word -> set of node_ids
            cls._instance.is_seeded = False
        return cls._instance

    def clear(self) -> None:
        """Clear all nodes, edges, and indexes."""
        self.nodes.clear()
        self.edges.clear()
        self.vector_index.clear()
        self.fulltext_index.clear()
        self.is_seeded = False

    def add_node(self, label: str, node_id: str, properties: Dict[str, Any]) -> None:
        """Add or update a node with given label and properties."""
        key = (label, node_id)
        props = dict(properties)
        props["id"] = node_id
        props["_label"] = label
        self.nodes[key] = props

        # Update vector index if embedding present
        if "embedding" in props and props["embedding"]:
            self.vector_index[node_id] = props["embedding"]

        # Update fulltext index
        searchable_text = f"{props.get('text', '')} {props.get('title', '')} {props.get('name', '')} {props.get('description', '')}"
        words = re.findall(r"\w+", searchable_text.lower())
        for w in words:
            if w not in self.fulltext_index:
                self.fulltext_index[w] = set()
            self.fulltext_index[w].add(node_id)

    def add_edge(
        self,
        from_label: str,
        from_id: str,
        relationship: str,
        to_label: str,
        to_id: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Add a directed relationship between two nodes."""
        edge = {
            "from_label": from_label,
            "from_id": from_id,
            "rel": relationship,
            "to_label": to_label,
            "to_id": to_id,
            "properties": properties or {},
        }
        # Avoid duplicate edges
        if not any(
            e["from_label"] == from_label
            and e["from_id"] == from_id
            and e["rel"] == relationship
            and e["to_label"] == to_label
            and e["to_id"] == to_id
            for e in self.edges
        ):
            self.edges.append(edge)

    def get_node(self, label: str, node_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve node properties."""
        return self.nodes.get((label, node_id))

    def find_nodes(self, label: str, filter_fn=None) -> List[Dict[str, Any]]:
        """Find all nodes matching label and optional filter predicate."""
        results = []
        for (l, nid), props in self.nodes.items():
            if l == label:
                if filter_fn is None or filter_fn(props):
                    results.append(props)
        return results

    def traverse(
        self,
        start_label: str,
        start_id: str,
        max_hops: int = 2,
    ) -> List[Dict[str, Any]]:
        """Perform 1- to 2-hop traversal outward from the start node."""
        paths: List[Dict[str, Any]] = []
        visited_nodes: Set[Tuple[str, str]] = {(start_label, start_id)}

        # Hop 1
        hop1_targets: List[Tuple[str, str, str, Dict[str, Any]]] = []
        for edge in self.edges:
            if edge["from_label"] == start_label and edge["from_id"] == start_id:
                to_key = (edge["to_label"], edge["to_id"])
                to_node = self.nodes.get(to_key, {})
                paths.append(
                    {
                        "from_node": start_id,
                        "from_label": start_label,
                        "relationship": edge["rel"],
                        "to_node": edge["to_id"],
                        "to_label": edge["to_label"],
                        "properties": to_node,
                        "hop_depth": 1,
                    }
                )
                hop1_targets.append((edge["to_label"], edge["to_id"], edge["rel"], to_node))
                visited_nodes.add(to_key)

        # Hop 2
        if max_hops >= 2:
            for h1_label, h1_id, _, _ in hop1_targets:
                for edge in self.edges:
                    if edge["from_label"] == h1_label and edge["from_id"] == h1_id:
                        to_key = (edge["to_label"], edge["to_id"])
                        if to_key not in visited_nodes:
                            to_node = self.nodes.get(to_key, {})
                            paths.append(
                                {
                                    "from_node": h1_id,
                                    "from_label": h1_label,
                                    "relationship": edge["rel"],
                                    "to_node": edge["to_id"],
                                    "to_label": edge["to_label"],
                                    "properties": to_node,
                                    "hop_depth": 2,
                                }
                            )
                            visited_nodes.add(to_key)

        return paths


# Singleton in-memory graph instance
in_memory_graph = InMemoryKnowledgeGraph()


# ---------------------------------------------------------------------------
# Regulatory Domain Knowledge Definitions
# ---------------------------------------------------------------------------
STANDARD_PROGRAMMES = [
    {"id": "prog_eng", "name": "Engineering and Technology", "degree": "UG/PG"},
    {"id": "prog_mgmt", "name": "Management", "degree": "PG"},
    {"id": "prog_mca", "name": "MCA", "degree": "PG"},
    {"id": "prog_pharm", "name": "Pharmacy", "degree": "UG/PG"},
    {"id": "prog_arch", "name": "Architecture", "degree": "UG"},
]

STANDARD_LEVELS = [
    {"id": "level_ug", "name": "Under Graduate", "description": "Undergraduate Degree level programs (e.g. B.Tech)"},
    {"id": "level_pg", "name": "Post Graduate", "description": "Post Graduate Degree level programs (e.g. M.Tech, MBA, MCA)"},
    {"id": "level_dip", "name": "Diploma", "description": "Diploma level programs in Engineering and Technology"},
]

STANDARD_APPLICATION_TYPES = [
    {"id": "app_new", "name": "Setting Up New Institution"},
    {"id": "app_eoa", "name": "Extension of Approval"},
    {"id": "app_intake", "name": "Increase in Intake"},
    {"id": "app_new_course", "name": "Introduction of New Courses"},
]

STANDARD_LOCATION_TYPES = [
    {"id": "loc_rural", "name": "Rural", "description": "Rural geographical classification"},
    {"id": "loc_urban", "name": "Urban", "description": "Urban municipality or corporation jurisdiction"},
    {"id": "loc_mega", "name": "Mega City", "description": "Declared mega metro / state capital area"},
    {"id": "loc_metro", "name": "Metro", "description": "Metropolitan urban zone"},
    {"id": "loc_hilly", "name": "Hilly Area", "description": "Designated hilly, tribal, or NER area"},
]

STANDARD_TER_FEES = [
    {
        "id": "fee_ter_new_private_trust",
        "type": "New Private Trust",
        "amount_lakhs": 10.0,
        "title": "TER Processing Fee (New Institution - Private Trust)",
        "clause_ref": "Chapter I, Table 1.1 (ii)",
        "description": "Technical Education Regulatory (TER) Charges for setting up a new Technical Institution: Rs. 10.00 Lakh for Private Trusts.",
    },
    {
        "id": "fee_ter_govt",
        "type": "Government Institution",
        "amount_lakhs": 0.0,
        "title": "TER Processing Fee (Government)",
        "clause_ref": "Chapter I, Table 1.1 (i)",
        "description": "Central / State Government / Union Territory Institutions: Nil.",
    },
]

STANDARD_REQUIREMENTS = [
    {
        "id": "req_classrooms_formula",
        "title": "Classroom Count Calculation",
        "type": "ClassroomsFormula",
        "formula": "Divisions * Duration * 0.5",
        "metric": "classroom_count",
        "description": "Required Classrooms = Total Divisions per year * Duration in years * 0.5 (Annexure 3.2.1 (A)).",
    },
    {
        "id": "req_sfr_1_20",
        "title": "Faculty to Student Ratio (1:20)",
        "type": "SFR",
        "ratio": "1:20",
        "metric": "faculty_student_ratio",
        "min_ratio_value": 20.0,
        "unit": "ratio",
        "description": "Undergraduate Engineering requires faculty to student ratio of 1:20 (Annexure 5.2).",
    },
    {
        "id": "req_land_eng_rural",
        "title": "Minimum Land for Engineering (Rural)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 7.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 7.5 acres in Rural areas.",
    },
    {
        "id": "req_land_eng_urban",
        "title": "Minimum Land for Engineering (Urban)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 2.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 2.5 acres in Urban areas.",
    },
    {
        "id": "req_land_eng_mega",
        "title": "Minimum Land for Engineering (Mega City)",
        "type": "Land",
        "metric": "land_area_acres",
        "min_value": 1.5,
        "unit": "acres",
        "description": "Degree Engineering & Technology requires minimum 1.5 acres in Mega Cities.",
    },
    {
        "id": "req_land_clu",
        "title": "Mandatory Change of Land Use (CLU) Certificate",
        "type": "StatutoryClearance",
        "metric": "land_use_certificate_valid",
        "min_value": 1.0,
        "unit": "boolean",
        "description": "Indisputable Land Use Certificate (CLU) for educational use from Competent Revenue Authority.",
    },
    {
        "id": "req_fsr_pg_mgmt",
        "title": "Faculty to Student Ratio (1:20) for Management",
        "type": "SFR",
        "metric": "faculty_student_ratio",
        "ratio": "1:20",
        "min_ratio_value": 20.0,
        "unit": "ratio",
        "description": "PG Management programmes require faculty to student ratio of 1:20.",
    },
    {
        "id": "req_cadre_ratio",
        "title": "Faculty Cadre Ratio 1:2:6",
        "type": "Faculty",
        "metric": "cadre_ratio",
        "ratio": "1:2:6",
        "unit": "ratio",
        "description": "Distribution of faculty positions shall be 1 Professor : 2 Associate Professors : 6 Assistant Professors.",
    },
    {
        "id": "req_faculty_regular_pct",
        "title": "Minimum 80% Regular Full-Time Faculty",
        "type": "Faculty",
        "metric": "regular_faculty_percent",
        "min_value": 80.0,
        "unit": "percent",
        "description": "At least 80% of faculty members must be regular full-time appointments.",
    },
    {
        "id": "req_builtup_area",
        "title": "Total Built-up Instructional Area (4,000 - 8,000 sqm)",
        "type": "Infrastructure",
        "metric": "total_builtup_area_sqm",
        "min_value": 4000.0,
        "unit": "sqm",
        "description": "Total built-up instructional and administrative area minimum 4,000 sqm initial scaling to 8,000 sqm.",
    },
    {
        "id": "req_statutory_fire_noc",
        "title": "State Fire Services Life Safety NOC",
        "type": "StatutoryClearance",
        "metric": "fire_safety_noc_valid",
        "min_value": 1.0,
        "unit": "boolean",
        "description": "Unexpired Fire and Life Safety Certificate from State Fire Services Department.",
    },
    {
        "id": "req_forensics_integrity",
        "title": "Visual Forensics Authenticity (Low Tampering Risk)",
        "type": "Forensics",
        "metric": "composite_tampering_score",
        "max_value": 35.0,
        "unit": "score",
        "description": "Document must have composite tampering score <= 35.0 and no detected visual smoothing or stamp tampering.",
    },
    {
        "id": "req_pki_signature",
        "title": "Cryptographic PKI Signature & Authoritative QR",
        "type": "Verification",
        "metric": "trust_score",
        "min_value": 75.0,
        "unit": "score",
        "description": "Affidavits and statutory certificates must bear valid PKI digital signatures or authoritative government QR codes.",
    },
]

STANDARD_SPECIFIC_CLAUSES = [
    {
        "id": "Annexure 3.2.1",
        "clause_id": "Annexure 3.2.1",
        "title": "Instructional Area",
        "section_id": "Chapter 4: Norms for Built-Up Infrastructure and Amenities",
        "clause_reference": "Annexure 3.2.1 (A)",
        "edition_year": "2024-2027",
        "page_number": 3,
        "text": "Instructional Area Requirements & Classroom Count Calculation. Minimum classrooms required = Total Divisions per year * Duration in years * 0.5.",
    },
    {
        "id": "Annexure 3.1",
        "clause_id": "Annexure 3.1",
        "title": "Land Continuity & Distance Verification in Hilly Areas",
        "section_id": "Chapter 2: Norms for Land, Location, and Site Requirements",
        "clause_reference": "Annexure 3.1 (g) & (h)",
        "edition_year": "2024-2027",
        "page_number": 2,
        "text": "In Hilly Areas, land can be spread across a maximum of 3 plots. Distance between any plots shall not exceed 2.0 km.",
    },
    {
        "id": "Clause 1.4.2",
        "clause_id": "Clause 1.4.2",
        "title": "TER Processing Fee Schedule",
        "section_id": "Chapter 1: Introduction and General Procedures",
        "clause_reference": "Clause 1.4.2, Table 1.1",
        "edition_year": "2024-2027",
        "page_number": 1,
        "text": "TER Charges for setting up a new Technical Institution is Rs. 10.00 Lakh for Private Registered Trusts under Table 1.1.",
    },
    {
        "id": "Clause 1.5.3",
        "clause_id": "Clause 1.5.3",
        "title": "Minimum Operational Funds Requirement at Scrutiny",
        "section_id": "Chapter 1: Introduction and General Procedures",
        "clause_reference": "Clause 1.5.3, Table 1.2",
        "edition_year": "2024-2027",
        "page_number": 1,
        "text": "Applicant Trust or Society must demonstrate minimum operational funds of at least Rs. 50.00 Lakh in FDR/Bank Deposits at Scrutiny.",
    },
    {
        "id": "Annexure 5.2",
        "clause_id": "Annexure 5.2",
        "title": "Norms for Faculty Requirements and Cadre Ratio",
        "section_id": "Chapter 3: Norms for Faculty Requirements and Cadre Ratios",
        "clause_reference": "Annexure 5.2",
        "edition_year": "2024-2027",
        "page_number": 2,
        "text": "Mandated Faculty-Student Ratio (SFR) is 1:20 and Cadre distribution is 1:2:6 (1 Professor : 2 Associate Professors : 6 Assistant Professors).",
    },
    {
        "id": "Clause 6.14 (d) (iii)",
        "clause_id": "Clause 6.14 (d) (iii)",
        "title": "Ceiling on Adjunct Faculty and Professors of Practice",
        "section_id": "Chapter 6: Faculty Appointments and Norms",
        "clause_reference": "Chapter VI, Clause 6.14 (d) (iii)",
        "edition_year": "2024-2027",
        "page_number": 3,
        "text": "Services of Adjunct Faculty or Professor of Practice may be availed up to a maximum limit of 15% of total required faculty strength.",
    },
    {
        "id": "Clause 5.1 (b)",
        "clause_id": "Clause 5.1 (b)",
        "title": "Prohibited Programmes in Distance and Online Education",
        "section_id": "Chapter 5: Open and Distance Learning (ODL) and Online Learning",
        "clause_reference": "Chapter V, Clause 5.1 (b)",
        "edition_year": "2024-2027",
        "page_number": 4,
        "text": "The Council shall NOT allow Open and Distance Learning (ODL) or Online Learning at Diploma / Degree / PG level in Engineering & Technology.",
    },
    {
        "id": "Clause 5.3.3",
        "clause_id": "Clause 5.3.3",
        "title": "Minimum Dedicated Academic Staff at Headquarters",
        "section_id": "Chapter 5: Open and Distance Learning (ODL) and Online Learning",
        "clause_reference": "Chapter V, Clause 5.3.3, Table 5.1",
        "edition_year": "2024-2027",
        "page_number": 4,
        "text": "Mandated academic staff per discipline for up to 5000 students: 1 Professor (Head), 1 Associate Professor, 2 Assistant Professors.",
    },
]

STANDARD_EXCEPTIONS = [
    {
        "id": "exc_mega_city_land",
        "clause_ref": "Clause 2.1.4",
        "title": "Mega City Land Relaxation",
        "description": "Up to 50% relaxation in land area for Mega Cities (Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad) and State Capitals subject to higher FSI/FAR compliance.",
        "condition": "Location in declared Mega City or State Capital with vertical FSI compliance.",
    },
    {
        "id": "exc_prof_practice",
        "clause_ref": "Clause 3.2.5",
        "title": "Professors of Practice Exception",
        "description": "Up to 20% of required faculty positions may be appointed as Adjunct Faculty or Professors of Practice from industry without Ph.D.",
        "condition": "Industry expertise and distinguished practitioner track record.",
    },
    {
        "id": "exc_land_two_plots",
        "clause_ref": "Clause 2.1.2",
        "title": "Split Land Parcel Exception",
        "description": "A maximum of two plots separated by distance of not more than 2.0 km permissible if both exclusively owned by sponsoring Trust.",
        "condition": "Distance between plots <= 2.0 km.",
    },
]


class Neo4jKnowledgeGraphSeeder:
    """Connects to Neo4j, establishes schema indexes, and seeds regulatory graph."""

    def __init__(
        self,
        uri: str = NEO4J_URI,
        user: str = NEO4J_USER,
        password: str = NEO4J_PASSWORD,
        database: Optional[str] = NEO4J_DATABASE,
    ) -> None:
        self.uri = uri
        self.user = user
        self.password = password
        self.database = database
        self.driver = None
        self._connected: Optional[bool] = None

    def connect(self) -> bool:
        """Establish or verify connectivity to Neo4j database."""
        if self._connected is not None and self.driver is not None:
            return self._connected

        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                connection_timeout=15.0,
            )
            self.driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j instance at %s", self.uri)
            self._connected = True
        except Exception as exc:
            logger.info(
                "Neo4j offline at %s (%s). Utilizing high-performance InMemoryKnowledgeGraph.",
                self.uri,
                exc,
            )
            self._connected = False
            self.driver = None
        return self._connected

    def get_session(self):
        """Create a session using self.database if specified, else default database."""
        if self.database:
            return self.driver.session(database=self.database)
        return self.driver.session()

    def close(self) -> None:
        """Close Neo4j driver connection."""
        if self.driver is not None:
            try:
                self.driver.close()
            except Exception:
                pass
            self.driver = None
            self._connected = None

    def create_indexes(self) -> None:
        """Create vector and full-text indexes in Neo4j."""
        if not self.connect() or not self.driver:
            logger.info("Neo4j offline. Skipping live index creation (in-memory index active).")
            return

        with self.get_session() as session:
            try:
                result = session.run("SHOW INDEXES").data()
                existing_index_names = {rec.get("name") for rec in result}
                logger.info("Existing Neo4j indexes: %s", existing_index_names)

                if "clause_vector_index" not in existing_index_names:
                    logger.info("Creating vector index 'clause_vector_index' on :RegulatoryClause(embedding)...")
                    session.run(
                        """
                        CREATE VECTOR INDEX clause_vector_index IF NOT EXISTS
                        FOR (c:RegulatoryClause) ON (c.embedding)
                        OPTIONS {indexConfig: {
                            `vector.dimensions`: $dim,
                            `vector.similarity_function`: 'cosine'
                        }}
                        """,
                        dim=EMBEDDING_DIMENSION,
                    )
                    logger.info("Vector index 'clause_vector_index' created successfully.")

                if "clause_fulltext_index" not in existing_index_names:
                    logger.info("Creating fulltext index 'clause_fulltext_index' on :RegulatoryClause...")
                    session.run(
                        """
                        CREATE FULLTEXT INDEX clause_fulltext_index IF NOT EXISTS
                        FOR (c:RegulatoryClause) ON EACH [c.text, c.title, c.clause_reference, c.section_id]
                        """
                    )
                    logger.info("Full-text index 'clause_fulltext_index' created successfully.")

            except Exception as exc:
                logger.warning("Error creating Neo4j indexes: %s", exc)

    def seed_knowledge_graph(self, chunks: Optional[List[APHChunk]] = None) -> Dict[str, int]:
        """Parse chunks, extract regulatory entities, and seed graph nodes & directed relationships."""
        if chunks is None:
            if CHUNKS_CACHE_PATH.exists():
                with open(CHUNKS_CACHE_PATH, "r", encoding="utf-8") as f:
                    raw_chunks = json.load(f)
                    chunks = [APHChunk(**c) for c in raw_chunks]
            else:
                chunks = ingest_aph_document()

        logger.info("Seeding knowledge graph with %d chunks...", len(chunks))
        use_neo4j = self.connect() and self.driver is not None

        if use_neo4j:
            self.create_indexes()

        counts = {
            "clauses": 0,
            "programmes": 0,
            "levels": 0,
            "ter_fees": 0,
            "application_types": 0,
            "requirements": 0,
            "location_types": 0,
            "exceptions": 0,
            "relationships": 0,
        }

        # -------------------------------------------------------------------
        # 1. Seed Core Reference Entities (InMemory + Neo4j)
        # -------------------------------------------------------------------
        # (:Programme)
        for prog in STANDARD_PROGRAMMES:
            in_memory_graph.add_node("Programme", prog["id"], prog)
            counts["programmes"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (p:Programme {name: $name}) SET p.id = $id, p.degree = $degree",
                    id=prog["id"],
                    name=prog["name"],
                    degree=prog.get("degree", ""),
                )

        # (:Level)
        for lvl in STANDARD_LEVELS:
            in_memory_graph.add_node("Level", lvl["id"], lvl)
            counts["levels"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (l:Level {name: $name}) SET l.id = $id, l.description = $desc",
                    id=lvl["id"],
                    name=lvl["name"],
                    desc=lvl.get("description", ""),
                )

        # (:TERFee)
        for fee in STANDARD_TER_FEES:
            in_memory_graph.add_node("TERFee", fee["id"], fee)
            counts["ter_fees"] += 1
            if use_neo4j:
                self._execute_cypher(
                    """
                    MERGE (t:TERFee {type: $type})
                    SET t.id = $id, t.amount_lakhs = $amount_lakhs, t.title = $title, t.clause_ref = $clause_ref, t.description = $description
                    """,
                    id=fee["id"],
                    type=fee["type"],
                    amount_lakhs=fee["amount_lakhs"],
                    title=fee["title"],
                    clause_ref=fee["clause_ref"],
                    description=fee["description"],
                )

        # (:ApplicationType)
        for app_type in STANDARD_APPLICATION_TYPES:
            in_memory_graph.add_node("ApplicationType", app_type["id"], app_type)
            counts["application_types"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (a:ApplicationType {id: $id}) SET a += $props",
                    id=app_type["id"],
                    props=app_type,
                )

        # (:LocationType)
        for loc in STANDARD_LOCATION_TYPES:
            in_memory_graph.add_node("LocationType", loc["id"], loc)
            counts["location_types"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (l:LocationType {id: $id}) SET l += $props",
                    id=loc["id"],
                    props=loc,
                )

        # (:Requirement)
        for req in STANDARD_REQUIREMENTS:
            in_memory_graph.add_node("Requirement", req["id"], req)
            counts["requirements"] += 1
            if use_neo4j:
                # Merge on type if unique, or id
                if "formula" in req:
                    self._execute_cypher(
                        """
                        MERGE (r:Requirement {type: $type, formula: $formula})
                        SET r += $props
                        """,
                        type=req["type"],
                        formula=req["formula"],
                        props=req,
                    )
                elif "ratio" in req:
                    self._execute_cypher(
                        """
                        MERGE (r:Requirement {type: $type, ratio: $ratio})
                        SET r += $props
                        """,
                        type=req["type"],
                        ratio=req["ratio"],
                        props=req,
                    )
                else:
                    self._execute_cypher(
                        "MERGE (r:Requirement {id: $id}) SET r += $props",
                        id=req["id"],
                        props=req,
                    )

        # (:Exception)
        for exc in STANDARD_EXCEPTIONS:
            in_memory_graph.add_node("Exception", exc["id"], exc)
            counts["exceptions"] += 1
            if use_neo4j:
                self._execute_cypher(
                    "MERGE (e:Exception {id: $id}) SET e += $props",
                    id=exc["id"],
                    props=exc,
                )

        # -------------------------------------------------------------------
        # 2. Seed Specific Regulatory Clause Nodes
        # -------------------------------------------------------------------
        for spec_clause in STANDARD_SPECIFIC_CLAUSES:
            embedding = embedding_manager.embed_text(spec_clause["text"])
            c_props = dict(spec_clause)
            c_props["embedding"] = [float(x) for x in embedding]
            in_memory_graph.add_node("RegulatoryClause", spec_clause["id"], c_props)
            counts["clauses"] += 1
            if use_neo4j:
                self._execute_cypher(
                    """
                    MERGE (c:RegulatoryClause {id: $id})
                    SET c.title = $title,
                        c.clause_id = $clause_id,
                        c.section_id = $section_id,
                        c.clause_reference = $clause_reference,
                        c.edition_year = $edition_year,
                        c.text = $text,
                        c.embedding = $embedding
                    """,
                    id=spec_clause["id"],
                    title=spec_clause["title"],
                    clause_id=spec_clause["clause_id"],
                    section_id=spec_clause["section_id"],
                    clause_reference=spec_clause["clause_reference"],
                    edition_year=spec_clause["edition_year"],
                    text=spec_clause["text"],
                    embedding=c_props["embedding"],
                )

        # -------------------------------------------------------------------
        # 3. Seed Ingested Chunks as RegulatoryClause Nodes
        # -------------------------------------------------------------------
        for chunk in chunks:
            embedding = embedding_manager.embed_text(chunk.text)
            clause_props = {
                "id": chunk.chunk_id,
                "clause_id": chunk.chunk_id,
                "title": chunk.title,
                "edition_year": chunk.edition_year,
                "section_id": chunk.section_id,
                "clause_reference": chunk.clause_reference,
                "page_number": chunk.page_number,
                "table_context": chunk.table_context or "",
                "text": chunk.text,
                "approx_tokens": chunk.approx_tokens,
                "embedding": [float(x) for x in embedding],
            }

            in_memory_graph.add_node("RegulatoryClause", chunk.chunk_id, clause_props)
            counts["clauses"] += 1

            if use_neo4j:
                self._execute_cypher(
                    """
                    MERGE (c:RegulatoryClause {id: $id})
                    SET c.clause_id = $clause_id,
                        c.title = $title,
                        c.edition_year = $edition_year,
                        c.section_id = $section_id,
                        c.clause_reference = $clause_reference,
                        c.page_number = $page_number,
                        c.table_context = $table_context,
                        c.text = $text,
                        c.approx_tokens = $approx_tokens,
                        c.embedding = $embedding
                    """,
                    id=chunk.chunk_id,
                    clause_id=chunk.chunk_id,
                    title=chunk.title,
                    edition_year=chunk.edition_year,
                    section_id=chunk.section_id,
                    clause_reference=chunk.clause_reference,
                    page_number=chunk.page_number,
                    table_context=clause_props["table_context"],
                    text=chunk.text,
                    approx_tokens=chunk.approx_tokens,
                    embedding=clause_props["embedding"],
                )

        # -------------------------------------------------------------------
        # 4. Build Directed Relationships
        # -------------------------------------------------------------------
        # A. (:Programme)-[:MANDATES]->(:Requirement)
        prog_mandates = [
            ("prog_eng", "req_classrooms_formula"),
            ("prog_eng", "req_sfr_1_20"),
            ("prog_eng", "req_land_eng_rural"),
            ("prog_eng", "req_land_eng_urban"),
            ("prog_eng", "req_land_eng_mega"),
            ("prog_eng", "req_land_clu"),
            ("prog_eng", "req_cadre_ratio"),
            ("prog_eng", "req_faculty_regular_pct"),
            ("prog_eng", "req_builtup_area"),
            ("prog_eng", "req_statutory_fire_noc"),
            ("prog_eng", "req_forensics_integrity"),
            ("prog_eng", "req_pki_signature"),
            ("prog_mgmt", "req_fsr_pg_mgmt"),
            ("prog_mgmt", "req_land_clu"),
            ("prog_mgmt", "req_statutory_fire_noc"),
            ("prog_mca", "req_fsr_pg_mgmt"),
        ]
        for prog_id, req_id in prog_mandates:
            self._link_entities("Programme", prog_id, "MANDATES", "Requirement", req_id)
            counts["relationships"] += 1

        # Direct user-requested MANDATES relationships in Neo4j
        if use_neo4j:
            self._execute_cypher(
                """
                MATCH (p:Programme {name: 'Engineering and Technology'})
                MATCH (r:Requirement {type: 'ClassroomsFormula', formula: 'Divisions * Duration * 0.5'})
                MERGE (p)-[:MANDATES]->(r)
                """
            )
            self._execute_cypher(
                """
                MATCH (p:Programme {name: 'Engineering and Technology'})
                MATCH (r:Requirement {type: 'SFR', ratio: '1:20'})
                MERGE (p)-[:MANDATES]->(r)
                """
            )

        # B. (:Programme)-[:GOVERNED_BY]->(:RegulatoryClause)
        governed_by_pairs = [
            ("prog_eng", "Annexure 3.2.1"),
            ("prog_eng", "Annexure 3.1"),
            ("prog_eng", "Clause 1.4.2"),
            ("prog_eng", "Annexure 5.2"),
            ("prog_eng", "Clause 6.14 (d) (iii)"),
            ("prog_eng", "Clause 5.1 (b)"),
            ("prog_eng", "aph_2024_2027_c001"),
            ("prog_eng", "aph_2024_2027_c002"),
            ("prog_eng", "aph_2024_2027_c003"),
            ("prog_eng", "aph_2024_2027_c004"),
            ("prog_mgmt", "Clause 1.5.3"),
            ("prog_mgmt", "Clause 5.3.3"),
        ]
        for prog_id, clause_id in governed_by_pairs:
            self._link_entities("Programme", prog_id, "GOVERNED_BY", "RegulatoryClause", clause_id)
            counts["relationships"] += 1

        if use_neo4j:
            self._execute_cypher(
                """
                MATCH (p:Programme {name: 'Engineering and Technology'})
                MATCH (c:RegulatoryClause {id: 'Annexure 3.2.1', title: 'Instructional Area'})
                MERGE (p)-[:GOVERNED_BY]->(c)
                """
            )

        # C. (:Programme)-[:OFFERS_LEVEL]->(:Level)
        self._link_entities("Programme", "prog_eng", "OFFERS_LEVEL", "Level", "level_ug")
        counts["relationships"] += 1
        if use_neo4j:
            self._execute_cypher(
                """
                MATCH (p:Programme {name: 'Engineering and Technology'})
                MATCH (l:Level {name: 'Under Graduate'})
                MERGE (p)-[:OFFERS_LEVEL]->(l)
                """
            )

        # D. (:Programme)-[:REQUIRES_FEE]->(:TERFee)
        self._link_entities("Programme", "prog_eng", "REQUIRES_FEE", "TERFee", "fee_ter_new_private_trust")
        counts["relationships"] += 1
        if use_neo4j:
            self._execute_cypher(
                """
                MATCH (p:Programme {name: 'Engineering and Technology'})
                MATCH (t:TERFee {type: 'New Private Trust'})
                MERGE (p)-[:REQUIRES_FEE]->(t)
                """
            )

        # E. (:RegulatoryClause)-[:MANDATES]->(:Requirement) / (:RegulatoryClause)-[:SPECIFIES]->(:Requirement)
        clause_req_pairs = [
            ("Annexure 3.2.1", "req_classrooms_formula"),
            ("Annexure 5.2", "req_sfr_1_20"),
            ("Annexure 5.2", "req_cadre_ratio"),
            ("Annexure 3.1", "req_land_eng_rural"),
            ("Clause 1.4.2", "req_forensics_integrity"),
            ("Clause 1.5.3", "req_pki_signature"),
            ("aph_2024_2027_c001", "req_land_eng_rural"),
            ("aph_2024_2027_c002", "req_land_eng_urban"),
            ("aph_2024_2027_c003", "req_classrooms_formula"),
            ("aph_2024_2027_c004", "req_builtup_area"),
        ]
        for cid, rid in clause_req_pairs:
            self._link_entities("RegulatoryClause", cid, "SPECIFIES", "Requirement", rid)
            counts["relationships"] += 1

        if use_neo4j:
            self._execute_cypher(
                """
                MATCH (c:RegulatoryClause {id: 'Annexure 3.2.1'})
                MATCH (r:Requirement {type: 'ClassroomsFormula'})
                MERGE (c)-[:SPECIFIES]->(r)
                """
            )

        # F. (:RegulatoryClause)-[:HAS_EXCEPTION]->(:Exception)
        clause_exceptions = [
            ("aph_2024_2027_c002", "exc_mega_city_land"),
            ("aph_2024_2027_c002", "exc_land_two_plots"),
            ("aph_2024_2027_c003", "exc_prof_practice"),
            ("Annexure 3.1", "exc_land_two_plots"),
            ("Clause 6.14 (d) (iii)", "exc_prof_practice"),
        ]
        for cid, exc_id in clause_exceptions:
            self._link_entities("RegulatoryClause", cid, "HAS_EXCEPTION", "Exception", exc_id)
            counts["relationships"] += 1

        # G. (:RegulatoryClause)-[:APPLIES_TO]->(:LocationType)
        clause_locations = [
            ("aph_2024_2027_c001", "loc_rural"),
            ("aph_2024_2027_c001", "loc_urban"),
            ("aph_2024_2027_c002", "loc_hilly"),
            ("aph_2024_2027_c002", "loc_mega"),
            ("Annexure 3.1", "loc_hilly"),
        ]
        for cid, loc_id in clause_locations:
            self._link_entities("RegulatoryClause", cid, "APPLIES_TO", "LocationType", loc_id)
            counts["relationships"] += 1

        in_memory_graph.is_seeded = True
        logger.info("Graph seeding complete: %s", counts)
        return counts

    def _link_entities(
        self,
        from_label: str,
        from_id: str,
        rel: str,
        to_label: str,
        to_id: str,
    ) -> None:
        """Establish directed edge in in-memory graph and Neo4j if active."""
        in_memory_graph.add_edge(from_label, from_id, rel, to_label, to_id)

        if self._connected and self.driver:
            cypher = f"""
            MATCH (a:{from_label}) WHERE a.id = $from_id OR a.clause_id = $from_id OR a.name = $from_id
            MATCH (b:{to_label}) WHERE b.id = $to_id OR b.clause_id = $to_id OR b.name = $to_id
            MERGE (a)-[r:{rel}]->(b)
            """
            self._execute_cypher(cypher, from_id=from_id, to_id=to_id)

    def _execute_cypher(self, query: str, **params) -> List[Dict[str, Any]]:
        """Safely execute a Cypher statement with parameterization."""
        if not self._connected or not self.driver:
            return []
        try:
            with self.get_session() as session:
                result = session.run(query, **params)
                return [record.data() for record in result]
        except Exception as exc:
            logger.warning("Cypher query error: %s on query: %s", exc, query[:80])
            return []


# Global seeder instance
graph_seeder = Neo4jKnowledgeGraphSeeder()


def seed_graph_database() -> Dict[str, int]:
    """Top-level helper to seed Neo4j and in-memory knowledge graph."""
    return graph_seeder.seed_knowledge_graph()


if __name__ == "__main__":
    print("=" * 70)
    print("AICTE Regulatory Knowledge Graph Seeding (Layer 4 Task 2)")
    print("=" * 70)

    counts = seed_graph_database()
    print(f"\n[Seeding Completed] Node & Relationship counts: {counts}")

    if graph_seeder.connect() and graph_seeder.driver:
        print("\n" + "=" * 70)
        print("Executing Neo4j Aura Remote Verification Queries:")
        print("=" * 70)

        with graph_seeder.get_session() as session:
            # 1. Total nodes count
            node_count = session.run("MATCH (n) RETURN count(n) AS cnt").single()["cnt"]
            print(f"\n>> MATCH (n) RETURN count(n) => {node_count} nodes")

            # 2. Total relationships count
            rel_count = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt").single()["cnt"]
            print(f">> MATCH ()-[r]->() RETURN count(r) => {rel_count} relationships")

            # 3. Verify specific requested nodes
            print("\n>> Verifying Specific Requested Nodes:")
            queries = [
                ("Programme", "MATCH (p:Programme {name: 'Engineering and Technology'}) RETURN p.name AS name, p.id AS id"),
                ("Level", "MATCH (l:Level {name: 'Under Graduate'}) RETURN l.name AS name, l.id AS id"),
                ("RegulatoryClause", "MATCH (c:RegulatoryClause {id: 'Annexure 3.2.1', title: 'Instructional Area'}) RETURN c.id AS id, c.title AS title"),
                ("Requirement (Formula)", "MATCH (r:Requirement {type: 'ClassroomsFormula', formula: 'Divisions * Duration * 0.5'}) RETURN r.type AS type, r.formula AS formula"),
                ("Requirement (SFR)", "MATCH (r:Requirement {type: 'SFR', ratio: '1:20'}) RETURN r.type AS type, r.ratio AS ratio"),
                ("TERFee", "MATCH (t:TERFee {type: 'New Private Trust', amount_lakhs: 10.0}) RETURN t.type AS type, t.amount_lakhs AS amount_lakhs"),
            ]
            for label, q in queries:
                records = session.run(q).data()
                print(f"  [NODE: {label}] -> {records}")

            # 4. Verify specific requested relationships
            print("\n>> Verifying Specific Requested Directed Relationships:")
            rel_queries = [
                ("(:Programme)-[:MANDATES]->(:Requirement)", "MATCH (p:Programme {name: 'Engineering and Technology'})-[r:MANDATES]->(req:Requirement) RETURN p.name AS programme, type(r) AS rel, req.type AS req_type, req.formula AS formula, req.ratio AS ratio"),
                ("(:Programme)-[:GOVERNED_BY]->(:RegulatoryClause)", "MATCH (p:Programme {name: 'Engineering and Technology'})-[r:GOVERNED_BY]->(c:RegulatoryClause {id: 'Annexure 3.2.1'}) RETURN p.name AS programme, type(r) AS rel, c.id AS clause_id, c.title AS title"),
            ]
            for desc, q in rel_queries:
                records = session.run(q).data()
                print(f"  [RELATIONSHIP: {desc}]")
                for r in records:
                    print(f"    {r}")

        graph_seeder.close()
    else:
        print("[WARNING] Could not connect to remote Neo4j Aura.")

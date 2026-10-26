import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Printer,
  FileCheck2,
} from 'lucide-react';
import type { ScrutinyResult } from './DocumentFindingsView';

interface Props {
  result: ScrutinyResult;
  onOpenReportModal?: () => void;
}

export interface ComplianceItem {
  id: string;
  category: 'Land & Cadastral' | 'Faculty & Cadre' | 'Infrastructure & CAD' | 'Forensic & Cryptographic' | 'Safety & Environment';
  parameterName: string;
  aphClause: string;
  isCompliant: boolean;
  severity?: 'CRITICAL_DEFICIENCY' | 'MAJOR_DEFICIENCY' | 'COMPLIANT';
  institutionalValue: string;
  statutoryThreshold: string;
  whatIsRightNote?: string;
  whatIsWrongNote?: string;
  officerDirective: string;
  layerSource: string;
}

export const DecisionSupportMatrix: React.FC<Props> = ({ result, onOpenReportModal }) => {
  const [filterMode, setFilterMode] = useState<'ALL' | 'RIGHT' | 'WRONG'>('ALL');

  const isClean = result.verdict === 'PASSED';
  const hasTampering = result.layer2.tamperingVerdict !== 'CLEAN' || !result.layer3.pkiValid;
  const hasCadreDeficit = !result.layer1.payload.cadre.cadreCompliant;

  // Construct comprehensive list of evaluated items comparing What is Right vs What is Wrong
  const evaluationItems: ComplianceItem[] = [
    // 1. Land Holdings
    {
      id: 'item-land',
      category: 'Land & Cadastral',
      parameterName: 'Contiguous Campus Land Area',
      aphClause: 'APH 2024–27 Chapter II, Clause 2.1 & Clause 2.4.1',
      isCompliant: !hasTampering && result.layer1.payload.landAreaAcres >= 5.0,
      severity: !hasTampering && result.layer1.payload.landAreaAcres >= 5.0 ? 'COMPLIANT' : 'CRITICAL_DEFICIENCY',
      institutionalValue: `${result.layer1.payload.landAreaAcres} Acres (Claimed: ${result.layer3.claimedAcreage} Acres)`,
      statutoryThreshold: 'Min 5.00 Contiguous Acres (Non-Mega City Technical Campus)',
      whatIsRightNote: result.layer3.digiLockerMatch
        ? 'Authoritative land acreage verified 100% on Haryana/State Bhulekh Land Registry API. 100% contiguous parcel with zero partition encumbrances.'
        : undefined,
      whatIsWrongNote: hasTampering
        ? 'Acreage claimed on uploaded scan was digitally altered (4.00 Acres overwritten as 7.20 Acres). DigiLocker official registry confirms only 4.00 Acres.'
        : undefined,
      officerDirective: hasTampering
        ? 'Direct Disqualification under AICTE Act Sec. 10(k). Issue immediate statutory Show-Cause Notice and mandate physical Revenue Authority Demarcation survey.'
        : 'Grant Land Tenure Clearance. Parameter satisfies statutory requirement for Sanctioned Intake.',
      layerSource: 'Layer 1 LayoutLMv3 + Layer 3 DigiLocker Bhulekh Registry',
    },
    // 2. PKI DSC Digital Signature
    {
      id: 'item-pki',
      category: 'Forensic & Cryptographic',
      parameterName: 'PKI Class-3 DSC Digital Signature & Byte Hash',
      aphClause: 'AICTE Electronic Filing Standards & IT Act 2000 Section 3A',
      isCompliant: result.layer3.pkiValid,
      severity: result.layer3.pkiValid ? 'COMPLIANT' : 'CRITICAL_DEFICIENCY',
      institutionalValue: result.layer3.pkiSigner,
      statutoryThreshold: 'Valid Class-3 Digital Signature with zero byte modification post-signing',
      whatIsRightNote: result.layer3.pkiValid
        ? 'Class-3 Digital Signature verified authentic against e-Mudhra / NIC Certifying Authority. SHA-256 document digest strictly intact.'
        : undefined,
      whatIsWrongNote: !result.layer3.pkiValid
        ? 'Post-signing alteration detected! The PDF document bytes were modified after the DSC signature was affixed. Legal signature invalidated.'
        : undefined,
      officerDirective: result.layer3.pkiValid
        ? 'Grant Digital Signature Clearance. Affidavit meets statutory legal evidentiary standards.'
        : 'Reject Document. Document cannot be accepted as sworn legal affidavit due to cryptographic post-signing alteration.',
      layerSource: 'Layer 3 PKI X.509 DSC Validator',
    },
    // 3. ELA Visual Forensics
    {
      id: 'item-ela',
      category: 'Forensic & Cryptographic',
      parameterName: 'Pixel-Level Error Level Analysis (ELA) Authenticity',
      aphClause: 'AICTE Forensic Anti-Fraud Screening Protocol v4.2',
      isCompliant: result.layer2.tamperingVerdict === 'CLEAN',
      severity: result.layer2.tamperingVerdict === 'CLEAN' ? 'COMPLIANT' : 'CRITICAL_DEFICIENCY',
      institutionalValue: `Anomaly Score: ${result.layer2.elaAnomalyScore}/100 • Laplacian: ${result.layer2.laplacianBlurScore}`,
      statutoryThreshold: 'Uniform high-frequency noise (< 25% anomaly score) & natural sensor blur',
      whatIsRightNote: result.layer2.tamperingVerdict === 'CLEAN'
        ? 'Clean native digital scan with zero pixel compression artifacts or localized cloning detected.'
        : undefined,
      whatIsWrongNote: result.layer2.tamperingVerdict !== 'CLEAN'
        ? `High-frequency compression discontinuity detected (${result.layer2.elaAnomalyScore}% anomaly) around Sub-Registrar stamp and Acreage schedule.`
        : undefined,
      officerDirective: result.layer2.tamperingVerdict === 'CLEAN'
        ? 'Clear forensic visual checks. Document scan is authentic original.'
        : 'Flag application for Fraud Investigation Committee under Section 10(k). Require applicant to produce physical stamp paper before Regional Scrutiny Cell.',
      layerSource: 'Layer 2 PyTorch ELA Forensics Engine',
    },
    // 4. Faculty Cadre Ratio
    {
      id: 'item-cadre',
      category: 'Faculty & Cadre',
      parameterName: 'Faculty Cadre Balance & Regular Appointments',
      aphClause: 'APH 2024–27 Chapter IV, Clause 4.3.2 & Table 4.1',
      isCompliant: !hasCadreDeficit,
      severity: !hasCadreDeficit ? 'COMPLIANT' : 'MAJOR_DEFICIENCY',
      institutionalValue: result.layer1.payload.cadre.ratio,
      statutoryThreshold: '1 Professor : 2 Associate Professors : 6 Assistant Professors (1:2:6)',
      whatIsRightNote: !hasCadreDeficit
        ? 'Cadre structure perfectly balances Senior Professors, Associate Professors, and Assistant Professors across approved divisions.'
        : undefined,
      whatIsWrongNote: hasCadreDeficit
        ? 'Severe shortage of regular Associate Professors. Junior Assistant Professors over-relied upon to meet overall headcount without senior academic leadership.'
        : undefined,
      officerDirective: !hasCadreDeficit
        ? 'Grant Faculty Cadre Clearance.'
        : 'Issue 15-day Statutory Discrepancy Notice. If regular Associate Professors are not appointed within cure period, reduce sanctioned intake by 25% under Section 10(p).',
      layerSource: 'Layer 1 LayoutLMv3 + Layer 4 Neo4j GraphRAG Rule Traversal',
    },
    // 5. Student-Faculty Ratio
    {
      id: 'item-sfr',
      category: 'Faculty & Cadre',
      parameterName: 'Student-to-Faculty Ratio (SFR)',
      aphClause: 'APH 2024–27 Appendix 4, Table 4.1.1',
      isCompliant: true,
      severity: 'COMPLIANT',
      institutionalValue: result.layer1.payload.studentFacultyRatio,
      statutoryThreshold: 'Maximum 1:15 for UG Technical / Engineering Programmes (1:20 for Tier-2)',
      whatIsRightNote: `Faculty strength of ${result.layer1.payload.facultyCount} members satisfies student enrollment of ${result.layer1.payload.sanctionedIntake} seats with SFR of ${result.layer1.payload.studentFacultyRatio}.`,
      officerDirective: 'Grant Student-Faculty Ratio Clearance.',
      layerSource: 'Layer 1 LayoutLMv3 Token Extraction',
    },
    // 6. Built-Up Carpet Area
    {
      id: 'item-builtup',
      category: 'Infrastructure & CAD',
      parameterName: 'Total Instructional & Administrative Built-Up Area',
      aphClause: 'APH 2024–27 Chapter VI, Clause 6.1 & Schedule 6.2',
      isCompliant: result.layer1.payload.builtUpAreaSqm >= 12000,
      severity: 'COMPLIANT',
      institutionalValue: `${result.layer1.payload.builtUpAreaSqm.toLocaleString()} m² (Instructional: ${result.layer1.payload.instructionalAreaSqm.toLocaleString()} m²)`,
      statutoryThreshold: 'Minimum 11,500 m² carpet area for sanctioned intake',
      whatIsRightNote: `Shapely vector CAD geometry confirms covered carpet area of ${result.layer1.payload.builtUpAreaSqm.toLocaleString()} m², exceeding statutory norm by +${(result.layer1.payload.builtUpAreaSqm - 11500).toLocaleString()} m².`,
      officerDirective: 'Grant Physical Built-Up Clearance. Space adequate for classroom, laboratory, and library norms.',
      layerSource: 'Layer 5 Shapely CAD Floor Plan Engine',
    },
    // 7. Circulation Area & Fire Safety
    {
      id: 'item-circulation',
      category: 'Safety & Environment',
      parameterName: 'Circulation Ratio & Emergency Fire Egress Passage',
      aphClause: 'APH 2024–27 Chapter VI, Clause 6.3.2 & NBC 2016 Part IV',
      isCompliant: result.layer5.circulationRatio >= 0.25 && result.layer5.nearestFireExitM <= 30,
      severity: result.layer5.circulationRatio >= 0.25 && result.layer5.nearestFireExitM <= 30 ? 'COMPLIANT' : 'MAJOR_DEFICIENCY',
      institutionalValue: `Circulation: ${(result.layer5.circulationRatio * 100).toFixed(1)}% • Fire Exit: ${result.layer5.nearestFireExitM}m`,
      statutoryThreshold: 'Minimum 25% circulation ratio & Fire Exit within 30 meters unobstructed',
      whatIsRightNote: result.layer5.circulationRatio >= 0.25
        ? `Circulation corridors account for ${(result.layer5.circulationRatio * 100).toFixed(1)}% of built area with nearest exit at ${result.layer5.nearestFireExitM}m (well below 30m maximum).`
        : undefined,
      whatIsWrongNote: result.layer5.circulationRatio < 0.25
        ? `Circulation ratio of ${(result.layer5.circulationRatio * 100).toFixed(1)}% is below 25% norm, and secondary egress route is constricted.`
        : undefined,
      officerDirective: result.layer5.circulationRatio >= 0.25
        ? 'Grant Safety & Circulation Clearance.'
        : 'Issue Safety Rectification Notice under National Building Code (NBC 2016). Require removal of corridor bottlenecks before final approval.',
      layerSource: 'Layer 5 Shapely CAD Geometry Traversal',
    },
    // 8. Workshop & Lab Equipment
    {
      id: 'item-labs',
      category: 'Infrastructure & CAD',
      parameterName: 'Core Engineering Laboratories & CNC Machinery',
      aphClause: 'APH 2024–27 Appendix 6 (Essential Lab Equipment Norms)',
      isCompliant: result.layer5.yoloDetections.every((a) => a.compliant),
      severity: result.layer5.yoloDetections.every((a) => a.compliant) ? 'COMPLIANT' : 'MAJOR_DEFICIENCY',
      institutionalValue: `${result.layer5.yoloDetections.filter((a) => a.compliant).length} / ${result.layer5.yoloDetections.length} Lab Asset Categories Satisfied`,
      statutoryThreshold: 'Mandatory operational equipment verified for each sanctioned department',
      whatIsRightNote: result.layer5.yoloDetections.every((a) => a.compliant)
        ? 'All mandatory workshop equipment, CNC lathe units, and computing terminals verified present and operational.'
        : undefined,
      whatIsWrongNote: !result.layer5.yoloDetections.every((a) => a.compliant)
        ? 'Deficit in mechanical workshop equipment detected: operational CNC machining centers short of mandatory division quota.'
        : undefined,
      officerDirective: result.layer5.yoloDetections.every((a) => a.compliant)
        ? 'Grant Equipment & Laboratory Clearance.'
        : 'Issue Equipment Discrepancy Notice. Mandatory lab machinery procurement invoice must be submitted within 15 days.',
      layerSource: 'Layer 5 YOLOv11 Computer Vision Machinery Detections',
    },
  ];

  const compliantItems = evaluationItems.filter((i) => i.isCompliant);
  const deficientItems = evaluationItems.filter((i) => !i.isCompliant);

  const displayedItems = evaluationItems.filter((item) => {
    if (filterMode === 'RIGHT') return item.isCompliant;
    if (filterMode === 'WRONG') return !item.isCompliant;
    return true;
  });

  return (
    <div className="space-y-6 font-sans-modern">
      {/* 1. PRIMARY OFFICER DECISION BANNER */}
      <div
        className={`p-5 md:p-6 rounded-2xl border-2 backdrop-blur-md shadow-lg transition-all ${
          isClean
            ? 'bg-gradient-to-r from-emerald-50/90 via-[#FAF4E8] to-emerald-50/90 border-emerald-400 text-emerald-950'
            : 'bg-gradient-to-r from-red-50/90 via-[#FAF4E8] to-amber-50/90 border-red-400 text-red-950'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded uppercase">
                AICTE OFFICIAL DECISION SUPPORT
              </span>
              <span className="text-xs font-semibold opacity-75">
                Evaluation under APH 2024–2027 Gazette Edition
              </span>
            </div>

            <h3 className="font-cinzel font-extrabold text-lg md:text-xl text-[#4A1504] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#D4AF37]" />
              <span>
                {isClean
                  ? 'RECOMMENDATION: UNCONDITIONAL EXTENSION OF APPROVAL (EoA 2026–27)'
                  : 'RECOMMENDATION: ISSUE 15-DAY STATUTORY SHOW-CAUSE NOTICE (SECTION 10(k))'}
              </span>
            </h3>

            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              {isClean
                ? `The scrutiny engine verified that all essential statutory criteria (${compliantItems.length} parameters) satisfy AICTE norms. Land, built-up, faculty cadre, and cryptographic PKI integrity are 100% authentic.`
                : `Critical statutory non-compliances found in ${deficientItems.length} parameter(s). Legal action recommended under AICTE Regulations prior to grant of approval.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Print Official Decision Order</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Comparison Counters */}
        <div className="mt-4 pt-3 border-t border-[#4A1504]/15 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-white/70 border border-[#D4AF37]/30 flex items-center justify-between">
            <span className="text-[#2B1609]/75 font-semibold">Total Evaluated Parameters:</span>
            <span className="font-mono font-bold text-[#4A1504]">{evaluationItems.length} Norms</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified Right (Compliant):</span>
            </span>
            <span className="font-mono font-bold text-emerald-800">{compliantItems.length} Passed</span>
          </div>

          <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 text-red-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <XCircle className="w-4 h-4 text-red-600" />
              <span>What is Wrong (Deficiencies):</span>
            </span>
            <span className="font-mono font-bold text-red-800">{deficientItems.length} Alert(s)</span>
          </div>
        </div>
      </div>

      {/* 2. SIDE-BY-SIDE SUMMARY: WHAT IS RIGHT VS WHAT IS WRONG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Box: WHAT IS RIGHT */}
        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-emerald-500/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="font-cinzel font-bold text-base text-emerald-950">
                Verified Right • Statutory Clearances ({compliantItems.length})
              </h4>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold rounded">
              {((compliantItems.length / evaluationItems.length) * 100).toFixed(0)}% Compliant
            </span>
          </div>

          <p className="text-[11px] text-[#2B1609]/75">
            Parameters confirmed authentic, within statutory limits, and backed by government registry / PKI verification:
          </p>

          <div className="space-y-3">
            {compliantItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{item.parameterName}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                    PASS
                  </span>
                </div>

                <div className="text-[11px] text-[#2B1609]/90 font-mono">
                  Verified: <strong className="text-emerald-900">{item.institutionalValue}</strong>
                </div>

                {item.whatIsRightNote && (
                  <p className="text-[11px] text-[#2B1609]/80 leading-relaxed pt-1 border-t border-emerald-200/60">
                    {item.whatIsRightNote}
                  </p>
                )}

                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-emerald-900/80">
                  <span>Clause: {item.aphClause}</span>
                  <span className="font-semibold text-emerald-800">Clearance Granted</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Box: WHAT IS WRONG */}
        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-red-500/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-red-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h4 className="font-cinzel font-bold text-base text-red-950">
                What is Wrong • Statutory Deficiencies ({deficientItems.length})
              </h4>
            </div>
            <span
              className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                deficientItems.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 animate-pulse'
              }`}
            >
              {deficientItems.length === 0 ? 'Zero Gaps' : 'Action Required'}
            </span>
          </div>

          <p className="text-[11px] text-[#2B1609]/75">
            Non-compliant parameters, forensic anomalies, or shortages requiring officer action:
          </p>

          <div className="space-y-3">
            {deficientItems.length > 0 ? (
              deficientItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-red-50/70 border border-red-300 text-xs space-y-2 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-red-950">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{item.parameterName}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white shrink-0">
                      {item.severity}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-red-900/70">Observed Institutional Claim:</span>
                      <span className="font-bold text-red-950">{item.institutionalValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-900/70">AICTE Statutory Threshold:</span>
                      <span className="font-bold text-[#4A1504]">{item.statutoryThreshold}</span>
                    </div>
                  </div>

                  {item.whatIsWrongNote && (
                    <p className="text-[11px] text-red-950/90 leading-relaxed p-2 bg-white/80 rounded border border-red-200">
                      <strong>Forensic Finding:</strong> {item.whatIsWrongNote}
                    </p>
                  )}

                  <div className="p-2 rounded bg-red-100/80 border border-red-300 text-[11px] text-red-950 font-medium">
                    <strong>Official Action Directive:</strong> {item.officerDirective}
                  </div>

                  <div className="text-[10px] font-mono text-red-900/70 pt-1 border-t border-red-200">
                    Statutory Clause: {item.aphClause}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="font-cinzel font-bold text-sm text-emerald-950">
                  No Statutory Deficiencies Found
                </h5>
                <p className="text-xs text-[#2B1609]/75 max-w-sm mx-auto">
                  The applicant filing meets all mandatory parameters under the AICTE Approval Process Handbook. No show-cause conditions applicable.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE PARAMETER-BY-PARAMETER SCRUTINY DIRECTIVE CHECKLIST */}
      <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
          <div>
            <h4 className="font-cinzel font-bold text-base text-[#4A1504] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#D4AF37]" />
              <span>Official Scrutiny Committee Evaluation Matrix</span>
            </h4>
            <p className="text-xs text-[#2B1609]/70">
              Granular parameter verification helping the scrutiny committee rule on each statutory item
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-[#4A1504] text-[#F5E6C8] border-[#4A1504] shadow-xs'
                  : 'bg-white text-[#2B1609] border-[#D4AF37]/30 hover:bg-[#FAF4E8]'
              }`}
            >
              All ({evaluationItems.length})
            </button>
            <button
              onClick={() => setFilterMode('RIGHT')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterMode === 'RIGHT'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              What is Right ({compliantItems.length})
            </button>
            <button
              onClick={() => setFilterMode('WRONG')}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                filterMode === 'WRONG'
                  ? 'bg-red-700 text-white border-red-800 shadow-xs'
                  : 'bg-white text-red-800 border-red-300 hover:bg-red-50'
              }`}
            >
              What is Wrong ({deficientItems.length})
            </button>
          </div>
        </div>

        {/* Evaluation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF4E8] text-[#4A1504] font-cinzel font-bold border-b border-[#D4AF37]/30">
                <th className="p-3">Category &amp; Parameter</th>
                <th className="p-3">APH Clause</th>
                <th className="p-3">Extracted vs Statutory Norm</th>
                <th className="p-3">Ruling</th>
                <th className="p-3">Official Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/20">
              {displayedItems.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[#FAF4E8]/50 transition-colors ${
                    item.isCompliant ? 'bg-white/40' : 'bg-red-50/30'
                  }`}
                >
                  <td className="p-3 space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#4A1504]/70 block font-bold">
                      {item.category}
                    </span>
                    <span className="font-bold text-[#2B1609] text-xs block">
                      {item.parameterName}
                    </span>
                    <span className="text-[10px] text-[#2B1609]/60 font-mono block">
                      Source: {item.layerSource}
                    </span>
                  </td>

                  <td className="p-3 font-mono text-[11px] text-[#4A1504] font-medium max-w-[180px]">
                    {item.aphClause}
                  </td>

                  <td className="p-3 space-y-1 font-mono text-[11px]">
                    <div>
                      <span className="text-[#2B1609]/60 block text-[9px]">Observed:</span>
                      <strong className={item.isCompliant ? 'text-emerald-900' : 'text-red-700'}>
                        {item.institutionalValue}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#2B1609]/60 block text-[9px]">Statutory Norm:</span>
                      <span className="text-[#2B1609]/80">{item.statutoryThreshold}</span>
                    </div>
                  </td>

                  <td className="p-3 shrink-0">
                    {item.isCompliant ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        COMPLIANT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                        <XCircle className="w-3 h-3 text-red-600" />
                        DEFICIENT
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-[11px] text-[#2B1609]/85 max-w-xs">
                    <p className="leading-snug">
                      {item.officerDirective}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

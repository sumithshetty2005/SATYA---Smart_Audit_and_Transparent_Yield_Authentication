import React, { useState } from 'react';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Scale,
  PenTool,
  Send,
  ZoomIn,
  ZoomOut,
  FileText,
} from 'lucide-react';
import type {
  ScrutinyApplicationRecord,
  BoundingBoxOverlay,
  OfficerDecisionType,
  ScrutinyAction,
  MerkleNode,
} from '../types/merkle';
import { sha256 } from '../utils/crypto';

interface Props {
  application: ScrutinyApplicationRecord;
  onAppendOfficerDecision: (action: ScrutinyAction, newMerkleNode: MerkleNode) => void;
  onOpenReportModal?: () => void;
}

export const OfficerReviewWorkbench: React.FC<Props> = ({
  application,
  onAppendOfficerDecision,
  onOpenReportModal,
}) => {
  // Filter states for Bounding Box Overlays
  const [showBlueBoxes, setShowBlueBoxes] = useState<boolean>(true);
  const [showRedBoxes, setShowRedBoxes] = useState<boolean>(true);
  const [showYellowBoxes, setShowYellowBoxes] = useState<boolean>(true);
  const [selectedBBox, setSelectedBBox] = useState<BoundingBoxOverlay | null>(
    application.boundingBoxes[0] || null
  );

  // Accordion state
  const [expandedGapId, setExpandedGapId] = useState<string | null>(
    application.graphFindings[0]?.id || null
  );

  // Human-in-the-Loop Action Form State
  const [officerDecisionType, setOfficerDecisionType] = useState<OfficerDecisionType | null>(null);
  const [officerNote, setOfficerNote] = useState<string>('');
  const [officerSignature, setOfficerSignature] = useState<string>(
    'SHA256:OFFICER-DS-NRO-8849-AKSHAY-VERMA-2026'
  );
  const [officerRole, setOfficerRole] = useState<
    'Senior Scrutiny Officer' | 'Regional Director' | 'Member Secretary AICTE'
  >('Senior Scrutiny Officer');
  const [officerName, setOfficerName] = useState<string>('Dr. Akshay Verma, Senior Scrutiny Officer (NRO)');
  const [formError, setFormError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Canvas zoom
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Status indicator badges
  const getStatusBadge = (status: ScrutinyApplicationRecord['globalStatus']) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            PASSED
          </span>
        );
      case 'FLAGGED FOR SCRUTINY':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            FLAGGED FOR SCRUTINY
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-900 border border-red-300 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-700" />
            REJECTED
          </span>
        );
    }
  };

  // Filtered bounding boxes
  const filteredBBoxes = application.boundingBoxes.filter((b) => {
    if (b.boxColor === 'blue' && !showBlueBoxes) return false;
    if (b.boxColor === 'red' && !showRedBoxes) return false;
    if (b.boxColor === 'yellow' && !showYellowBoxes) return false;
    return true;
  });

  // Handle Officer Submission (Requirement B.4)
  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerDecisionType) {
      setFormError('Please select a formal regulatory decision (Approve, Discrepancy Notice, or Reject).');
      return;
    }
    if (!officerNote.trim()) {
      setFormError('Mandatory Officer Note is required before sealing decisions to the Merkle Tree.');
      return;
    }
    if (!officerSignature.trim()) {
      setFormError('Officer Digital Signature DSC token is mandatory.');
      return;
    }

    setFormError(null);

    const timestamp = new Date().toISOString();
    const actionId = `ACT-AICTE-${Date.now()}`;
    const payloadContent = JSON.stringify({
      step: 5,
      actionId,
      actionType: officerDecisionType,
      applicationId: application.applicationId,
      institution: application.institutionName,
      officer: officerName,
      role: officerRole,
      signature: officerSignature,
      note: officerNote,
      timestamp,
    });

    const payloadHash = sha256(payloadContent);
    const leafHash = sha256(`LEAF_5_${payloadContent}`);
    const lastBlock = application.merkleNodes[application.merkleNodes.length - 1];

    const newMerkleNode: MerkleNode = {
      id: `block-${String(application.merkleNodes.length + 1).padStart(3, '0')}`,
      blockHeight: application.merkleNodes.length + 1,
      stepNumber: 5,
      stepTitle: 'Step 5: Officer Manual Override / Approval Signature Hash',
      eventType: 'OFFICER_SCRUTINY_DECISION',
      hash: leafHash,
      parentHash: null,
      previousHash: lastBlock ? lastBlock.hash : '0x0000000000000000000000000000000000000000',
      payloadHash,
      timestamp,
      nonce: 5242880 + Math.floor(Math.random() * 1000),
      status: officerDecisionType === 'REJECT' ? 'FLAGGED_TAMPERED' : 'VERIFIED',
      leafStatus: 'VALID',
      leftHash: null,
      rightHash: null,
      merkleProof: ['0x8849bca01284...', '0x10b9812626...'],
      merkleRoot: leafHash,
      payloadSummary: `Officer Decision: ${officerDecisionType} by ${officerName} (${officerRole}). Remarks: "${officerNote.slice(0, 75)}..."`,
      metadata: {
        sourceModule: 'AICTE Scrutiny Officer Review Workbench',
        officerSignature,
        officerRemarks: officerNote,
        decisionRecorded: officerDecisionType,
        signedAuthority: officerRole,
      },
    };

    const actionRecord: ScrutinyAction = {
      actionId,
      actionType: officerDecisionType,
      applicationId: application.applicationId,
      institutionName: application.institutionName,
      officerName,
      officerRole,
      officerSignature,
      notes: officerNote,
      timestamp,
      resultingLeafHash: leafHash,
    };

    onAppendOfficerDecision(actionRecord, newMerkleNode);
    setSubmissionSuccess(
      `Regulatory Order [${officerDecisionType}] cryptographically committed to Block #${newMerkleNode.blockHeight} (Hash: ${leafHash.slice(0, 16)}...).`
    );
    setOfficerNote('');
    setOfficerDecisionType(null);

    setTimeout(() => {
      setSubmissionSuccess(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 font-sans-modern">
      {/* 1. APPLICATION OVERVIEW HEADER (Requirement B.1) */}
      <div className="p-5 md:p-6 rounded-2xl bg-white/85 backdrop-blur-md border-2 border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                APPLICATION DOSSIER
              </span>
              <span className="font-mono text-xs font-bold text-[#4A1504] bg-[#FAF4E8] px-2.5 py-0.5 rounded border border-[#D4AF37]/40">
                {application.applicationId}
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">• {application.region}</span>
            </div>

            <h1 className="font-cinzel font-extrabold text-xl sm:text-2xl text-[#4A1504]">
              {application.institutionName}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#2B1609]/80 font-sans-modern">
              <span>
                <strong>Program:</strong> {application.programType}
              </span>
              <span className="text-[#D4AF37]">•</span>
              <span>
                <strong>Established:</strong> {application.establishedYear}
              </span>
              <span className="text-[#D4AF37]">•</span>
              <span>
                <strong>Approved Intake:</strong> {application.sanctionedIntake} Seats
              </span>
            </div>
          </div>

          {/* Right: Global Compliance Status Indicator & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="text-right sm:text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A1504] tracking-wider block">
                Global Compliance Status
              </span>
              {getStatusBadge(application.globalStatus)}
            </div>

            {onOpenReportModal && (
              <button
                type="button"
                onClick={onOpenReportModal}
                className="mt-1 sm:mt-0 px-3.5 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#D4AF37] hover:bg-[#C59B27] text-[#4A1504] border border-[#4A1504]/30 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Inspection Order</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. EVIDENCE DISPLAY & INTERACTIVE BOUNDING-BOX OVERLAY (Requirement B.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Document Viewer Canvas (Col 8) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            {/* Canvas Toolbar & Bounding Box Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Multi-Layer Forensic Document Viewer
                </h3>
              </div>

              {/* Layer Filter Toggles */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Blue Boxes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowBlueBoxes(!showBlueBoxes)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    showBlueBoxes
                      ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                      : 'bg-white text-blue-700 border-blue-300 opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-300" />
                  <span>Blue: LayoutLMv3</span>
                </button>

                {/* Red Boxes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRedBoxes(!showRedBoxes)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    showRedBoxes
                      ? 'bg-red-600 text-white border-red-700 shadow-2xs'
                      : 'bg-white text-red-700 border-red-300 opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span>Red: ELA Forgery</span>
                </button>

                {/* Yellow Boxes Toggle */}
                <button
                  type="button"
                  onClick={() => setShowYellowBoxes(!showYellowBoxes)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                    showYellowBoxes
                      ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                      : 'bg-white text-amber-800 border-amber-300 opacity-60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-300" />
                  <span>Yellow: YOLO &amp; CAD</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 border-l border-[#D4AF37]/30 pl-2">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 15))}
                    className="p-1 hover:bg-[#FAF4E8] rounded text-[#4A1504] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] text-[#4A1504] w-9 text-center">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 15))}
                    className="p-1 hover:bg-[#FAF4E8] rounded text-[#4A1504] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Document Interactive Page Canvas */}
            <div className="relative overflow-x-auto bg-[#FAF4E8]/60 p-4 rounded-xl border border-[#D4AF37]/30 flex justify-center">
              <div
                style={{
                  width: `${600 * (zoomLevel / 100)}px`,
                  minHeight: `${780 * (zoomLevel / 100)}px`,
                  backgroundImage: 'radial-gradient(#D4AF37 0.75px, transparent 0.75px)',
                  backgroundSize: '16px 16px',
                }}
                className="relative bg-white rounded-lg shadow-xl border-2 border-[#D4AF37]/40 p-8 select-none transition-all duration-200"
              >
                {/* Official Letterhead Header */}
                <div className="text-center pb-4 border-b-2 border-[#4A1504]/20 space-y-1">
                  <div className="text-[10px] font-vedic tracking-wider text-[#4A1504] uppercase font-bold">
                    भारत सरकार • अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE)
                  </div>
                  <h4 className="font-cinzel font-bold text-sm text-[#4A1504] tracking-tight">
                    MANDATORY DISCLOSURE &amp; COMPLIANCE AFFIDAVIT
                  </h4>
                  <p className="text-[9px] font-mono text-[#2B1609]/70">
                    Form Reference: AICTE/NRO/2026/AFF-8849201 • Stamp Reference: DL-REV-2024-9901
                  </p>
                </div>

                {/* Simulated Document Body Rows */}
                <div className="mt-6 space-y-5 text-xs text-[#2B1609]/85 font-serif">
                  <div className="p-2.5 bg-[#FAF4E8]/70 rounded border border-[#D4AF37]/30 text-[11px] leading-relaxed">
                    <strong>APPLICANT TRUST:</strong> Vidyapeeth Educational Society (Reg. Act 1860, No. 4410/2008).
                    Hereby submits sworn cadastral and architectural disclosure for Approval 2026–27.
                  </div>

                  {/* Section A: Land Title Schedule Table */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase text-[#4A1504] tracking-wider">
                      SCHEDULE I — LAND TENURE &amp; SURVEY DEMARCATION
                    </span>
                    <table className="w-full text-[10px] font-mono border-collapse border border-[#D4AF37]/40">
                      <thead>
                        <tr className="bg-[#FAF4E8] text-[#4A1504]">
                          <th className="border border-[#D4AF37]/30 p-1 text-left">Plot / Khasra No.</th>
                          <th className="border border-[#D4AF37]/30 p-1 text-left">Stated Land Area</th>
                          <th className="border border-[#D4AF37]/30 p-1 text-left">Title Deed Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-[#D4AF37]/30 p-1 font-semibold">Khasra 884/2A (Panchkula)</td>
                          <td className="border border-[#D4AF37]/30 p-1 text-red-700 font-bold">7.20 ACRES [Altered]</td>
                          <td className="border border-[#D4AF37]/30 p-1">14-Feb-2012</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Section B: Architectural Covered Area */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase text-[#4A1504] tracking-wider">
                      SCHEDULE II — ARCHITECTURAL BUILT-UP AUDIT
                    </span>
                    <div className="p-2 bg-white rounded border border-[#D4AF37]/30 text-[10px] space-y-1 font-mono">
                      <div>Total Built-Up Carpet Area: <strong>19,450 m²</strong> across Blocks A, B &amp; C.</div>
                      <div>Approved Undergraduate Technical Intake: <strong>420 Seats</strong>.</div>
                    </div>
                  </div>

                  {/* Section C: Machinery & Labs Verification */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-sans font-bold uppercase text-[#4A1504] tracking-wider">
                      SCHEDULE III — WORKSHOP ASSETS &amp; CNC MACHINERY
                    </span>
                    <div className="p-2 bg-white rounded border border-[#D4AF37]/30 text-[10px] space-y-1 font-mono">
                      <div>Central Workshop CNC Machining Center: <strong>1 Unit</strong> (Deficit: 2 Mandated Units).</div>
                      <div>Secondary Emergency Egress Corridor: <strong>1.4m width</strong> (Corridor Blocked).</div>
                    </div>
                  </div>

                  {/* Stamp & Seal Area at bottom */}
                  <div className="pt-6 flex justify-between items-end text-[10px] font-mono">
                    <div className="w-36 h-20 border-2 border-dashed border-[#D4AF37]/60 rounded p-1.5 text-center text-[#2B1609]/60 flex flex-col items-center justify-center">
                      <span className="font-bold text-[9px] text-[#4A1504]">SUB-REGISTRAR SEAL</span>
                      <span className="text-[8px] text-red-600 font-semibold">[ELA Discontinuity Zone]</span>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-[#4A1504]">For Vidyapeeth Trust</div>
                      <div className="text-[9px] text-[#2B1609]/60">Digitally Signed DSC Class-3</div>
                    </div>
                  </div>
                </div>

                {/* INTERACTIVE BOUNDING BOX OVERLAYS */}
                {filteredBBoxes.map((box) => {
                  const isSelected = selectedBBox?.id === box.id;
                  const [top, left, width, height] = box.bbox;

                  let borderClass = 'border-blue-500 bg-blue-500/15 text-blue-900';
                  if (box.boxColor === 'red') {
                    borderClass = 'border-red-600 bg-red-600/20 text-red-950 animate-pulse';
                  } else if (box.boxColor === 'yellow') {
                    borderClass = 'border-amber-500 bg-amber-500/20 text-amber-950';
                  }

                  return (
                    <div
                      key={box.id}
                      onClick={() => setSelectedBBox(box)}
                      style={{
                        top: `${top}%`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      className={`absolute border-2 rounded cursor-pointer transition-all ${borderClass} ${
                        isSelected ? 'ring-3 ring-[#4A1504] z-20 scale-[1.02]' : 'hover:opacity-90 z-10'
                      }`}
                      title={`${box.label}: ${box.value}`}
                    >
                      <span
                        className={`absolute -top-3.5 left-1 text-[8px] font-mono font-bold px-1 py-0.2 rounded shadow-xs ${
                          box.boxColor === 'blue'
                            ? 'bg-blue-600 text-white'
                            : box.boxColor === 'red'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {box.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Bounding Box Details Drawer */}
            {selectedBBox && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                  selectedBBox.boxColor === 'blue'
                    ? 'bg-blue-50/80 border-blue-300 text-blue-950'
                    : selectedBBox.boxColor === 'red'
                    ? 'bg-red-50/80 border-red-300 text-red-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        selectedBBox.boxColor === 'blue'
                          ? 'bg-blue-600'
                          : selectedBBox.boxColor === 'red'
                          ? 'bg-red-600'
                          : 'bg-amber-600'
                      }`}
                    />
                    <span>{selectedBBox.label} ({selectedBBox.boxType})</span>
                  </div>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/80 border border-current">
                    Confidence: {(selectedBBox.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="opacity-70 block">Target / Extracted Value:</span>
                    <span className="font-mono font-bold">{selectedBBox.value}</span>
                  </div>
                  {selectedBBox.statutoryClause && (
                    <div>
                      <span className="opacity-70 block">Statutory Reference:</span>
                      <span className="font-mono font-bold">{selectedBBox.statutoryClause}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] leading-relaxed pt-1 border-t border-current/20">
                  {selectedBBox.evidenceNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: GraphRAG Findings & Human-in-the-Loop Action Panel (Col 4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 3. GRAPHRAG FINDINGS & XAI CITATION ACCORDION (Requirement B.3) */}
          <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  GraphRAG &amp; XAI Statutory Violations
                </h3>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-800 rounded">
                {application.graphFindings.length} Gaps Flagged
              </span>
            </div>

            <p className="text-[11px] text-[#2B1609]/75">
              Knowledge graph traversal linking application parameters directly to APH 2024–2027 statutory clauses:
            </p>

            {/* Accordion Items */}
            <div className="space-y-2">
              {application.graphFindings.map((finding) => {
                const isExpanded = expandedGapId === finding.id;
                const isCritical = finding.severity === 'CRITICAL';

                return (
                  <div
                    key={finding.id}
                    className={`rounded-xl border transition-all overflow-hidden ${
                      isCritical ? 'border-red-300 bg-red-50/40' : 'border-amber-300 bg-amber-50/40'
                    }`}
                  >
                    {/* Header trigger */}
                    <button
                      type="button"
                      onClick={() => setExpandedGapId(isExpanded ? null : finding.id)}
                      className="w-full p-3 text-left flex items-start justify-between gap-2 cursor-pointer hover:bg-white/60 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-red-600' : 'bg-amber-600'
                            }`}
                          />
                          <span className="font-bold text-xs text-[#4A1504]">{finding.ruleTitle}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#2B1609]/70 block">
                          {finding.clauseReference}
                        </span>
                      </div>
                      <div className="shrink-0 pt-0.5 text-[#4A1504]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expandable Accordion Body */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 space-y-2 text-xs border-t border-[#D4AF37]/20 bg-white/70">
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-[#2B1609]/60">Institutional Value:</span>
                            <span className="font-bold text-red-700">{finding.extractedValue}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#2B1609]/60">Statutory Threshold:</span>
                            <span className="font-bold text-emerald-700">{finding.statutoryThreshold}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#2B1609]/60">Variance Delta:</span>
                            <span className="font-bold text-[#4A1504]">{finding.discrepancyDelta}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#2B1609]/85 leading-snug">
                          {finding.explanation}
                        </p>

                        <div className="p-2 rounded bg-red-100/70 border border-red-300 text-[10px] text-red-950 font-medium">
                          <strong>Statutory Penalty Notice:</strong> {finding.legalWarning}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. HUMAN-IN-THE-LOOP ACTION PANEL (Requirement B.4) */}
          <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-md border-2 border-[#D4AF37]/50 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Human-in-the-Loop Scrutiny Order
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                DSC Ready
              </span>
            </div>

            {/* Officer Persona Selector */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase font-bold text-[#4A1504] block">
                Active Officer Authority:
              </label>
              <select
                value={officerRole}
                onChange={(e) => {
                  const role = e.target.value as any;
                  setOfficerRole(role);
                  if (role === 'Senior Scrutiny Officer') {
                    setOfficerName('Dr. Akshay Verma, Senior Scrutiny Officer (NRO)');
                    setOfficerSignature('SHA256:OFFICER-DS-NRO-8849-AKSHAY-VERMA-2026');
                  } else if (role === 'Regional Director') {
                    setOfficerName('Dr. S. K. Goel, Regional Officer & Director (NRO)');
                    setOfficerSignature('SHA256:REGIONAL-DIR-NRO-SK-GOEL-2026');
                  } else {
                    setOfficerName('Prof. T. G. Sitharam, Chairman AICTE');
                    setOfficerSignature('SHA256:CHAIRMAN-AICTE-EXEC-COUNCIL-2026');
                  }
                }}
                className="w-full p-2 bg-[#FAF4E8] border border-[#D4AF37]/40 rounded-xl text-xs text-[#2B1609] font-medium focus:ring-2 focus:ring-[#D4AF37] focus:outline-none cursor-pointer"
              >
                <option value="Senior Scrutiny Officer">Senior Scrutiny Officer (Technical Inspection Cell)</option>
                <option value="Regional Director">Regional Director (Regional Technical Office)</option>
                <option value="Member Secretary AICTE">Member Secretary &amp; Chairman (AICTE HQ)</option>
              </select>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-3">
              {/* Three Mandatory Action Buttons */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#4A1504] block">
                  Select Regulatory Order:
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {/* Approve */}
                  <button
                    type="button"
                    onClick={() => setOfficerDecisionType('APPROVE')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-cinzel font-bold flex items-center justify-between transition-all cursor-pointer border ${
                      officerDecisionType === 'APPROVE'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Approve Application</span>
                    </span>
                    <span className="text-[10px] font-mono">Grant EoA</span>
                  </button>

                  {/* Issue Scrutiny Discrepancy Notice */}
                  <button
                    type="button"
                    onClick={() => setOfficerDecisionType('DISCREPANCY_NOTICE')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-cinzel font-bold flex items-center justify-between transition-all cursor-pointer border ${
                      officerDecisionType === 'DISCREPANCY_NOTICE'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md ring-2 ring-amber-400'
                        : 'bg-white hover:bg-amber-50 text-amber-900 border-amber-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Issue Scrutiny Discrepancy Notice</span>
                    </span>
                    <span className="text-[10px] font-mono">15-Day SAC</span>
                  </button>

                  {/* Reject */}
                  <button
                    type="button"
                    onClick={() => setOfficerDecisionType('REJECT')}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-cinzel font-bold flex items-center justify-between transition-all cursor-pointer border ${
                      officerDecisionType === 'REJECT'
                        ? 'bg-red-700 text-white border-red-800 shadow-md ring-2 ring-red-500'
                        : 'bg-white hover:bg-red-50 text-red-900 border-red-300'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span>Reject Application</span>
                    </span>
                    <span className="text-[10px] font-mono">Fraud / Deficit</span>
                  </button>
                </div>
              </div>

              {/* Digital Signature DSC Input */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] uppercase font-bold text-[#4A1504] block">
                  Officer Cryptographic Signature Token:
                </label>
                <input
                  type="text"
                  value={officerSignature}
                  onChange={(e) => setOfficerSignature(e.target.value)}
                  className="w-full p-2 bg-white border border-[#D4AF37]/40 rounded-xl text-[11px] font-mono text-[#4A1504] focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="SHA256:OFFICER-DS-KEY..."
                  required
                />
              </div>

              {/* Mandatory Officer Note Field */}
              <div className="space-y-1 text-xs">
                <label className="text-[10px] uppercase font-bold text-[#4A1504] block">
                  Mandatory Scrutiny Finding &amp; Statutory Directives:
                </label>
                <textarea
                  rows={3}
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D4AF37]/40 rounded-xl text-xs text-[#2B1609] placeholder:text-[#2B1609]/40 focus:ring-2 focus:ring-[#D4AF37] focus:outline-none"
                  placeholder="Record formal statutory reasoning citing APH Clauses before appending to Merkle Tree..."
                  required
                />
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-100 border border-red-300 text-red-900 text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-700 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {submissionSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{submissionSuccess}</span>
                </div>
              )}

              {/* Commit to Merkle Tree Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Sign Order &amp; Commit Leaf to Merkle Tree</span>
              </button>
            </form>

            {/* Prior Decisions History */}
            {application.actionsHistory.length > 0 && (
              <div className="pt-2 border-t border-[#D4AF37]/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#4A1504] block">
                  Committed Order History ({application.actionsHistory.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {application.actionsHistory.map((act) => (
                    <div
                      key={act.actionId}
                      className="p-2 bg-[#FAF4E8] rounded-lg border border-[#D4AF37]/30 text-[10px] space-y-0.5"
                    >
                      <div className="flex justify-between font-bold text-[#4A1504]">
                        <span>{act.actionType}</span>
                        <span className="font-mono text-[9px]">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[10px] text-[#2B1609]/80 italic">"{act.notes}"</p>
                      <div className="font-mono text-[8px] text-[#4A1504]/70 truncate">
                        Leaf: {act.resultingLeafHash}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

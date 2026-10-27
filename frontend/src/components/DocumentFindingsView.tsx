import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
  Database,
  Network,
  Eye,
  Scroll,
  Printer,
  RotateCcw,
  Award,
  ClipboardList,
} from 'lucide-react';
import { DecisionSupportMatrix } from './DecisionSupportMatrix';
import { Layer3SourceVerification } from './Layer3SourceVerification';
import { Layer5VisionCV } from './Layer5VisionCV';
import type { ExtractedPayload, ELAPatch, GraphNode, CADPolygon, YOLOAsset, MerkleBlock, APHCitation } from '../types/compliance';

export interface ScrutinyResult {
  fileName: string;
  fileSizeFormatted: string;
  pageCount: number;
  uploadedAt: string;
  verdict: 'PASSED' | 'DEFICIENT' | 'TAMPERED_FRAUD';
  overallScore: number;
  healthIndex: {
    score: number;
    grade: 'A (Exemplary)' | 'B (Conditional)' | 'C (Critical Risk)';
    riskLevel: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
    recommendations: string[];
  };
  layer1: {
    tokensCount: number;
    tokens: {
      id: string;
      text: string;
      bbox: [number, number, number, number];
      label: 'HEADER' | 'KEY' | 'VALUE' | 'TABLE_CELL' | 'SEAL' | 'SIGNATURE';
      confidence: number;
      highlight?: boolean;
    }[];
    payload: ExtractedPayload;
  };
  layer2: {
    elaAnomalyScore: number;
    tamperingVerdict: 'CLEAN' | 'FLAGGED_FORGERY';
    laplacianBlurScore: number;
    artificialFlatteningDetected: boolean;
    localizedBlurRegion: string;
    pHashSignature: string;
    pHashMatchPercent: number;
    patches: ELAPatch[];
  };
  layer3: {
    digiLockerMatch: boolean;
    authoritativeAcreage: number;
    claimedAcreage: number;
    pkiValid: boolean;
    pkiSigner: string;
    postSigningBytesAltered: boolean;
    qrPayloadValid: boolean;
    sourceTrustScore: number;
  };
  layer4: {
    nodes: GraphNode[];
    citations: APHCitation[];
    compliancePercent: number;
  };
  layer5: {
    cadTotalAreaSqm: number;
    carpetAreaSqm: number;
    circulationRatio: number;
    nearestFireExitM: number;
    geofenceValid: boolean;
    gpsCoords: string;
    gpsDistanceMeters: number;
    polygons: CADPolygon[];
    yoloDetections: YOLOAsset[];
  };
  layer6: {
    merkleRoot: string;
    blocks: MerkleBlock[];
  };
}

interface Props {
  result: ScrutinyResult;
  onReset: () => void;
  onOpenReportModal: () => void;
}

export const DocumentFindingsView: React.FC<Props> = ({
  result,
  onReset,
  onOpenReportModal,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'decisionBrief' | 'layer2' | 'layer3' | 'layer4' | 'layer5' | 'layer6'>('summary');
  const [elaSliderPos, setElaSliderPos] = useState<number>(50);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  const needsForensicReview = result.layer2.tamperingVerdict !== 'CLEAN';
  const needsSourceReview = !result.layer3.pkiValid || !result.layer3.digiLockerMatch || result.layer3.postSigningBytesAltered || !result.layer3.qrPayloadValid;
  const needsRuleReview = result.layer4.citations.length > 0;
  const needsEvidenceReview = !result.layer5.geofenceValid || result.layer5.nearestFireExitM <= 0;
  const hasReviewConcerns = needsForensicReview || needsSourceReview || needsRuleReview || needsEvidenceReview;
  const decisionBriefActions = [
    ...(needsRuleReview ? result.layer4.citations.map((citation) => ({
      id: `rule-${citation.id}`,
      priority: citation.severity.toUpperCase().includes('CRITICAL') ? 'High' : 'Review',
      source: `${citation.aphClause} · ${citation.ruleTitle}`,
      action: `Compare the cited threshold (${citation.statutoryThreshold}) with the referenced evidence (${citation.institutionalValue}); verify the clause and interpretation against the current official handbook.`,
    })) : []),
    ...(needsForensicReview ? [{
      id: 'forensics-review',
      priority: 'High',
      source: `Layer 2 · ELA ${result.layer2.elaAnomalyScore}/100`,
      action: 'Inspect the flagged regions and original pages in Visual Forensics. ELA and smoothing signals require human review and do not prove alteration.',
    }] : []),
    ...(!result.layer3.pkiValid ? [{
      id: 'signature-review',
      priority: 'Review',
      source: 'Layer 3 · Digital signature',
      action: 'Verify signature evidence against a trusted certificate chain. If verification was unavailable, obtain a verifiable original before relying on the claim.',
    }] : []),
    ...(!result.layer3.digiLockerMatch ? [{
      id: 'issuer-review',
      priority: 'Review',
      source: 'Layer 3 · Issuer or registry match',
      action: 'Confirm the source record with the issuing authority. An unavailable or absent match alone does not establish that a document is invalid.',
    }] : []),
    ...(result.layer3.postSigningBytesAltered ? [{
      id: 'post-sign-review',
      priority: 'High',
      source: 'Layer 3 · Post-signing changes',
      action: 'Review the reported byte changes and request the issuer-signed original or an explanation for the revision.',
    }] : []),
    ...(!result.layer3.qrPayloadValid ? [{
      id: 'qr-review',
      priority: 'Review',
      source: 'Layer 3 · QR payload',
      action: 'Check whether a QR payload was present and, if so, validate its destination and issuer response before using it as evidence.',
    }] : []),
    ...(!result.layer5.geofenceValid ? [{
      id: 'location-review',
      priority: 'Review',
      source: 'Layer 5 · Location evidence',
      action: 'Review the source image and location metadata. Missing or inconclusive GPS data should remain unverified, not be treated as a failure.',
    }] : []),
    ...(result.layer5.nearestFireExitM <= 0 ? [{
      id: 'egress-review',
      priority: 'Review',
      source: 'Layer 5 · Fire-egress evidence',
      action: 'Confirm the approved plan scale and measured route with a qualified reviewer; do not infer a route distance when it was not assessed.',
    }] : []),
  ];
  const reviewerPosture = hasReviewConcerns
    ? 'Continue review and resolve the listed evidence questions before recording a formal outcome.'
    : 'No major flags appear in the checks represented here. Confirm source evidence and any unavailable checks before recording an outcome.';

  return (
    <div className="space-y-6 font-sans-modern scroll-mt-6" id="findings-section">
      <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p><strong>Simulated showcase scenario.</strong> This illustrative clean/tampered example is not generated from the selected upload and does not represent live AICTE, DigiLocker, registry, or issuer verification.</p>
      </div>
      {/* Findings Header Banner */}
      <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-[#D4AF37]/50 shadow-xl relative overflow-hidden">
        {/* Subtle Mandala Watermark */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 pointer-events-none opacity-10 bg-contain bg-no-repeat"
          style={{ backgroundImage: `url('/assets/mandala.png')` }}
        />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded uppercase">
                AICTE Regulatory Scrutiny Dossier
              </span>
              <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#4A1504] border border-[#D4AF37]/40 text-[10px] font-mono font-bold rounded">
                File: {result.fileName}
              </span>
              <span className="text-[10px] text-[#2B1609]/60 font-mono">
                {result.fileSizeFormatted} • {result.pageCount} Pages • {result.uploadedAt}
              </span>
            </div>

            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Multi-Layer Scrutiny Findings & Forensic Audit Report
            </h2>

            <p className="text-xs text-[#2B1609]/75 font-serif max-w-2xl">
              Evaluated under AICTE Approval Process Handbook (APH 2024–2027 Gazette Edition). Complete cross-layer 
              Findings across document consistency, visual forensics, source checks, regulatory rules, and infrastructure evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Verdict Card */}
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 shadow-xs ${
              result.verdict === 'PASSED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              {result.verdict === 'PASSED' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 animate-bounce" />
              )}
              <div>
                <span className="block text-[10px] uppercase font-bold opacity-75">Statutory Verdict</span>
                <span className="font-cinzel font-bold text-sm tracking-wide">
                  {result.verdict.replace('_', ' ')} ({result.overallScore}%)
                </span>
                <span className="block text-[9px] font-mono opacity-80">
                  IHI Grade: {result.healthIndex.grade}
                </span>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Inspection Order</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-white/80 hover:bg-[#FAF4E8] text-[#4A1504] border border-[#D4AF37]/50 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New PDF</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'summary', label: 'Execution Dashboard', icon: <Award className="w-4 h-4" /> },
            {
              id: 'decisionBrief',
              label: 'Decision Brief',
              icon: <ClipboardList className="w-4 h-4" />,
              badge: `${decisionBriefActions.length} Actions`,
              badgeColor: decisionBriefActions.length === 0 ? 'bg-emerald-600' : 'bg-amber-600',
            },
            {
              id: 'layer2',
              label: 'ELA Visual Forensics',
              icon: <Fingerprint className="w-4 h-4" />,
              badge: result.layer2.tamperingVerdict === 'CLEAN' ? 'Clean' : 'Tampered',
              badgeColor: result.layer2.tamperingVerdict === 'CLEAN' ? 'bg-emerald-600' : 'bg-red-600',
            },
            {
              id: 'layer3',
              label: 'DigiLocker & PKI',
              icon: <Database className="w-4 h-4" />,
              badge: result.layer3.pkiValid ? 'Valid' : 'Digest Error',
              badgeColor: result.layer3.pkiValid ? 'bg-emerald-600' : 'bg-red-600',
            },
            {
              id: 'layer4',
              label: 'GraphRAG APH Rules',
              icon: <Network className="w-4 h-4" />,
              badge: `${result.layer4.citations.length} Gaps`,
              badgeColor: result.layer4.citations.length === 0 ? 'bg-emerald-600' : 'bg-red-600',
            },
            { id: 'layer5', label: 'Vision CV & CAD', icon: <Eye className="w-4 h-4" /> },
            { id: 'layer6', label: 'Merkle Audit Chain', icon: <Scroll className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4A1504] text-[#F5E6C8] shadow-md border border-[#D4AF37]'
                    : 'bg-white/60 hover:bg-[#FAF4E8] text-[#2B1609]/80 border border-[#D4AF37]/25'
                }`}
              >
                <span className={isActive ? 'text-[#D4AF37]' : 'text-[#4A1504]'}>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono text-white ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content: Execution Dashboard */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Integrated Decision Support Matrix at Top */}
          <DecisionSupportMatrix
            result={result}
            onOpenReportModal={onOpenReportModal}
          />
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A1504] block">Extracted Land Holdings</span>
              <div className="font-cinzel text-xl font-bold text-[#2B1609]">
                {result.layer1.payload.landAreaAcres} Acres
              </div>
              <span className="text-[10px] text-[#2B1609]/60 font-mono">
                {result.layer1.payload.surveyNumber}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A1504] block">Instructional Built-Up</span>
              <div className="font-cinzel text-xl font-bold text-[#2B1609]">
                {result.layer1.payload.builtUpAreaSqm.toLocaleString()} m²
              </div>
              <span className="text-[10px] text-[#2B1609]/60 font-mono">
                Circulation: {(result.layer1.payload.circulationAreaRatio * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A1504] block">Faculty Cadre Ratio</span>
              <div className="font-cinzel text-xl font-bold text-[#2B1609]">
                {result.layer1.payload.cadre.ratio.split(' ')[0]}
              </div>
              <span className={`text-[10px] font-bold ${result.layer1.payload.cadre.cadreCompliant ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.layer1.payload.cadre.cadreCompliant ? '1:2:6 Statutory Compliant' : 'Deficient Cadre Skew'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A1504] block">Forensics ELA Anomaly</span>
              <div className={`font-cinzel text-xl font-bold ${result.layer2.tamperingVerdict === 'CLEAN' ? 'text-emerald-700' : 'text-red-700'}`}>
                {result.layer2.elaAnomalyScore}/100
              </div>
              <span className="text-[10px] text-[#2B1609]/60 font-mono">
                Laplacian: {result.layer2.laplacianBlurScore}
              </span>
            </div>
          </div>

          {/* Institutional Health Index (IHI) Card */}
          <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
                  Institutional Health Index (IHI) Evaluation
                </h3>
                <p className="text-xs text-[#2B1609]/70">
                  Four-vector statutory index aggregating Regulatory Compliance (35%), Forensics (25%), Crypto (20%), and Infrastructure Stability (20%)
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                result.healthIndex.riskLevel === 'LOW_RISK'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.healthIndex.grade}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] block">
                Statutory Corrective Actions & Findings:
              </span>
              <ul className="space-y-1.5 text-[11px] text-[#2B1609]/85">
                {result.healthIndex.recommendations.map((rec, rIdx) => (
                  <li key={rIdx} className="flex items-start gap-2 p-2 bg-[#FAF4E8] rounded-lg border border-[#D4AF37]/20">
                    <span className="text-[#D4AF37] font-bold">▸</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Citations List if any */}
          {result.layer4.citations.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 space-y-3">
              <h4 className="font-cinzel font-bold text-sm text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700" />
                Statutory Non-Compliance Citations ({result.layer4.citations.length} Clauses Flagged)
              </h4>
              <div className="space-y-2">
                {result.layer4.citations.map((c) => (
                  <div key={c.id} className="p-3 bg-white/80 rounded-xl border border-red-300 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-red-900">
                      <span>{c.aphClause}: {c.ruleTitle}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-red-700 text-white">{c.severity}</span>
                    </div>
                    <div className="text-[11px] text-[#2B1609]">
                      Statutory Norm: <strong className="text-[#4A1504]">{c.statutoryThreshold}</strong> vs Verified: <strong className="text-red-700">{c.institutionalValue}</strong> ({c.delta})
                    </div>
                    <p className="text-[10px] text-[#2B1609]/70 italic border-l-2 border-[#D4AF37] pl-2 mt-1">
                      "{c.legalEnforcementStatement}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Decision Brief for human review */}
      {activeTab === 'decisionBrief' && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#D4AF37]/45 bg-white/75 p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#9A7429]">Human decision support · {result.fileName}</p>
                <h3 className="mt-1 font-cinzel text-xl font-bold text-[#4A1504]">Decision Brief &amp; Reviewer Action List</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#2B1609]/75">
                  This brief consolidates the current document, forensics, source, rule, and infrastructure outputs. It organizes questions for the reviewing official; it does not issue or replace a formal decision.
                </p>
              </div>
              <div className={`shrink-0 rounded-xl border px-4 py-3 ${hasReviewConcerns ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-emerald-300 bg-emerald-50 text-emerald-950'}`}>
                <span className="block text-[9px] font-bold uppercase tracking-wider opacity-70">Suggested reviewer posture</span>
                <span className="mt-1 block max-w-xs text-xs font-semibold leading-relaxed">{reviewerPosture}</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF4E8] p-3">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-[#765A35]">Current system output</span>
                <strong className="mt-1 block font-cinzel text-sm text-[#4A1504]">{result.verdict.replace('_', ' ')}</strong>
                <span className="text-[10px] text-[#2B1609]/65">{result.overallScore}% · {result.healthIndex.grade}</span>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF4E8] p-3">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-[#765A35]">APH citations</span>
                <strong className="mt-1 block font-cinzel text-sm text-[#4A1504]">{result.layer4.citations.length} flagged</strong>
                <span className="text-[10px] text-[#2B1609]/65">Review cited clauses and source material</span>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF4E8] p-3">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-[#765A35]">Forensics signal</span>
                <strong className={`mt-1 block font-cinzel text-sm ${needsForensicReview ? 'text-red-800' : 'text-emerald-800'}`}>{result.layer2.tamperingVerdict.replace('_', ' ')}</strong>
                <span className="text-[10px] text-[#2B1609]/65">ELA anomaly score {result.layer2.elaAnomalyScore}/100</span>
              </div>
              <div className="rounded-xl border border-[#D4AF37]/30 bg-[#FAF4E8] p-3">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-[#765A35]">Follow-up actions</span>
                <strong className="mt-1 block font-cinzel text-sm text-[#4A1504]">{decisionBriefActions.length}</strong>
                <span className="text-[10px] text-[#2B1609]/65">Evidence checks to resolve or document</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#D4AF37]/40 bg-white/70 p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#D4AF37]/25 pb-3">
              <div>
                <h4 className="font-cinzel text-sm font-bold text-[#4A1504]">Evidence summary by review layer</h4>
                <p className="mt-1 text-[10px] text-[#2B1609]/65">Select a layer tab above to inspect the underlying details.</p>
              </div>
              <span className="text-[9px] font-mono text-[#765A35]">{result.pageCount} pages · {result.layer1.tokensCount} extracted items</span>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">Document extraction</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">{result.layer1.payload.institutionName}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/70">{result.layer1.payload.programme} · {result.layer1.payload.landAreaAcres} acres · {result.layer1.payload.builtUpAreaSqm.toLocaleString()} m² built-up · survey {result.layer1.payload.surveyNumber}</p>
              </article>
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">Visual forensics</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">{result.layer2.tamperingVerdict.replace('_', ' ')} · ELA {result.layer2.elaAnomalyScore}/100</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/70">Sharpness variance {result.layer2.laplacianBlurScore} · {result.layer2.patches.length} marked region(s). Signals need source-page review.</p>
              </article>
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">Issuer &amp; signature evidence</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">Registry {result.layer3.digiLockerMatch ? 'match reported' : 'not matched'} · PKI {result.layer3.pkiValid ? 'valid reported' : 'not verified'}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/70">Post-signing change: {result.layer3.postSigningBytesAltered ? 'reported' : 'not reported'} · QR payload: {result.layer3.qrPayloadValid ? 'valid reported' : 'not verified'}.</p>
              </article>
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">APH rule review</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">{result.layer4.compliancePercent}% rule score · {result.layer4.citations.length} citation(s)</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/70">The official should confirm each cited clause, threshold, and interpretation against the current authoritative APH and applicable AICTE Act material.</p>
              </article>
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">Infrastructure evidence</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">{result.layer5.yoloDetections.length} facility detection(s) · CAD area {result.layer5.cadTotalAreaSqm > 0 ? `${result.layer5.cadTotalAreaSqm.toLocaleString()} m²` : 'not assessed'}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/70">Location {result.layer5.geofenceValid ? 'within reported tolerance' : 'not verified'} · fire-egress value {result.layer5.nearestFireExitM > 0 ? `${result.layer5.nearestFireExitM} m` : 'not assessed'}.</p>
              </article>
              <article className="rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">Audit trail</h5>
                <p className="mt-1 text-xs font-semibold text-[#2B1609]">{result.layer6.blocks.length} recorded block(s)</p>
                <p className="mt-1 break-all font-mono text-[9px] leading-relaxed text-[#2B1609]/70">{result.layer6.merkleRoot || 'No Merkle root supplied'}</p>
              </article>
            </div>
          </section>

          <section className="rounded-2xl border border-[#D4AF37]/40 bg-white/75 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#D4AF37]/25 pb-3">
              <div>
                <h4 className="font-cinzel text-sm font-bold text-[#4A1504]">Recommended official follow-up</h4>
                <p className="mt-1 text-[10px] text-[#2B1609]/65">Resolve, request, or document these items before recording a formal outcome.</p>
              </div>
              <span className="rounded-full border border-[#D4AF37]/40 bg-[#FAF4E8] px-2.5 py-1 text-[9px] font-bold text-[#765A35]">{decisionBriefActions.length} items</span>
            </div>
            {decisionBriefActions.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {decisionBriefActions.map((item, index) => (
                  <li key={item.id} className="flex gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#FAF4E8] p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4A1504] text-[10px] font-bold text-[#F5E6C8]">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold text-[#4A1504]">{item.source}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${item.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{item.priority} priority</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#2B1609]/80">{item.action}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">No follow-up flags were produced by the available checks. The reviewer should still verify the source documents and record any checks that could not be performed.</p>
            )}
            {result.healthIndex.recommendations.length > 0 && (
              <div className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-[#F5E6C8]/55 p-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wide text-[#4A1504]">System-generated suggestions · validate against evidence</h5>
                <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-[#2B1609]/75">
                  {result.healthIndex.recommendations.map((recommendation, index) => <li key={index} className="flex gap-2"><span className="text-[#9A7429]">•</span><span>{recommendation}</span></li>)}
                </ul>
              </div>
            )}
          </section>

          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[10px] leading-relaxed text-slate-700">
            Decision boundary: this brief consolidates system output for human scrutiny. It is not a statutory verdict, an issuer confirmation, or a substitute for the current official rules and supporting evidence.
          </p>
        </div>
      )}

      {/* Tab Content: Layer 2 ELA Forensics */}
      {activeTab === 'layer2' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-[#D4AF37]/40">
              <div className="flex justify-between items-center text-xs">
                <span className="font-cinzel font-bold text-sm text-[#4A1504]">
                  ELA document comparison
                </span>
                <span className="font-mono text-[#2B1609]/70 text-[10px]">
                  Drag to compare source and signal
                </span>
              </div>
              <p className="mb-2 text-[10px] leading-snug text-[#2B1609]/70">
                ELA anomaly score: <strong>{result.layer2.elaAnomalyScore}/100</strong>. Higher scores mean stronger compression differences to review; this score is not a probability or proof of alteration.
              </p>

              <div className="relative h-[300px] w-full overflow-hidden rounded-xl border-2 border-[#4A1504]/30 select-none bg-[#FAF4E8] sm:h-[340px]">
                {/* Original Page Layer */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 font-serif text-[#2B1609] sm:p-5">
                  <div className="border-b border-[#2B1609]/20 pb-2 text-center">
                    <div className="text-[9px] uppercase font-bold tracking-widest text-[#4A1504]">
                      DOCUMENT SURFACE SCAN • {result.fileName}
                    </div>
                  </div>
                  <div className="my-auto space-y-3 text-xs">
                    <div className="rounded border border-[#D4AF37]/40 bg-white/80 p-3">
                      <span className="text-[10px] text-[#2B1609]/60 block">SCHEDULE OF PROPERTY</span>
                      <p className="font-bold text-sm text-[#4A1504] mt-1">
                        Total Stated Demarcation: {result.layer1.payload.landAreaAcres} ACRES
                      </p>
                    </div>
                    <div className="rounded border border-[#D4AF37]/40 bg-white/80 p-3">
                      <span className="text-[10px] text-[#2B1609]/60 block">SURVEY NUMBER</span>
                      <p className="font-semibold text-xs mt-0.5">{result.layer1.payload.surveyNumber}</p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] border-t border-[#2B1609]/20 pt-3">
                    Authorized Signatory Seal Block
                  </div>
                </div>

                {/* ELA Heatmap Layer */}
                <div
                  style={{ clipPath: `inset(0 0 0 ${elaSliderPos}%)` }}
                  className="absolute inset-0 flex flex-col justify-between bg-[#0F0804] p-4 font-mono text-white sm:p-5"
                >
                  <div className="border-b border-red-500/30 pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-red-400">
                    [ELA RESIDUAL INTENSITY MATRIX]
                  </div>

                  <div className="my-auto space-y-3 text-xs">
                    {result.layer2.tamperingVerdict !== 'CLEAN' ? (
                      <div className="p-3 bg-red-950/80 rounded border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)] animate-pulse">
                        <span className="text-[9px] text-red-400 uppercase font-bold block">
                          ⚠ HIGH RESIDUAL ENTROPY CLUSTER DETECTED
                        </span>
                        <p className="mt-1 text-xs font-bold text-red-300">
                          Acreage Insertion: {result.layer1.payload.landAreaAcres} ACRES [Anomaly: {result.layer2.elaAnomalyScore}/100]
                        </p>
                        <span className="mt-1 block text-[9px] font-mono text-amber-300">
                          Uneven JPEG recompression can make edited regions stand out; this is a review signal, not proof of tampering.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-950/80 rounded border-2 border-emerald-500 text-emerald-300">
                        <span className="text-[9px] uppercase font-bold block text-emerald-400">
                          ✓ UNIFORM LOW-ENTROPY SENSOR BASELINE
                        </span>
                        <p className="mt-1 text-xs font-bold">
                          Original Native Scan [Residual Energy: {result.layer2.elaAnomalyScore}/100]
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-red-500/30 pt-2 text-right text-[9px] text-gray-400">
                    Status: {result.layer2.tamperingVerdict} · ELA anomaly score: {result.layer2.elaAnomalyScore}/100
                  </div>
                </div>

                {/* Divider Line */}
                <div
                  style={{ left: `${elaSliderPos}%` }}
                  className="absolute top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)] z-30 pointer-events-none"
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#4A1504] border border-[#D4AF37] text-white flex items-center justify-center text-[8px] font-bold">
                    ⇄
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={elaSliderPos}
                  onChange={(e) => setElaSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-[#D4AF37]/40">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504]">
                  Sharpness (Laplacian variance)
                </h4>
                <span className="text-[10px] font-mono text-[#2B1609]/60">score</span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-[#2B1609]/70">
                Measures fine image detail; lower values can indicate blur or smoothing. It is not a physical unit and varies with image size and content.
              </p>
              <div className="mt-2 rounded-xl bg-[#FAF4E8] p-3 text-center space-y-1">
                <div className="font-mono text-xl font-bold text-[#4A1504]">
                  {result.layer2.laplacianBlurScore}
                </div>
                <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min((result.layer2.laplacianBlurScore / 400) * 100, 100)}%` }}
                    className={`h-full ${result.layer2.laplacianBlurScore < 100 ? 'bg-red-600' : 'bg-emerald-600'}`}
                  />
                </div>
                <span className="text-[10px] text-[#2B1609]/60">
                  {result.layer2.artificialFlatteningDetected ? 'Synthetic Smoothing Detected' : 'Natural Sensor Sharpness'}
                </span>
              </div>
              <p className={`mt-2 text-[10px] font-semibold ${result.layer2.artificialFlatteningDetected ? 'text-red-800' : 'text-emerald-800'}`}>
                {result.layer2.artificialFlatteningDetected
                  ? 'This low score is flagged for review: some areas may have been blurred or flattened.'
                  : 'No unusual loss of fine detail was flagged by this check.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-[#D4AF37]/40 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504]">Template similarity (pHash)</h4>
                <span className="text-[10px] font-mono text-[#2B1609]/60">%</span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-[#2B1609]/70">
                Compares the page’s overall visual pattern with a reference template. Lower similarity means the layouts differ; it does not by itself identify an error.
              </p>
              <div className="flex justify-between font-mono">
                <span>Visual similarity</span>
                <span className="font-bold text-[#4A1504]">{result.layer2.pHashMatchPercent}%</span>
              </div>
              <div className="p-2 bg-[#FAF4E8] rounded border border-[#D4AF37]/30 font-mono text-[10px] break-all">
                Hash: {result.layer2.pHashSignature}
              </div>
              <p className="mt-1 text-[10px] text-[#2B1609]/70">
                {result.layer2.pHashMatchPercent < 90
                  ? 'Review the page layout and source: the match is below the 90% review guide.'
                  : 'The visual pattern is close to the reference template.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Layer 3 DigiLocker & PKI */}
      {activeTab === 'layer3' && (
        <Layer3SourceVerification
          claimedAcreage={result.layer3.claimedAcreage}
          institutionName={result.layer1.payload.institutionName}
          institutionId={result.layer1.payload.institutionCode}
          scenarioResult={result.layer3}
        />
      )}

      {/* Tab Content: Layer 4 GraphRAG */}
      {activeTab === 'layer4' && (
        <div className="p-6 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/30">
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
                Neo4j Knowledge Graph APH 2024–2027 Statutory Traversal
              </h3>
              <p className="text-xs text-[#2B1609]/70">
                Autonomous 2-hop graph reasoning validating institutional filing against Gazette chapters
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-mono font-bold rounded ${
                result.layer4.compliancePercent >= 90
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-red-100 text-red-800 border border-red-300'
              }`}>
                Statutory Compliance: {result.layer4.compliancePercent}%
              </span>
            </div>
          </div>

          {/* Rule Evaluation Grid */}
          <div className="space-y-3">
            <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-[#4A1504] block">
              Evaluated Statutory Nodes &amp; Handbook Rules ({result.layer4.nodes.length}):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {result.layer4.nodes.map((node) => {
                const isViolation = node.status === 'VIOLATION';
                const isCompliant = node.status === 'COMPLIANT';
                const linkedCitation = result.layer4.citations.find((citation) =>
                  Boolean(node.clause && citation.aphClause.includes(node.clause)) || citation.ruleTitle === node.name
                );
                const isExpanded = expandedRuleId === node.id;

                return (
                  <button
                    key={node.id}
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedRuleId(isExpanded ? null : node.id)}
                    className={`w-full p-3.5 rounded-xl border text-xs space-y-1.5 text-left transition-all cursor-pointer ${
                      isViolation
                        ? 'bg-red-50/90 border-red-300 text-red-950 shadow-2xs'
                        : isCompliant
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-[#FAF4E8] border-[#D4AF37]/30 text-[#2B1609]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-xs">{node.name}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                          isViolation
                            ? 'bg-red-700 text-white'
                            : isCompliant
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#4A1504]/10 text-[#4A1504]'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>

                    {node.clause && (
                      <p className="text-[10px] font-mono text-[#4A1504] font-semibold">
                        Clause: {node.clause}
                      </p>
                    )}

                    <div className="text-[10px] opacity-80 pt-1 border-t border-current/15">
                      Type: <span className="font-mono font-bold">{node.type}</span>
                    </div>
                    <div className="pt-1 text-[9px] font-semibold text-[#79502A]">{isExpanded ? 'Hide details −' : 'Click for rule details +'}</div>
                    {isExpanded && <div className="mt-1 space-y-1.5 border-t border-current/15 pt-2 text-[10px] leading-relaxed">
                      <p>{isViolation
                        ? 'This item is flagged for review because the current findings associate it with a possible requirement gap. Check the linked source evidence and clause before reaching a decision.'
                        : isCompliant
                        ? 'The current review marks this check as compliant based on the available scenario evidence. Confirm the underlying source pages and calculation before relying on this status.'
                        : 'This is a context node in the rule traversal. It helps relate the filing to APH rules but does not independently indicate a pass or a failure.'}</p>
                      {node.clause && <p><strong>Reference:</strong> {node.clause}</p>}
                      {linkedCitation && <p><strong>Related finding:</strong> {linkedCitation.ruleTitle} — observed {linkedCitation.institutionalValue}; threshold {linkedCitation.statutoryThreshold}.</p>}
                    </div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Citations or Clean Affirmation */}
          {result.layer4.citations.length > 0 ? (
            <div className="space-y-3 pt-2 border-t border-[#D4AF37]/30">
              <span className="text-[11px] font-cinzel font-bold uppercase tracking-wider text-red-800 block">
                ⚠ Specific Legal Non-Compliance Citations ({result.layer4.citations.length} Clauses Flagged):
              </span>
              <div className="space-y-2.5">
                {result.layer4.citations.map((c) => {
                  const isExpanded = expandedCitationId === c.id;
                  return <button key={c.id} type="button" aria-expanded={isExpanded} onClick={() => setExpandedCitationId(isExpanded ? null : c.id)} className="w-full p-3.5 bg-red-50 rounded-xl border border-red-300 text-xs space-y-1.5 text-left transition hover:bg-red-100/70 cursor-pointer">
                    <div className="flex justify-between font-bold text-red-950">
                      <span>{c.aphClause}: {c.ruleTitle}</span>
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-red-700 text-white">
                        {c.severity}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#2B1609] space-y-0.5">
                      <div>Statutory Threshold: <strong className="text-[#4A1504]">{c.statutoryThreshold}</strong></div>
                      <div>Observed Value: <strong className="text-red-700">{c.institutionalValue}</strong> ({c.delta})</div>
                    </div>
                    <p className="text-[11px] text-[#2B1609]/80 italic pt-1 border-t border-red-200">
                      "{c.legalEnforcementStatement}"
                    </p>
                    <span className="block pt-1 text-[9px] font-semibold text-red-800">{isExpanded ? 'Hide explanation −' : 'Click for explanation +'}</span>
                    {isExpanded && <div className="space-y-1.5 border-t border-red-200 pt-2 text-[10px] leading-relaxed text-red-950">
                      <p><strong>How to read this:</strong> the observed value is compared with the threshold shown above. The delta describes the difference reported by this review scenario.</p>
                      <p><strong>APH reference:</strong> {c.aphChapter}, {c.aphSection}, clause {c.aphClause}{c.tableReference ? `, ${c.tableReference}` : ''}.</p>
                      <p><strong>Suggested reviewer action:</strong> inspect the cited source pages, confirm the relevant figures, and record a human determination. This finding alone is not a regulatory decision.</p>
                    </div>}
                  </button>;
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                ✓ No flagged APH rule gaps in the evaluated checks
              </span>
              <p className="text-[11px] leading-relaxed text-emerald-900/90">
                No deficiencies were identified among the APH checks displayed above. This result is limited to the rules evaluated and information available in this review; verify the cited source evidence and calculations before making a formal decision.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Layer 5 CAD & CV */}
      {activeTab === 'layer5' && <Layer5VisionCV scenarioData={result.layer5} />}

      {/* Tab Content: Layer 6 Merkle Audit */}
      {activeTab === 'layer6' && (
        <div className="p-6 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
                Cryptographically Immutable SHA-256 Merkle Audit Chain
              </h3>
              <p className="text-xs text-[#2B1609]/70">
                Seals each scrutiny step with tamper-proof cryptographic digest
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-[#FAF4E8] px-2.5 py-1 rounded border border-[#D4AF37]/40">
              Height #{result.layer6.blocks.length}
            </span>
          </div>

          <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/30 text-xs font-mono break-all">
            <span className="text-[10px] uppercase font-bold text-[#4A1504] block mb-1">Merkle Tree Root:</span>
            {result.layer6.merkleRoot}
          </div>

          <div className="space-y-2">
            {result.layer6.blocks.map((block) => (
              <div key={block.blockHeight} className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 text-xs flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#4A1504]">Block #{block.blockHeight}: {block.transactionType}</div>
                  <div className="text-[10px] text-[#2B1609]/60 font-mono truncate max-w-md">
                    Hash: {block.currentHash}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  block.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {block.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, AlertTriangle, FileText, CheckCircle2, Download, Copy, ExternalLink, Eye, Network } from 'lucide-react';
import type { ScrutinyResult } from './DocumentFindingsView';
import type { InstitutionProfile } from '../types/compliance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result?: ScrutinyResult;
  institution?: InstitutionProfile;
}

export const OfficialInspectionReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  result,
  institution,
}) => {
  const [activeInspector, setActiveInspector] = useState<'layer2' | 'layer4' | null>(null);
  const [digestCopied, setDigestCopied] = useState(false);
  const [elaReveal, setElaReveal] = useState(50);
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDigest = async () => {
    if (!merkleRoot) return;
    try {
      await navigator.clipboard.writeText(merkleRoot);
      setDigestCopied(true);
      window.setTimeout(() => setDigestCopied(false), 1800);
    } catch {
      setDigestCopied(false);
    }
  };

  const docName = result?.fileName || institution?.name || 'Institutional Scrutiny Filing';
  const verdict = result?.verdict || institution?.verdict;
  const score = result?.overallScore ?? institution?.overallScore;
  const citations = result?.layer4.citations || institution?.layer4.citations || [];
  const merkleRoot = result?.layer6.merkleRoot || institution?.layer6.merkleRoot || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-2 backdrop-blur-sm sm:p-4 print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[96svh] sm:max-h-[92vh] overflow-y-auto bg-[#FAF4E8] text-[#2B1609] rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 p-4 sm:p-6 md:p-10 font-sans-modern print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Bar - No-print Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#D4AF37]/30 print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A1504]">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>SATYA · Scrutiny review summary</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-white/70 px-3 py-2 text-[11px] font-semibold text-[#4A1504] shadow-sm transition-colors hover:bg-[#F5E6C8]"
                title="Use your browser print dialog to save a PDF. This report is not digitally signed."
              >
                <Download className="h-3.5 w-3.5" /> Save PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 rounded-lg bg-[#4A1504] px-3 py-2 text-[11px] font-semibold text-[#F5E6C8] shadow-md transition-colors hover:bg-[#2B1609]"
              >
                <Printer className="w-3.5 h-3.5" />
                Print report
              </button>
              <button
                onClick={handleCopyDigest}
                disabled={!merkleRoot}
                className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-white/70 px-3 py-2 text-[11px] font-semibold text-[#4A1504] transition-colors hover:bg-[#F5E6C8] disabled:cursor-not-allowed disabled:opacity-50"
                title={merkleRoot ? 'Copy the displayed Merkle root digest' : 'No audit digest is available for this review'}
              >
                <Copy className="h-3.5 w-3.5" /> {digestCopied ? 'Copied' : 'Copy audit digest'}
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[#4A1504]/70 hover:text-[#4A1504] hover:bg-[#D4AF37]/20 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Official Document Body */}
          <div className="relative isolate pt-6">
            {/* Watermark Mandala in Background */}
            <div
              className="absolute inset-0 z-0 pointer-events-none opacity-[0.035] bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: `url('/assets/mandala.png')` }}
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden print:opacity-[0.05]">
              <span className="-rotate-[28deg] whitespace-nowrap border-y-4 border-[#4A1504] px-8 py-3 text-center font-cinzel text-3xl font-bold tracking-[0.16em] text-[#4A1504] opacity-50 sm:text-5xl">
                SATYA · REVIEW COPY · NOT AN OFFICIAL AICTE ORDER
              </span>
            </div>

            {/* Document Header */}
            <div className="relative z-10 border-b-2 border-[#4A1504]/20 pb-6 text-center">
              <div className="flex justify-center items-center gap-4 mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#D4AF37] bg-[#4A1504] shadow-md" aria-label="SATYA logo">
                  <ShieldCheck className="h-9 w-9 text-[#D4AF37]" strokeWidth={1.8} />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9A7429]">Smart Audit and Transparent Yield Authentication</p>
              <h1 className="mt-1 font-cinzel text-xl font-bold tracking-wide text-[#4A1504] md:text-2xl">
                SATYA Document Review Summary
              </h1>
              <p className="mt-1 font-serif text-xs text-[#2B1609]/75">
                Evidence and rule-review aid for technical education filings · {new Date('2026-10-27T00:00:00+05:30').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37] bg-[#D4AF37]/15 px-4 py-1 text-xs font-cinzel font-bold text-[#4A1504]">
                REVIEW FINDINGS · NOT A COUNCIL DECISION
              </div>
            </div>

            {/* Metadata Table */}
            <div className="relative z-10 my-5 grid grid-cols-2 gap-3 rounded-xl border border-[#D4AF37]/40 bg-[#F5E6C8]/75 p-4 text-xs md:grid-cols-3">
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Sample file reference</span>
                <span className="font-mono font-bold text-[#2B1609]">F.No. AICTE/AB/NRO/2026/SCR-88492</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Institution</span>
                <span className="font-semibold text-[#2B1609]">Vidyapeeth Institute of Technology &amp; Management</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Sample application ID</span>
                <span className="font-mono font-bold text-[#2B1609]">1-4390291048</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Uploaded document</span>
                <span className="block max-w-[240px] truncate font-mono font-bold text-[#2B1609]" title={docName}>{docName}</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Review date</span>
                <span className="font-semibold text-[#2B1609]">27 Oct 2026</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Rule source</span>
                <span className="font-semibold text-[#2B1609]">APH 2024–2027 + referenced AICTE Act provisions</span>
              </div>
            </div>

            {/* Scrutiny Findings Table */}
            <div className="relative z-10 space-y-4 text-xs text-[#2B1609]">
              <div className="overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-white/85">
                <div className="bg-[#4A1504] text-[#F5E6C8] px-4 py-2 font-cinzel font-semibold text-xs tracking-wider flex justify-between items-center">
                  <span>Multi-Layer Review Summary · select Layer 2 or 4 for details</span>
                  <span>Score: {score == null ? 'Not assessed' : `${score}/100`}</span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5E6C8]/60 border-b border-[#D4AF37]/30 text-[#4A1504] font-semibold text-[11px]">
                      <th className="p-2.5">Verification Layer</th>
                      <th className="p-2.5">Evaluated Metric</th>
                      <th className="p-2.5">Statutory APH Norm</th>
                      <th className="p-2.5 text-right">Layer Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4AF37]/20 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-medium">Layer 1: Document Extraction</td>
                      <td className="p-2.5">LayoutLMv3 OCR & Bounding Boxes</td>
                      <td className="p-2.5">Complete Form Ingestion</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">{result ? 'Extracted' : 'Not assessed'}</td>
                    </tr>
                    <tr onClick={() => setActiveInspector(activeInspector === 'layer2' ? null : 'layer2')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActiveInspector(activeInspector === 'layer2' ? null : 'layer2'); } }} tabIndex={0} role="button" aria-label="Open visual forensics inspector" className="cursor-pointer transition-colors hover:bg-[#F5E6C8]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9A7429]">
                      <td className="p-2.5 font-medium"><span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-[#9A7429]" />Layer 2: Visual Forensics</span></td>
                      <td className="p-2.5">Error Level Analysis (ELA)</td>
                      <td className="p-2.5">Relative compression-residual score (/100)</td>
                      <td className="p-2.5 text-right font-bold">
                        {result?.layer2.tamperingVerdict === 'CLEAN' ? <span className="text-emerald-700">No anomaly flagged</span> : result?.layer2.tamperingVerdict ? <span className="text-red-700">Review signal</span> : <span className="text-slate-600">Not assessed</span>}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 3: Source Verification</td>
                      <td className="p-2.5">DigiLocker & PKI DSC Certificate</td>
                      <td className="p-2.5">Authoritative Match & Valid DSC</td>
                      <td className="p-2.5 text-right font-bold">
                        {result?.layer3.pkiValid ? <span className="text-emerald-700">Signature valid</span> : result ? <span className="text-slate-600">Not verified</span> : <span className="text-slate-600">Unavailable</span>}
                      </td>
                    </tr>
                    <tr onClick={() => setActiveInspector(activeInspector === 'layer4' ? null : 'layer4')} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setActiveInspector(activeInspector === 'layer4' ? null : 'layer4'); } }} tabIndex={0} role="button" aria-label="Open APH rule citations" className="cursor-pointer transition-colors hover:bg-[#F5E6C8]/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9A7429]">
                      <td className="p-2.5 font-medium"><span className="inline-flex items-center gap-1.5"><Network className="h-3.5 w-3.5 text-[#9A7429]" />Layer 4: GraphRAG Compliance</span></td>
                      <td className="p-2.5">APH rule and citation review</td>
                      <td className="p-2.5">APH 2024–27 Chapter II & IV</td>
                      <td className="p-2.5 text-right font-bold">
                        {citations.length > 0 ? (
                          <span className="text-red-700">DEFICIENT ({citations.length} Gaps)</span>
                        ) : (
                          <span className="text-slate-600">{result ? 'No citations attached' : 'Not assessed'}</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 5: Computer Vision</td>
                      <td className="p-2.5">CAD geometry and facility evidence</td>
                      <td className="p-2.5">Circulation &gt;= 25%, Mandated Tools</td>
                      <td className="p-2.5 text-right font-bold text-slate-600">
                        Review in workspace
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {activeInspector && (
                <section className="relative rounded-xl border border-[#D4AF37]/50 bg-[#F5E6C8]/90 p-4 shadow-inner" aria-live="polite">
                  <button onClick={() => setActiveInspector(null)} className="absolute right-3 top-3 rounded p-1 text-[#4A1504]/70 hover:bg-white/70" aria-label="Close finding details"><X className="h-4 w-4" /></button>
                  {activeInspector === 'layer2' ? (
                    <>
                      <h3 className="flex items-center gap-2 pr-8 font-cinzel text-sm font-bold text-[#4A1504]"><Eye className="h-4 w-4" />Visual forensics · ELA inspector</h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#2B1609]/75">Error Level Analysis highlights regions with different compression residuals. An anomaly is a review signal, not proof of editing.</p>
                      <div className="relative mt-3 h-36 overflow-hidden rounded-lg border border-[#4A1504]/25 bg-[#FBF6EB] font-mono text-[9px] sm:h-40">
                        <div className="absolute inset-0 flex flex-col justify-between p-3 text-[#4A1504]">
                          <div className="border-b border-[#4A1504]/15 pb-2 text-center font-bold">EXTRACTED FIELDS · {docName}</div>
                          <div className="rounded border border-[#D4AF37]/45 bg-white/75 p-2">Claimed land area: {result?.layer1.payload.landAreaAcres ?? 'Not extracted'} acres</div>
                          <div className="border-t border-[#4A1504]/15 pt-2 text-right">Survey ref: {result?.layer1.payload.surveyNumber ?? 'Not extracted'}</div>
                        </div>
                        <div style={{ clipPath: `inset(0 0 0 ${elaReveal}%)` }} className="absolute inset-0 flex flex-col justify-between bg-[#160C09] p-3 text-amber-100">
                          <div className="border-b border-red-400/30 pb-2 text-center font-bold text-red-200">ELA RESULT · SUMMARY VIEW</div>
                          <div className="rounded border border-red-400/50 bg-red-950/50 p-2">Anomaly score: {result?.layer2.elaAnomalyScore ?? 'Not available'} / 100<br />{result?.layer2.tamperingVerdict ?? 'No scan result'}</div>
                          <div className="border-t border-red-400/30 pt-2 text-right text-amber-200/70">Raw heatmap is not attached to this report</div>
                        </div>
                        <div style={{ left: `${elaReveal}%` }} className="pointer-events-none absolute inset-y-0 z-10 w-1 bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,.8)]" />
                        <input aria-label="Reveal ELA comparison" type="range" min="0" max="100" value={elaReveal} onChange={(event) => setElaReveal(Number(event.target.value))} className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0" />
                      </div>
                      <p className="mt-1 text-[9px] text-[#2B1609]/65">Drag across the panel to compare extracted fields with the ELA signal.</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg border border-[#D4AF37]/30 bg-white/75 p-3"><span className="block text-[9px] uppercase text-[#765A35]">ELA anomaly score</span><strong>{result?.layer2.elaAnomalyScore ?? 'Not available'}<span className="font-normal"> / 100</span></strong></div>
                        <div className="rounded-lg border border-[#D4AF37]/30 bg-white/75 p-3"><span className="block text-[9px] uppercase text-[#765A35]">Sharpness score</span><strong>{result?.layer2.laplacianBlurScore ?? 'Not available'}<span className="font-normal"> · variance</span></strong></div>
                        <div className="rounded-lg border border-[#D4AF37]/30 bg-white/75 p-3"><span className="block text-[9px] uppercase text-[#765A35]">Forensics status</span><strong>{result?.layer2.tamperingVerdict ?? 'Not available'}</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="flex items-center gap-2 pr-8 font-cinzel text-sm font-bold text-[#4A1504]"><Network className="h-4 w-4" />APH rule citations</h3>
                      {citations.length ? <ul className="mt-2 space-y-2">{citations.map((citation) => <li key={citation.id} className="rounded-lg border border-red-200 bg-white/75 p-3"><strong>{citation.aphClause}: {citation.ruleTitle}</strong><p className="mt-1 text-[10px]">Threshold: {citation.statutoryThreshold} · Observed: {citation.institutionalValue} · Difference: {citation.delta}</p></li>)}</ul> : <p className="mt-2 text-[11px] text-[#2B1609]/75">No rule citations are attached to this report result.</p>}
                      <p className="mt-2 text-[10px] text-[#2B1609]/65">Review the cited provision and source evidence before drawing a conclusion.</p>
                    </>
                  )}
                </section>
              )}

              {/* Citations / Violations if any */}
              {citations.length > 0 && (
                <div className="p-4 bg-red-500/10 border-l-4 border-red-700 rounded-r-xl">
                  <h4 className="font-cinzel font-bold text-red-900 text-xs mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    APH rule references flagged for review
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-[#2B1609]/90">
                    {citations.map((citation) => (
                      <li key={citation.id} className="border-b border-red-200/50 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-bold text-red-900">{citation.aphClause}:</span> {citation.ruleTitle} —{' '}
                        <span className="text-[#2B1609]">{citation.statutoryThreshold} required vs {citation.institutionalValue} verified ({citation.delta}).</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Merkle Cryptographic Audit Seal */}
              <div className="p-4 bg-[#F5E6C8]/70 rounded-xl border border-[#D4AF37]/50 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A1504] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    Cryptographically Immutable Merkle Tree Audit Digest
                  </span>
                  <p className="font-mono text-[10px] break-all text-[#2B1609]/90 bg-white/70 p-1.5 rounded border border-[#D4AF37]/30">
                    {merkleRoot || 'No audit root available for this result'}
                  </p>
                  <p className="text-[10px] text-[#2B1609]/60">
                    SATYA audit digest · A root digest is not an inclusion proof or a digital signature.
                  </p>
                </div>
                <div className="text-center shrink-0">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-[#D4AF37]/50 bg-white p-3 shadow-sm">
                      <FileText className="h-12 w-12 text-[#4A1504]" />
                    </div>
                  <span className="block text-[9px] font-mono text-[#2B1609]/70 mt-1">No verification QR attached</span>
                </div>
              </div>

              <section className="relative rounded-xl border border-[#D4AF37]/45 bg-[#F5E6C8]/85 p-4">
                <h3 className="font-cinzel text-xs font-bold text-[#4A1504]">Regulatory context and review limits</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-[#2B1609]/80">
                  SATYA organizes checks against APH 2024–2027 requirements and AICTE Act provisions referenced in its source material. The workflow presents review signals; it does not make or issue an AICTE decision.
                </p>
                <p className="mt-2 border-l-2 border-[#9A7429] pl-3 text-[10px] leading-relaxed text-[#2B1609]/80">
                  Appeal information: Section 10(k) concerns AICTE approval functions; it is not the appeal clause. APH 2024–2027 refers to appeal routes under Clauses 1.11 and 2.23 in applicable circumstances. Confirm the current route and deadline in the official order; this report does not create appeal rights.
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-semibold text-[#4A1504]">
                  <a className="inline-flex items-center gap-1 underline decoration-[#9A7429]/60 underline-offset-2" href="https://www.indiacode.nic.in/handle/123456789/1880" target="_blank" rel="noreferrer">AICTE Act · India Code <ExternalLink className="h-3 w-3" /></a>
                  <a className="inline-flex items-center gap-1 underline decoration-[#9A7429]/60 underline-offset-2" href="https://www.aicte.gov.in/sites/default/files/APH%20Final.pdf" target="_blank" rel="noreferrer">APH 2024–2027 · AICTE <ExternalLink className="h-3 w-3" /></a>
                </div>
              </section>

              {/* Review status. This report is not signed or issued by an officer. */}
              <div className="pt-5 mt-5 border-t border-[#D4AF37]/40 flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
                    verdict === 'PASSED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    !verdict ? 'bg-slate-100 text-slate-700 border-slate-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {verdict === 'PASSED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    {verdict && verdict !== 'PASSED' && <AlertTriangle className="w-3.5 h-3.5 text-red-700" />}
                    {verdict ? `REVIEW STATUS: ${verdict.replace('_', ' ')}` : 'REVIEW STATUS: NOT ASSESSED'}
                  </div>
                  <p className="text-[10px] text-[#2B1609]/70">
                    Review summary generated on: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </p>
                </div>
                <div className="rounded-lg border border-[#D4AF37]/40 bg-white/70 px-3 py-2 text-[10px] text-[#4A1504]">Not digitally signed · no officer endorsement</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

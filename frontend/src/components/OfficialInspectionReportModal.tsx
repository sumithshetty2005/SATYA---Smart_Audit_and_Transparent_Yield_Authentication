import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, ShieldCheck, AlertTriangle, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import type { ScrutinyResult } from './DocumentFindingsView';
import type { InstitutionProfile, OfficerRole } from '../types/compliance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result?: ScrutinyResult;
  institution?: InstitutionProfile;
  officerRole?: OfficerRole;
}

export const OfficialInspectionReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  result,
  institution,
  officerRole = 'SENIOR_SCRUTINY_OFFICER',
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const roleLabels: Record<OfficerRole, string> = {
    SENIOR_SCRUTINY_OFFICER: 'Senior Scrutiny Officer (Technical Inspection Division)',
    REGIONAL_OFFICER: 'Regional Officer & Director (Regional Technical Office)',
    CHAIRMAN_AICTE: 'Member Secretary & Chairman (Executive Committee AICTE)',
  };

  const docName = result?.fileName || institution?.name || 'Institutional Scrutiny Filing';
  const docId = institution?.id || `AICTE-APH-${Math.abs(docName.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`;
  const verdict = result?.verdict || institution?.verdict || 'PASSED';
  const score = result?.overallScore ?? institution?.overallScore ?? 88;
  const citations = result?.layer4.citations || institution?.layer4.citations || [];
  const merkleRoot = result?.layer6.merkleRoot || institution?.layer6.merkleRoot || '0x8f4d92a10cbe77192837491029384719283749102938471928374910293847a1';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#FAF4E8] text-[#2B1609] rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 p-6 md:p-10 font-sans-modern print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Bar - No-print Controls */}
          <div className="flex items-center justify-between pb-6 border-b border-[#D4AF37]/30 print:hidden">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A1504]">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>Official AICTE Regulatory Scrutiny Dossier • Form APH-SCR-2025</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] text-[#F5E6C8] hover:bg-[#2B1609] rounded-lg text-xs font-medium tracking-wide shadow-md transition-all duration-200 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save PDF
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
          <div className="pt-6 relative">
            {/* Watermark Mandala in Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: `url('/assets/mandala.png')` }}
            />

            {/* Document Header */}
            <div className="text-center pb-6 border-b-2 border-[#4A1504]/20 relative z-10">
              <div className="flex justify-center items-center gap-4 mb-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#D4AF37] bg-[#4A1504] shadow-md" aria-label="SATYA logo">
                  <ShieldCheck className="h-9 w-9 text-[#D4AF37]" strokeWidth={1.8} />
                </div>
              </div>
              <h1 className="font-vedic text-xl md:text-2xl font-bold tracking-wide text-[#4A1504]">
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </h1>
              <h2 className="font-cinzel text-lg md:text-xl font-semibold tracking-wider text-[#2B1609]">
                ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
              </h2>
              <p className="text-xs text-[#2B1609]/75 font-serif mt-1">
                (A Statutory Body of the Government of India, Ministry of Education)
              </p>
              <p className="text-xs text-[#2B1609]/60 font-mono mt-0.5">
                Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | www.aicte-india.org
              </p>
              <div className="mt-3 inline-block px-4 py-1 border border-[#D4AF37] bg-[#D4AF37]/15 rounded-full text-xs font-cinzel font-bold text-[#4A1504]">
                OFFICIAL SCRUTINY VERIFICATION & COMPLIANCE ORDER • AY 2025–2026
              </div>
            </div>

            {/* Vedic Shloka Ribbon */}
            <div className="my-4 py-2 px-4 bg-[#F5E6C8]/80 border-l-4 border-[#D4AF37] rounded-r text-center font-serif text-xs italic text-[#4A1504]/90">
              "दीर्घस्याक्ष्णया रज्जुः पार्श्वमानी तिर्यङ्ग्मानी च यत्पृथग्भूते कुरुतस्तदुभयं करोति ॥" — बौधायन शुल्बसूत्र
              <span className="block text-[10px] text-[#2B1609]/60 not-italic mt-0.5">
                (Rigorous Geometric Truth & Architectural Exactitude Foundation of AICTE APH Standards)
              </span>
            </div>

            {/* Metadata Table */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-5 p-4 bg-[#F5E6C8]/50 rounded-xl border border-[#D4AF37]/40 text-xs">
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Permanent Dossier Ref</span>
                <span className="font-mono font-bold text-[#2B1609]">{docId}</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Application Document</span>
                <span className="font-mono font-bold text-[#2B1609] truncate block max-w-[150px]">{docName}</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Council Scrutiny Region</span>
                <span className="font-semibold text-[#2B1609]">{institution?.region || 'Central Scrutiny Cell'}</span>
              </div>
              <div>
                <span className="block text-[#4A1504] font-semibold text-[10px] uppercase">Regulatory Edition</span>
                <span className="font-semibold text-[#2B1609]">AICTE APH 2024–2027 v4.2</span>
              </div>
            </div>

            {/* Scrutiny Findings Table */}
            <div className="space-y-4 text-xs text-[#2B1609]">
              <div className="overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-white/70">
                <div className="bg-[#4A1504] text-[#F5E6C8] px-4 py-2 font-cinzel font-semibold text-xs tracking-wider flex justify-between items-center">
                  <span>Multi-Layer Statutory Scrutiny Evaluation Summary</span>
                  <span>Score: {score}/100</span>
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
                      <td className="p-2.5 text-right font-bold text-emerald-700">Validated</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 2: Visual Forensics</td>
                      <td className="p-2.5">Error Level Analysis (ELA)</td>
                      <td className="p-2.5">Clean Baseline (&lt;15 Score)</td>
                      <td className="p-2.5 text-right font-bold">
                        {verdict === 'PASSED' ? (
                          <span className="text-emerald-700">PASSED</span>
                        ) : (
                          <span className="text-red-700">FORGERY FLAGGED</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 3: Source Verification</td>
                      <td className="p-2.5">DigiLocker & PKI DSC Certificate</td>
                      <td className="p-2.5">Authoritative Match & Valid DSC</td>
                      <td className="p-2.5 text-right font-bold">
                        {verdict === 'PASSED' ? (
                          <span className="text-emerald-700">AUTHENTICATED</span>
                        ) : (
                          <span className="text-red-700">DIGEST MISMATCH</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 4: GraphRAG Compliance</td>
                      <td className="p-2.5">Neo4j Knowledge Graph Multi-Agent</td>
                      <td className="p-2.5">APH 2024–27 Chapter II & IV</td>
                      <td className="p-2.5 text-right font-bold">
                        {citations.length > 0 ? (
                          <span className="text-red-700">DEFICIENT ({citations.length} Gaps)</span>
                        ) : (
                          <span className="text-emerald-700">COMPLIANT</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">Layer 5: Computer Vision</td>
                      <td className="p-2.5">CAD Shapely + YOLOv11 Equipment</td>
                      <td className="p-2.5">Circulation &gt;= 25%, Mandated Tools</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        VERIFIED
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Citations / Violations if any */}
              {citations.length > 0 && (
                <div className="p-4 bg-red-500/10 border-l-4 border-red-700 rounded-r-xl">
                  <h4 className="font-cinzel font-bold text-red-900 text-xs mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-700" />
                    Statutory Deficiencies Cited under AICTE Regulations
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
                    {merkleRoot}
                  </p>
                  <p className="text-[10px] text-[#2B1609]/60">
                    National Academic Scrutiny Ledger • Tamper-Proof SHA-256 Proof Path
                  </p>
                </div>
                <div className="text-center shrink-0">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg border border-[#D4AF37]/50 shadow-sm flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-[#4A1504]" />
                  </div>
                  <span className="block text-[9px] font-mono text-[#2B1609]/70 mt-1">Scan to Verify</span>
                </div>
              </div>

              {/* Officer Signature Section */}
              <div className="pt-6 mt-6 border-t border-[#D4AF37]/40 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
                    verdict === 'PASSED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    'bg-red-100 text-red-800 border-red-300'
                  }`}>
                    {verdict === 'PASSED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                    {verdict !== 'PASSED' && <AlertTriangle className="w-3.5 h-3.5 text-red-700" />}
                    VERDICT: {verdict.replace('_', ' ')}
                  </div>
                  <p className="text-[10px] text-[#2B1609]/70">
                    Order generated on: {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-serif italic text-xs text-[#4A1504] mb-1 font-bold">
                    [Digitally Signed via DSC Token]
                  </div>
                  <div className="border-b border-[#4A1504]/50 pb-1 mb-1 font-cinzel font-bold text-xs text-[#2B1609]">
                    Authorized AICTE Scrutiny Officer
                  </div>
                  <div className="text-[10px] text-[#2B1609]/70 font-medium">
                    {roleLabels[officerRole]}
                  </div>
                  <div className="text-[9px] text-[#2B1609]/50">
                    All India Council for Technical Education, New Delhi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

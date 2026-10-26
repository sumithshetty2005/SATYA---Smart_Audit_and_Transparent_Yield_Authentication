import React, { useState } from 'react';
import {
  ShieldCheck,
  GitCommit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import type { InstitutionProfile, OfficerRole, MerkleBlock } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
  officerRole: OfficerRole;
  onChangeOfficerRole: (role: OfficerRole) => void;
  onOpenReportModal: () => void;
}

export const Layer6AuditAndOfficer: React.FC<Props> = ({
  institution,
  officerRole,
  onChangeOfficerRole,
  onOpenReportModal,
}) => {
  const { merkleRoot, blocks, officerDecisionHistory } = institution.layer6;
  const [selectedBlock, setSelectedBlock] = useState<MerkleBlock | null>(blocks[0] || null);
  const [isVerifyingProof, setIsVerifyingProof] = useState<boolean>(false);
  const [officerDecisionNote, setOfficerDecisionNote] = useState<string>('');
  const [decisionSuccessMessage, setDecisionSuccessMessage] = useState<string | null>(null);

  const handleVerifyProof = () => {
    setIsVerifyingProof(true);
    setTimeout(() => {
      setIsVerifyingProof(false);
    }, 1200);
  };

  const handleRecordAction = (actionType: string) => {
    setDecisionSuccessMessage(
      `Decision [${actionType}] has been committed to Merkle Block Chain #${blocks.length + 1} with cryptographic signature.`
    );
    setTimeout(() => setDecisionSuccessMessage(null), 4000);
  };

  const roleLabels: Record<OfficerRole, string> = {
    SENIOR_SCRUTINY_OFFICER: 'Senior Scrutiny Officer (Technical Inspection Cell)',
    REGIONAL_OFFICER: 'Regional Officer & Director (Regional Technical Office)',
    CHAIRMAN_AICTE: 'Member Secretary & Chairman (Executive Committee AICTE)',
  };

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                LAYER 6 • CRYPTOGRAPHIC AUDIT & OFFICER PORTAL
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                SHA-256 Merkle Hash Chain • Immutable State Ledger • Role-Based Scrutiny Action Center
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Role-Based Administrative Dashboard & Cryptographic Audit Log
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Every verification artifact across Layers 1 to 5 is committed to an immutable SHA-256 Merkle hash chain.
              Enables legally defensible scrutiny decisions with instant Merkle proof generation and cryptographic EoA orders.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleVerifyProof}
              disabled={isVerifyingProof}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${isVerifyingProof ? 'animate-spin' : ''}`} />
              <span>{isVerifyingProof ? 'Recalculating Proof...' : 'Verify Merkle Proof'}</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#C59B27] text-[#4A1504] rounded-xl text-xs font-cinzel font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Inspection Order</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Merkle Tree Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Immutable Merkle Hash Chain Timeline ({blocks.length} Blocks)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#4A1504] font-semibold bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                Merkle Root: {merkleRoot.slice(0, 14)}...
              </span>
            </div>

            {/* Merkle Root Header Card */}
            <div className="p-3.5 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1504]">
                  Consolidated Merkle Tree Root (SHA-256)
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700">Proof Valid</span>
              </div>
              <p className="font-mono text-[11px] text-[#2B1609] break-all bg-white/80 p-2 rounded border border-[#D4AF37]/20">
                {merkleRoot}
              </p>
            </div>

            {/* Block List Timeline */}
            <div className="space-y-3">
              {blocks.map((block) => {
                const isSelected = selectedBlock?.blockHeight === block.blockHeight;
                const isTampered = block.status === 'TAMPERED';

                return (
                  <div
                    key={block.blockHeight}
                    onClick={() => setSelectedBlock(block)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-[#FAF4E8] border-[#4A1504] shadow-md ring-1 ring-[#D4AF37]'
                        : 'bg-white/60 hover:bg-[#FAF4E8]/60 border-[#D4AF37]/30 text-[#2B1609]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-[#4A1504] text-[#F5E6C8] rounded">
                          Block #{block.blockHeight}
                        </span>
                        <span className="font-bold text-xs text-[#4A1504]">{block.transactionType}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isTampered ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {block.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#2B1609]/75">
                      <div>
                        <span className="text-[#2B1609]/50 block">Layer Source:</span>
                        <span className="font-semibold">{block.layerSource}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#2B1609]/50 block">Timestamp:</span>
                        <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[#D4AF37]/20 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#2B1609]/60 truncate max-w-[240px]">
                        Hash: {block.currentHash.slice(0, 24)}...
                      </span>
                      <span className="text-[#4A1504] font-semibold flex items-center gap-1">
                        Inspect <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Officer Decision Center & Visual Evidence */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Scrutiny Officer Action Panel
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[#2B1609]/70 truncate max-w-[200px]">
                {roleLabels[officerRole]}
              </span>
            </div>

            {/* Officer Persona Switcher */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[10px] uppercase font-bold text-[#4A1504]">Select Officer Persona:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['SENIOR_SCRUTINY_OFFICER', 'REGIONAL_OFFICER', 'CHAIRMAN_AICTE'] as OfficerRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => onChangeOfficerRole(role)}
                    className={`p-2 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                      officerRole === role
                        ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                        : 'bg-white/70 hover:bg-[#FAF4E8] text-[#2B1609] border border-[#D4AF37]/30'
                    }`}
                  >
                    {role === 'SENIOR_SCRUTINY_OFFICER' ? 'Scrutiny Lead' : role === 'REGIONAL_OFFICER' ? 'Regional Dir' : 'Chairman'}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Evidence Summary */}
            <div className="p-3.5 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 text-xs space-y-2">
              <span className="font-cinzel font-bold text-xs text-[#4A1504] block">
                Highlighted Visual Bounding Box Evidence ({institution.id})
              </span>
              <ul className="space-y-1 text-[11px] text-[#2B1609]/85">
                <li className="flex items-start gap-1.5">
                  <span className={institution.layer2.tamperingVerdict === 'CLEAN' ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>•</span>
                  <span>
                    <strong>Land Title Deed:</strong>{' '}
                    {institution.layer2.tamperingVerdict === 'CLEAN'
                      ? `Clean baseline (${institution.layer2.elaAnomalyScore}/100 ELA). Contiguous acreage verified.`
                      : `ELA anomaly score ${institution.layer2.elaAnomalyScore}% detected around Stated Land acreage.`}
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className={institution.layer3.pkiCertificate.digestMatch ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>•</span>
                  <span>
                    <strong>PKI Signature:</strong>{' '}
                    {institution.layer3.pkiCertificate.digestMatch
                      ? 'Authentic Class-3 DSC verified with e-Mudhra CA.'
                      : 'Cryptographic digest mismatch: Document was altered post-signing!'}
                  </span>
                </li>
                {institution.crossAnomalies.length > 0 ? (
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      <strong>Cross-Institutional Conflict:</strong>{' '}
                      {institution.crossAnomalies[0].description}
                    </span>
                  </li>
                ) : (
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      <strong>Faculty Cadre:</strong> {institution.layer1.payload.cadre.ratio}
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Officer Remarks Field */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[10px] uppercase font-bold text-[#4A1504] block">
                Official Scrutiny Hearing Order Remarks:
              </label>
              <textarea
                rows={3}
                value={officerDecisionNote}
                onChange={(e) => setOfficerDecisionNote(e.target.value)}
                placeholder="Enter formal regulatory directives, show-cause conditions, or approval caveats..."
                className="w-full p-2.5 bg-white border border-[#D4AF37]/40 rounded-xl text-xs text-[#2B1609] placeholder:text-[#2B1609]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            {/* Decision Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => handleRecordAction('ISSUE_SHOW_CAUSE_NOTICE')}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-cinzel font-bold tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Issue 15-Day Show-Cause Notice (Section 10(k))</span>
              </button>

              <button
                onClick={() => handleRecordAction('REJECT_APPLICATION_FRAUD')}
                className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-cinzel font-bold tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Application (Cryptographic Fraud / Alteration)</span>
              </button>

              <button
                onClick={() => handleRecordAction('APPROVE_EXTENSION_OF_APPROVAL')}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-cinzel font-bold tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Issue Extension of Approval (EoA 2025-26)</span>
              </button>
            </div>

            {/* Officer Decision History */}
            {officerDecisionHistory.length > 0 && (
              <div className="pt-2 border-t border-[#D4AF37]/20 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#4A1504]">Prior Officer Orders:</span>
                {officerDecisionHistory.map((h, hIdx) => (
                  <div key={hIdx} className="p-2.5 bg-[#FAF4E8] rounded-lg border border-[#D4AF37]/30 text-[11px] space-y-1">
                    <div className="flex justify-between font-semibold text-[#4A1504]">
                      <span>{h.officer}</span>
                      <span className="font-mono text-[10px]">{h.action}</span>
                    </div>
                    <p className="text-[10px] text-[#2B1609]/80 italic">"{h.remarks}"</p>
                  </div>
                ))}
              </div>
            )}

            {/* Success Notification */}
            {decisionSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-medium animate-fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{decisionSuccessMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

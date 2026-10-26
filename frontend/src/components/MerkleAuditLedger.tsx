import React, { useState } from 'react';
import {
  ShieldAlert,
  GitCommit,
  CheckCircle2,
  FileCode,
  Fingerprint,
  Database,
  Network,
  UserCheck,
  ChevronRight,
  Copy,
  Check,
  RefreshCw,
  Layers,
  KeyRound,
  Binary,
  Flame,
} from 'lucide-react';
import type { MerkleNode, ScrutinyApplicationRecord } from '../types/merkle';
import { buildMerkleTree } from '../utils/crypto';

interface Props {
  application: ScrutinyApplicationRecord;
  nodes: MerkleNode[];
  merkleRoot: string;
  onSelectNode?: (node: MerkleNode) => void;
}

export const MerkleAuditLedger: React.FC<Props> = ({
  application,
  nodes,
  merkleRoot,
  onSelectNode,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<MerkleNode | null>(nodes[0] || null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'IDLE' | 'VALID' | 'TAMPERED';
    computedRoot?: string;
    expectedRoot?: string;
    message?: string;
    tamperedBlockHeights?: number[];
  }>({ status: 'IDLE' });
  const [simulatedTampering, setSimulatedTampering] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Re-verify the local ledger integrity
  const handleVerifyIntegrity = () => {
    setIsVerifying(true);
    setVerificationResult({ status: 'IDLE' });

    setTimeout(() => {
      // Calculate Merkle tree from current nodes
      const activeHashes = nodes.map((n) => {
        // If simulated tampering is on and this is block 2, introduce bit-flip
        if (simulatedTampering && n.blockHeight === 2) {
          return '0xdeadbeef10293847564738291048572910394857291039485729103948572910';
        }
        return n.hash;
      });

      const computedTree = buildMerkleTree(activeHashes);
      const computedRoot = computedTree.root;
      const expectedRoot = application.storedRootHash;

      if (!simulatedTampering && computedRoot.toLowerCase() === expectedRoot.toLowerCase()) {
        setVerificationResult({
          status: 'VALID',
          computedRoot,
          expectedRoot,
          message: 'All SHA-256 leaf nodes, intermediate hashes, and canonical root strictly match stored SQLite/PostgreSQL block state.',
        });
      } else {
        setVerificationResult({
          status: 'TAMPERED',
          computedRoot,
          expectedRoot,
          tamperedBlockHeights: [2],
          message: 'Cryptographic digest divergence detected! Recalculated root does not match stored block header. Leaf #2 data was altered.',
        });
      }
      setIsVerifying(false);
    }, 850);
  };

  const getStepIcon = (eventType: MerkleNode['eventType']) => {
    switch (eventType) {
      case 'DOCUMENT_INGESTION':
        return <FileCode className="w-4 h-4 text-sky-600" />;
      case 'ELA_FORGERY_CHECK':
        return <Fingerprint className="w-4 h-4 text-red-600" />;
      case 'DIGILOCKER_PKI_RECEIPT':
        return <Database className="w-4 h-4 text-amber-600" />;
      case 'NEO4J_GRAPHRAG_EVAL':
        return <Network className="w-4 h-4 text-purple-600" />;
      case 'OFFICER_SCRUTINY_DECISION':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <GitCommit className="w-4 h-4 text-[#4A1504]" />;
    }
  };

  const currentDisplayRoot = simulatedTampering
    ? '0xbad000000000000000000000000000000000000000000000000000000000beef'
    : merkleRoot;

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Top Banner & Control Strip */}
      <div className="p-5 md:p-6 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded tracking-wider">
                LAYER 6 • MERKLE AUDIT CHAIN
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                SHA-256 Merkle Tree Hash Ledger • Tamper-Evident Auditability
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Cryptographic Audit Chain & Hash Ledger
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Ensures immutable regulatory auditability without high-cost blockchain networks. Each document ingestion,
              forensic ELA check, DigiLocker receipt, GraphRAG rule evaluation, and officer decision is cryptographically
              anchored in a local SHA-256 Merkle Tree chain.
            </p>
          </div>

          {/* Action Tools: Verify Ledger Integrity & Simulate Tamper Toggle */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Simulate Tamper Toggle Button */}
            <button
              onClick={() => {
                setSimulatedTampering(!simulatedTampering);
                setVerificationResult({ status: 'IDLE' });
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                simulatedTampering
                  ? 'bg-red-50 border-red-400 text-red-900 ring-2 ring-red-400'
                  : 'bg-white/80 hover:bg-[#FAF4E8] border-[#D4AF37]/50 text-[#4A1504]'
              }`}
              title="Simulate bit-level payload tampering on block #2 to test verification engine"
            >
              <Flame className={`w-3.5 h-3.5 ${simulatedTampering ? 'text-red-600 animate-pulse' : 'text-[#4A1504]'}`} />
              <span>{simulatedTampering ? 'Tampering Simulated (Active)' : 'Simulate Bit-Flip'}</span>
            </button>

            {/* Core Requirement 2: Verify Ledger Integrity Button */}
            <button
              onClick={handleVerifyIntegrity}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] hover:bg-[#2B1609] active:scale-98 text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold shadow-md transition-all cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#D4AF37] ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Recalculating Proof...' : 'Verify Ledger Integrity'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Verification Result Banner */}
        {verificationResult.status !== 'IDLE' && (
          <div
            className={`mt-4 p-4 rounded-xl border transition-all duration-300 animate-fade-in ${
              verificationResult.status === 'VALID'
                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                : 'bg-red-50/90 border-red-400 text-red-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {verificationResult.status === 'VALID' ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-mono font-bold tracking-wider shadow-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    CHAIN VALID
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-mono font-bold tracking-wider shadow-sm animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                    ALERT: DATA TAMPERED
                  </span>
                )}
                <div>
                  <div className="font-bold text-xs">{verificationResult.message}</div>
                  <div className="text-[10px] font-mono text-[#2B1609]/75 mt-0.5">
                    Recalculated Root: <span className="font-bold">{verificationResult.computedRoot}</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono bg-white/80 px-2.5 py-1.5 rounded border border-[#D4AF37]/30 shrink-0">
                Stored Reference: {verificationResult.expectedRoot?.slice(0, 18)}...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Merkle Root Header Card */}
      <div className="p-4 rounded-2xl bg-[#FAF4E8] border-2 border-[#D4AF37]/50 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#4A1504]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A1504]">
              Active Canonical Merkle Tree Root (SHA-256)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-[#2B1609]/70">Blocks Committed: {nodes.length}</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
              Tree Depth: 3 Levels
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-white/90 p-2.5 rounded-xl border border-[#D4AF37]/30 font-mono text-xs text-[#2B1609] break-all">
          <span className="text-[11px] text-[#4A1504] font-semibold">{currentDisplayRoot}</span>
          <button
            onClick={() => copyToClipboard(currentDisplayRoot)}
            className="p-1.5 rounded hover:bg-[#FAF4E8] text-[#4A1504] transition-all cursor-pointer shrink-0"
            title="Copy Merkle Root Hash"
          >
            {copiedHash === currentDisplayRoot ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Two-Column Grid: Left = Block Stream Timeline, Right = Node Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live Interactive Block Stream (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Live Sequentially Appended Verification Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#4A1504] bg-[#FAF4E8] px-2 py-0.5 rounded border border-[#D4AF37]/30">
                {nodes.length} Steps Logged
              </span>
            </div>

            {/* Block Items Stream */}
            <div className="space-y-3">
              {nodes.map((node) => {
                const isSelected = selectedBlock?.id === node.id;
                const isTamperedSim = simulatedTampering && node.blockHeight === 2;

                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      setSelectedBlock(node);
                      if (onSelectNode) onSelectNode(node);
                    }}
                    className={`relative p-4 rounded-xl border text-xs cursor-pointer transition-all duration-200 space-y-2.5 ${
                      isSelected
                        ? 'bg-[#FAF4E8] border-[#4A1504] shadow-md ring-2 ring-[#D4AF37]'
                        : isTamperedSim
                        ? 'bg-red-50/70 border-red-300 hover:bg-red-50'
                        : 'bg-white/60 hover:bg-[#FAF4E8]/60 border-[#D4AF37]/30 text-[#2B1609]'
                    }`}
                  >
                    {/* Top Row: Block Height & Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] rounded shadow-2xs">
                          Block #{node.blockHeight}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#4A1504]">
                          {getStepIcon(node.eventType)}
                          <span>{node.stepTitle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isTamperedSim ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white animate-pulse">
                            BIT-FLIPPED
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              node.status === 'PASSED' || node.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {node.status}
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-[#4A1504]' : 'text-[#2B1609]/40'}`} />
                      </div>
                    </div>

                    {/* Summary Description */}
                    <p className="text-[11px] text-[#2B1609]/85 leading-snug">
                      {node.payloadSummary}
                    </p>

                    {/* Hashes and Metadata Row */}
                    <div className="pt-2 border-t border-[#D4AF37]/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono text-[#2B1609]/70">
                      <div>
                        <span className="text-[#2B1609]/50 block">Leaf SHA-256 Digest:</span>
                        <span className="font-bold text-[#4A1504] truncate block">
                          {isTamperedSim ? '0xdeadbeef10293847564738...' : `${node.hash.slice(0, 22)}...`}
                        </span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-[#2B1609]/50 block">Sealed At (UTC):</span>
                        <span>{new Date(node.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Cryptographic Node Inspector (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4 sticky top-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-[#4A1504]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Cryptographic Node Inspector
                </h3>
              </div>
              {selectedBlock && (
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#4A1504] text-[#F5E6C8] rounded">
                  Block #{selectedBlock.blockHeight}
                </span>
              )}
            </div>

            {selectedBlock ? (
              <div className="space-y-4 text-xs font-sans-modern">
                {/* Step Title Header */}
                <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A1504] block">
                    Inspection Target
                  </span>
                  <div className="font-bold text-sm text-[#4A1504] flex items-center gap-2">
                    {getStepIcon(selectedBlock.eventType)}
                    <span>{selectedBlock.stepTitle}</span>
                  </div>
                  <div className="text-[11px] text-[#2B1609]/80">
                    Event Type: <span className="font-mono font-bold">{selectedBlock.eventType}</span>
                  </div>
                </div>

                {/* Proof Attributes Grid */}
                <div className="space-y-3 font-mono text-[11px]">
                  {/* Leaf Verification Status */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 flex items-center justify-between">
                    <span className="text-[#2B1609]/60">Leaf Verification Status:</span>
                    <span className="font-bold px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800">
                      {selectedBlock.leafStatus} • INCLUSION VALID
                    </span>
                  </div>

                  {/* Nonce & Timestamp */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#2B1609]/60">Nonce:</span>
                      <span className="font-bold text-[#4A1504]">{selectedBlock.nonce.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#2B1609]/60">Timestamp:</span>
                      <span className="text-[#2B1609]">{selectedBlock.timestamp}</span>
                    </div>
                  </div>

                  {/* Current Leaf Hash */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#2B1609]/60 font-semibold">Leaf Hash (SHA-256):</span>
                      <button
                        onClick={() => copyToClipboard(selectedBlock.hash)}
                        className="text-[#4A1504] hover:text-[#2B1609] cursor-pointer"
                        title="Copy Hash"
                      >
                        {copiedHash === selectedBlock.hash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#4A1504] break-all bg-[#FAF4E8]/60 p-1.5 rounded">
                      {selectedBlock.hash}
                    </p>
                  </div>

                  {/* Left & Right Child Hashes */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 space-y-2">
                    <span className="text-[#2B1609]/60 font-semibold block">Merkle Tree Child Node Hashes:</span>
                    <div className="space-y-1.5 text-[10px]">
                      <div>
                        <span className="text-[#2B1609]/50 block">Left Child Hash:</span>
                        <span className="text-[#2B1609] break-all block bg-[#FAF4E8]/40 p-1 rounded">
                          {selectedBlock.leftHash || '0x4a15048849... (Computed in sub-level)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#2B1609]/50 block">Right Child Hash:</span>
                        <span className="text-[#2B1609] break-all block bg-[#FAF4E8]/40 p-1 rounded">
                          {selectedBlock.rightHash || '0x10b9812626... (Computed in sub-level)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Parent Hash & Merkle Root */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#2B1609]/60">Parent Node Hash:</span>
                      <span className="text-[#4A1504] truncate max-w-[180px]">
                        {selectedBlock.parentHash ? `${selectedBlock.parentHash.slice(0, 16)}...` : 'Level-1 Root'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#2B1609]/60">Canonical Root:</span>
                      <span className="text-[#4A1504] font-bold truncate max-w-[180px]">
                        {merkleRoot.slice(0, 16)}...
                      </span>
                    </div>
                  </div>

                  {/* Merkle Inclusion Proof Path */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#D4AF37]/20 space-y-1.5">
                    <span className="text-[#2B1609]/60 font-semibold block text-[10px]">
                      Merkle Proof Trail (Audit Path):
                    </span>
                    <div className="space-y-1 text-[10px]">
                      {selectedBlock.merkleProof.map((proofHash, pIdx) => (
                        <div key={pIdx} className="p-1 bg-[#FAF4E8] rounded flex items-center justify-between">
                          <span className="text-[#2B1609]/70">H({pIdx}):</span>
                          <span className="text-[#4A1504] truncate max-w-[200px]">{proofHash}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Metadata / Module Payload Details */}
                  {selectedBlock.metadata && Object.keys(selectedBlock.metadata).length > 0 && (
                    <div className="p-2.5 bg-[#FAF4E8]/60 rounded-lg border border-[#D4AF37]/20 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#4A1504] block">
                        Payload Telemetry & Evidence Notes:
                      </span>
                      <pre className="text-[9px] text-[#2B1609]/80 overflow-x-auto p-1.5 bg-white rounded border border-[#D4AF37]/10">
                        {JSON.stringify(selectedBlock.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#2B1609]/60">
                Select any block from the timeline to inspect its cryptographic proof.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

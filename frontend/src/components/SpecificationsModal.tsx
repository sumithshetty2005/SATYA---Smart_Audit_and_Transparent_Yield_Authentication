import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Layers, ShieldCheck, Sparkles, Cpu, Network, Database } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SpecificationsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-2 backdrop-blur-sm sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-[#FAF4E8] rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 p-4 sm:p-6 md:p-8 text-[#2B1609] font-sans-modern max-h-[96svh] sm:max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#4A1504] text-[#F5E6C8] rounded-xl">
                <Award className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] block">
                  Grand Challenge Problem Statement Dossier
                </span>
                <h3 className="font-cinzel font-bold text-lg text-[#4A1504]">
                  Problem Statement SH26261: AICTE Regulatory Verification Architecture
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#4A1504]/70 hover:text-[#4A1504] hover:bg-[#D4AF37]/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="my-6 space-y-6 text-xs text-[#2B1609]/85 leading-relaxed">
            <div className="p-4 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-2">
              <h4 className="font-cinzel font-bold text-sm text-[#4A1504]">Problem Context & Objective</h4>
              <p>
                Technical educational institutions across India submit tens of thousands of pages annually for Approval, 
                Extension of Approval (EoA), and increase in intake under the AICTE Approval Process Handbook (APH 2024–2027). 
                Manual scrutiny of land title deeds, structural safety NOCs, faculty rolls, and laboratory infrastructure 
                is labor-intensive, error-prone, and vulnerable to sophisticated digital forgery (e.g. text tampering, altered land acreage, and synthetic seals).
              </p>
              <p>
                <strong>Challenge Goal:</strong> Build a complete, responsive, interactive end-to-end web application delivering automated multi-modal 
                document validation, computer vision forensics, authoritative API reconciliation, knowledge-graph regulatory reasoning, and cryptographic audit logging.
              </p>
            </div>

            {/* Architecture Layers */}
            <div>
              <h4 className="font-cinzel font-bold text-sm text-[#4A1504] mb-3">Six-Layer Verification Architecture</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <Layers className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 1: Document Ingestion & LayoutLMv3</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Multi-page PDF conversion to normalized 2D coordinates [0, 1000], LayoutLMv3 semantic classification of headers, key-value pairs, tables, and seals, parsing into strict Pydantic v2 schemas.
                  </p>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 2: Visual Forensics & ELA Hub</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Error Level Analysis (ELA) pixel difference matrices, OpenCV Laplacian blur gauges for artificial flattening detection, incremental PDF revision history, and pHash template matching.
                  </p>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <Database className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 3: Source Verification & PKI</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Direct DigiLocker OAuth2 handshake with State Land Registries, X.509 Class-3 digital certificate validation, post-signing modification byte tracing, and 2D HMAC QR code payload decoding.
                  </p>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <Network className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 4: GraphRAG APH Compliance</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Neo4j knowledge graph of APH 2024–2027 rules, 4-agent LangGraph workflow (Orchestrator, Rule, Discrepancy, XAI Citation), and grounded statutory citations with exact chapter/clause numbers.
                  </p>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <Cpu className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 5: Infrastructure Computer Vision</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Shapely vector CAD floor plan geometry calculations (circulation ratio, egress travel distance), EXIF GNSS geotag verification, and YOLOv11 laboratory machinery detection.
                  </p>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-[#4A1504]">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span>Layer 6: Merkle Tree SHA-256 Audit</span>
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75">
                    Cryptographically immutable Merkle tree hash chain recording every scrutiny decision, officer persona signing, and printable official AICTE Extension of Approval (EoA) orders.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

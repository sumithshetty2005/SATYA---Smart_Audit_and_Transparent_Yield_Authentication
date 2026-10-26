import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, CheckCircle2, ShieldAlert, Download } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuidelinesModal: React.FC<GuidelinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl glass-parchment-gold border-2 border-[#D4AF37] shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#D4AF37]/40 bg-gradient-to-r from-[#FBF4E6] to-[#EEDFB8] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#4A1504] text-[#FFF3B0] flex items-center justify-center shadow">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-cinzel text-xl font-bold text-[#4A1504]">
                  Provider & Innovator Guidelines
                </h3>
                <p className="text-xs text-[#2B1609]/70">
                  Statutory Regulations under AICTE Approval Process Handbook (APH 2024–2027)
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#4A1504] hover:bg-[#4A1504]/10 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Guidelines Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm text-[#2B1609]">
            {/* Section 1 */}
            <div>
              <h4 className="font-cinzel text-sm font-bold text-[#4A1504] uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                1. Eligibility for Problem Statement Providers
              </h4>
              <p className="leading-relaxed bg-[#FBF4E6] p-3.5 rounded-xl border border-[#D4AF37]/30">
                Any Central/State Ministry, Public Sector Undertaking (PSU), Defense Lab, registered Corporate Industry, or UGC/AICTE-recognized university research laboratory can queue challenges. Minimum grant allocation must adhere to ₹2.0 Lakhs per technical challenge.
              </p>
            </div>

            {/* Section 2 */}
            <div>
              <h4 className="font-cinzel text-sm font-bold text-[#4A1504] uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                2. Vedic & Indian Knowledge System (IKS) Priority
              </h4>
              <p className="leading-relaxed bg-[#FBF4E6] p-3.5 rounded-xl border border-[#D4AF37]/30">
                Under APH Chapter VI, projects integrating traditional Indian scientific principles (such as Baudhayana Sulba-Sutra geometry, Ayurvedic informatics, ancient water harvesting architecture, and Brahmi/Grantha OCR models) receive expedited review and up to 5% evaluation weightage bonus.
              </p>
            </div>

            {/* Section 3 */}
            <div>
              <h4 className="font-cinzel text-sm font-bold text-[#4A1504] uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                3. Intellectual Property (IP) & Open Access Norms
              </h4>
              <p className="leading-relaxed bg-[#FBF4E6] p-3.5 rounded-xl border border-[#D4AF37]/30">
                Student innovators retain first-refusal IP rights for dual-use innovations. For Government/Defense sponsored statements, sovereign licensing provisions apply as defined in the official Ministry agreement.
              </p>
            </div>

            {/* Download Handbook */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFF3B0] to-[#FBF4E6] border border-[#D4AF37] flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-[#4A1504] text-xs sm:text-sm">
                  AICTE Approval Process Handbook (2024–2027)
                </div>
                <div className="text-[11px] text-[#2B1609]/70">
                  Full official statutory manual with Chapter 1–8 guidelines.
                </div>
              </div>
              <a
                href="/api/v1/reports/download-pdf?receipt_id=AICTE-APH-NORMS"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4A1504] text-[#FFF3B0] flex items-center gap-1.5 hover:bg-[#7B2710]"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                <span>PDF Download</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

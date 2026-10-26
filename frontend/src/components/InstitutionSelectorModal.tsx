import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, MapPin, Search, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { InstitutionProfile } from '../types/compliance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  institutions: InstitutionProfile[];
  currentInstitution: InstitutionProfile;
  onSelectInstitution: (institution: InstitutionProfile) => void;
}

export const InstitutionSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  institutions,
  currentInstitution,
  onSelectInstitution,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = institutions.filter(
    (inst) =>
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#FAF4E8] rounded-2xl shadow-2xl border-2 border-[#D4AF37]/50 p-6 text-[#2B1609] font-sans-modern"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#D4AF37]/20 rounded-xl text-[#4A1504]">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-cinzel font-bold text-base text-[#4A1504]">Select Active AICTE Institution Dossier</h3>
                <p className="text-xs text-[#2B1609]/70">
                  Switch between evaluated applicant filings across regions (APH 2024–2027)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#4A1504]/70 hover:text-[#4A1504] hover:bg-[#D4AF37]/20 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="my-4 relative">
            <Search className="w-4 h-4 text-[#4A1504]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Institution Name, Permanent ID (e.g., AICTE-2024-WB-ENG-9102), City or State..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/70 border border-[#D4AF37]/40 rounded-xl text-xs text-[#2B1609] placeholder:text-[#2B1609]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
            />
          </div>

          {/* List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filtered.map((inst) => {
              const isSelected = inst.id === currentInstitution.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => {
                    onSelectInstitution(inst);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-[#4A1504] text-[#F5E6C8] border-[#D4AF37] shadow-md'
                      : 'bg-white/60 hover:bg-[#F5E6C8]/70 border-[#D4AF37]/30 text-[#2B1609]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-[#D4AF37] text-[#4A1504]' : 'bg-[#D4AF37]/20 text-[#4A1504]'
                      }`}>
                        {inst.id}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-[#2B1609]/70'
                      }`}>
                        {inst.region} Region
                      </span>
                    </div>
                    <h4 className={`font-cinzel font-bold text-sm leading-snug ${
                      isSelected ? 'text-[#FAF4E8]' : 'text-[#4A1504]'
                    }`}>
                      {inst.name}
                    </h4>
                    <p className={`text-xs flex items-center gap-1.5 ${
                      isSelected ? 'text-[#F5E6C8]/80' : 'text-[#2B1609]/70'
                    }`}>
                      <MapPin className="w-3.5 h-3.5 opacity-70" />
                      {inst.city}, {inst.state} • Intake: {inst.sanctionedIntake} seats • Estd: {inst.establishedYear}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      {inst.verdict === 'PASSED' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {inst.verdict === 'DEFICIENT' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {inst.verdict === 'CONDITIONAL_APPROVAL' && <ShieldAlert className="w-4 h-4 text-amber-500" />}
                      <span className="font-bold text-xs">{inst.verdict.replace('_', ' ')}</span>
                    </div>
                    <span className={`text-[11px] font-mono ${isSelected ? 'text-[#D4AF37]' : 'text-[#4A1504]'}`}>
                      Score: {inst.overallScore}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

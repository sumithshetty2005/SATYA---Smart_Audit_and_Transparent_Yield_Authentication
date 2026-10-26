import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, X, Search, ChevronRight } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [filterCategory, setFilterCategory] = useState<'All' | 'IIT/NIT' | 'State Univ' | 'Autonomous'>('All');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const institutes = [
    { rank: 1, name: 'Indian Institute of Technology Madras', type: 'IIT/NIT', solved: 28, grantsWon: '₹1.85 Cr', badge: '🥇 National Lead' },
    { rank: 2, name: 'Indian Institute of Science (IISc) Bangalore', type: 'IIT/NIT', solved: 24, grantsWon: '₹1.60 Cr', badge: '🥈 Deep Tech Star' },
    { rank: 3, name: 'College of Engineering Pune (COEP)', type: 'Autonomous', solved: 21, grantsWon: '₹1.25 Cr', badge: '🥉 Heritage Champion' },
    { rank: 4, name: 'NIT Karnataka Surathkal', type: 'IIT/NIT', solved: 19, grantsWon: '₹1.10 Cr', badge: 'Top Coastal Node' },
    { rank: 5, name: 'Jadavpur University Kolkata', type: 'State Univ', solved: 17, grantsWon: '₹95.0 Lakhs', badge: 'Innovation Star' },
    { rank: 6, name: 'PSG College of Technology Coimbatore', type: 'Autonomous', solved: 15, grantsWon: '₹82.5 Lakhs', badge: 'Industry Favorite' },
    { rank: 7, name: 'Delhi Technological University (DTU)', type: 'State Univ', solved: 14, grantsWon: '₹75.0 Lakhs', badge: 'Robotics Winner' },
    { rank: 8, name: 'Vellore Institute of Technology', type: 'Autonomous', solved: 13, grantsWon: '₹68.0 Lakhs', badge: 'High Submissions' },
  ];

  const filtered = institutes.filter((inst) => {
    const matchCat = filterCategory === 'All' || inst.type === filterCategory;
    const matchSearch = inst.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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
                <Trophy className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="font-cinzel text-xl font-bold text-[#4A1504]">
                  National Innovator Leaderboard
                </h3>
                <p className="text-xs text-[#2B1609]/70">
                  Ranking top institutions by solved challenges and grants won
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

          {/* Filters Bar */}
          <div className="p-4 border-b border-[#D4AF37]/30 bg-[#EEDFB8]/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-1.5 text-xs font-bold">
              {['All', 'IIT/NIT', 'State Univ', 'Autonomous'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-[#4A1504] text-[#FFF3B0]'
                      : 'bg-white/70 text-[#4A1504] hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#C59B27] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search institute..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white/90 border border-[#D4AF37]/50 text-[#2B1609] focus:outline-none"
              />
            </div>
          </div>

          {/* Leaderboard Table List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-2">
            {filtered.map((inst) => (
              <div
                key={inst.rank}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  inst.rank === 1
                    ? 'bg-gradient-to-r from-[#FFF3B0] to-[#FBF4E6] border-[#D4AF37] shadow'
                    : 'bg-[#FBF4E6]/80 border-[#D4AF37]/30 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      inst.rank === 1
                        ? 'bg-amber-500 text-white'
                        : inst.rank === 2
                        ? 'bg-slate-400 text-white'
                        : inst.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-[#4A1504]/10 text-[#4A1504]'
                    }`}
                  >
                    {inst.rank <= 3 ? <Medal className="w-4 h-4" /> : inst.rank}
                  </div>

                  <div>
                    <div className="font-bold text-xs sm:text-sm text-[#4A1504] leading-tight">
                      {inst.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#2B1609]/60">{inst.type}</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                        {inst.badge}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3 flex-shrink-0">
                  <div>
                    <div className="font-mono font-black text-xs sm:text-sm text-[#4A1504]">
                      {inst.grantsWon}
                    </div>
                    <div className="text-[10px] text-[#2B1609]/70 font-semibold">
                      {inst.solved} Challenges Solved
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#C59B27]" />
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#D4AF37]/30 bg-[#FBF4E6] text-center text-xs text-[#2B1609]/70">
            Rankings refreshed weekly based on AICTE Innovation Cell verified evaluation scores.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

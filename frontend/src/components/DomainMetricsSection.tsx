import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  GraduationCap,
  Lock,
  Leaf,
  Bot,
  Scroll,
  TrendingUp,
  Award,
  Users,
  IndianRupee,
} from 'lucide-react';
import type { PlatformStats } from '../types';

interface DomainMetricsSectionProps {
  stats: PlatformStats | null;
  onSelectDomain: (domain: string) => void;
  selectedDomain: string;
}

export const DomainMetricsSection: React.FC<DomainMetricsSectionProps> = ({
  stats,
  onSelectDomain,
  selectedDomain,
}) => {
  // Animated count-up simulation
  const [counts, setCounts] = useState({
    statements: 0,
    grants: 0,
    institutions: 0,
    submissions: 0,
  });

  useEffect(() => {
    const targetStatements = stats?.total_active_statements || 148;
    const targetGrants = stats?.total_grants_allocated_crores || 42.8;
    const targetInstitutions = stats?.partner_institutions || 1840;
    const targetSubmissions = stats?.active_submissions || 6420;

    const duration = 1500;
    const steps = 40;
    const stepTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      // easeOutQuad
      const factor = 1 - (1 - progress) * (1 - progress);

      setCounts({
        statements: Math.round(targetStatements * factor),
        grants: Number((targetGrants * factor).toFixed(1)),
        institutions: Math.round(targetInstitutions * factor),
        submissions: Math.round(targetSubmissions * factor),
      });

      if (step >= steps) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [stats]);

  const domainPills = [
    { name: 'AI/ML', count: 38, icon: Brain, color: 'from-amber-600 to-amber-800' },
    { name: 'Robotics', count: 26, icon: Bot, color: 'from-orange-600 to-orange-800' },
    { name: 'Cybersecurity', count: 24, icon: Lock, color: 'from-red-600 to-red-800' },
    { name: 'Green Tech', count: 22, icon: Leaf, color: 'from-emerald-600 to-emerald-800' },
    { name: 'Smart Education', count: 20, icon: GraduationCap, color: 'from-blue-600 to-blue-800' },
    { name: 'Heritage Tech', count: 18, icon: Scroll, color: 'from-yellow-600 to-yellow-800' },
  ];

  return (
    <section id="domain-insights" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Antique Manuscript Frame */}
      <div className="relative rounded-3xl glass-parchment-gold p-8 sm:p-10 border-2 border-[#D4AF37] shadow-2xl overflow-hidden">
        {/* Ornamental Corner Filigree Decorators */}
        <div className="absolute top-2 left-2 text-[#D4AF37] opacity-60 text-lg font-cinzel">❖</div>
        <div className="absolute top-2 right-2 text-[#D4AF37] opacity-60 text-lg font-cinzel">❖</div>
        <div className="absolute bottom-2 left-2 text-[#D4AF37] opacity-60 text-lg font-cinzel">❖</div>
        <div className="absolute bottom-2 right-2 text-[#D4AF37] opacity-60 text-lg font-cinzel">❖</div>

        {/* Section Heading */}
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C59B27] font-cinzel">
            National Innovation Architecture
          </span>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-black text-[#4A1504] mt-1">
            AICTE Domain Insights & Metrics Counter
          </h2>
          <p className="text-xs sm:text-sm text-[#2B1609]/75 mt-2 max-w-xl mx-auto">
            Real-time telemetry measuring technological challenges, public/private grant disbursements, and collegiate team engagements across India.
          </p>
        </div>

        {/* 4 Primary Metric Counters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {/* Total Statements */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FBF4E6] border border-[#D4AF37]/50 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-[#4A1504]/10 flex items-center justify-center text-[#4A1504] mb-2">
              <TrendingUp className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="font-cinzel text-2xl sm:text-3xl font-black text-[#4A1504]">
              {counts.statements}
            </div>
            <div className="text-xs font-bold text-[#2B1609]/80 mt-1 uppercase font-cinzel tracking-wider">
              Active Challenges
            </div>
          </motion.div>

          {/* Grants Pool */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FBF4E6] border border-[#D4AF37]/50 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-[#4A1504]/10 flex items-center justify-center text-[#4A1504] mb-2">
              <IndianRupee className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="font-cinzel text-2xl sm:text-3xl font-black text-[#4A1504]">
              ₹{counts.grants} Cr
            </div>
            <div className="text-xs font-bold text-[#2B1609]/80 mt-1 uppercase font-cinzel tracking-wider">
              Grants Allocated
            </div>
          </motion.div>

          {/* Partner Institutions */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FBF4E6] border border-[#D4AF37]/50 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-[#4A1504]/10 flex items-center justify-center text-[#4A1504] mb-2">
              <Award className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="font-cinzel text-2xl sm:text-3xl font-black text-[#4A1504]">
              {counts.institutions.toLocaleString()}+
            </div>
            <div className="text-xs font-bold text-[#2B1609]/80 mt-1 uppercase font-cinzel tracking-wider">
              Colleges & Cells
            </div>
          </motion.div>

          {/* Active Submissions */}
          <motion.div
            whileHover={{ y: -4 }}
            className="p-5 rounded-2xl bg-[#FBF4E6] border border-[#D4AF37]/50 shadow-md text-center flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-full bg-[#4A1504]/10 flex items-center justify-center text-[#4A1504] mb-2">
              <Users className="w-5 h-5 text-[#C59B27]" />
            </div>
            <div className="font-cinzel text-2xl sm:text-3xl font-black text-[#4A1504]">
              {counts.submissions.toLocaleString()}+
            </div>
            <div className="text-xs font-bold text-[#2B1609]/80 mt-1 uppercase font-cinzel tracking-wider">
              Student Proposals
            </div>
          </motion.div>
        </div>

        {/* Domain Distribution Selector Pills */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-cinzel text-sm font-bold text-[#4A1504] uppercase tracking-wider">
              Explore by Strategic Domain Focus
            </h4>
            <span className="text-xs text-[#C59B27] font-semibold">Click to Filter Grid</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {domainPills.map((d, idx) => {
              const Icon = d.icon;
              const isSelected = selectedDomain.toLowerCase() === d.name.toLowerCase();
              return (
                <button
                  key={idx}
                  onClick={() => onSelectDomain(isSelected ? 'All' : d.name)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#4A1504] text-[#FFF3B0] border-[#D4AF37] shadow-lg scale-102'
                      : 'bg-[#FBF4E6]/90 text-[#4A1504] border-[#D4AF37]/40 hover:bg-white hover:border-[#D4AF37]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#D4AF37]' : 'text-[#C59B27]'}`} />
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-[#FFF3B0]' : 'bg-[#4A1504]/10 text-[#4A1504]'
                      }`}
                    >
                      {d.count}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-xs leading-tight">{d.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

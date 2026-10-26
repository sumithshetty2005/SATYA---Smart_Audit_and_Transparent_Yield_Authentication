import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { ProblemStatement } from '../types';
import { CardMediaReel } from './CardMediaReel';
import { Clock, IndianRupee, ArrowUpRight, ShieldAlert, Cpu } from 'lucide-react';

interface ProblemCardProps {
  problem: ProblemStatement;
  onSelect: (problem: ProblemStatement) => void;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onSelect }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 });

  // 3D Gyroscopic tilt using Framer Motion springs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 260 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);

    const spotX = ((e.clientX - rect.left) / rect.width) * 100;
    const spotY = ((e.clientY - rect.top) / rect.height) * 100;
    setSpotlightPos({ x: spotX, y: spotY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical':
        return 'bg-red-900/20 text-red-700 border-red-500/40';
      case 'high':
        return 'bg-amber-900/20 text-amber-700 border-amber-500/40';
      default:
        return 'bg-emerald-900/20 text-emerald-700 border-emerald-500/40';
    }
  };

  const getSectorBadge = (sector: string) => {
    switch (sector.toLowerCase()) {
      case 'government':
        return '🏛️ Govt Mission';
      case 'industry':
        return '🏢 Industry R&D';
      default:
        return '🎓 Academic Cell';
    }
  };

  return (
    <motion.div
      layout
      layoutId={`card-${problem.id}`}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="perspective-1000 relative group cursor-pointer"
      onClick={() => onSelect(problem)}
    >
      {/* 3D Dynamic Card Wrapper */}
      <div
        className="relative w-full rounded-2xl glass-parchment-gold p-5 border border-[#D4AF37]/50 shadow-[0_12px_35px_-8px_rgba(74,21,4,0.18)] transition-all duration-300 group-hover:shadow-[0_20px_45px_-8px_rgba(74,21,4,0.32)] overflow-hidden flex flex-col justify-between"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Dynamic Parchment Spotlight Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${spotlightPos.x}% ${spotlightPos.y}%, rgba(212, 175, 55, 0.28), transparent 70%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Top Ornamental Edge Pattern */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-80" />

        {/* Card Header (Parallax translateZ: 25px) */}
        <div
          className="flex items-center justify-between gap-2 mb-3.5"
          style={{ transform: 'translateZ(25px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black tracking-wider px-2.5 py-1 rounded-lg bg-[#4A1504] text-[#FFF3B0] shadow-sm">
              {problem.id}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EEDFB8] text-[#4A1504] border border-[#D4AF37]/40">
              {getSectorBadge(problem.sector)}
            </span>
          </div>

          <span
            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${getUrgencyColor(
              problem.urgency
            )}`}
          >
            <ShieldAlert className="w-3 h-3" />
            {problem.urgency}
          </span>
        </div>

        {/* Live Video / Simulation Reel (Inspired by Squared Showreel) */}
        <div
          className="mb-3.5 rounded-xl overflow-hidden shadow-md"
          style={{ transform: 'translateZ(30px)' }}
        >
          <CardMediaReel simulationType={problem.simulation_type} isHovered={isHovered} />
        </div>

        {/* Card Body: Title & Summary (Parallax translateZ: 20px) */}
        <div className="flex-1" style={{ transform: 'translateZ(20px)' }}>
          <div className="text-[11px] font-bold text-[#C59B27] uppercase tracking-wider mb-1 font-cinzel">
            {problem.domain} • {problem.category}
          </div>

          <h3 className="font-cinzel text-base font-bold text-[#4A1504] group-hover:text-[#7B2710] transition-colors line-clamp-2 leading-snug">
            {problem.title}
          </h3>

          <p className="mt-2 text-xs text-[#2B1609]/80 line-clamp-2 leading-relaxed">
            {problem.summary}
          </p>

          {/* Tech Stack Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {problem.tech_stack.slice(0, 3).map((tech, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-[#FBF4E6] text-[#4A1504] border border-[#D4AF37]/35 flex items-center gap-1"
              >
                <Cpu className="w-2.5 h-2.5 text-[#C59B27]" />
                {tech}
              </span>
            ))}
            {problem.tech_stack.length > 3 && (
              <span className="text-[10px] font-mono text-[#9C7A4A] self-center">
                +{problem.tech_stack.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer: Sponsor, Grant & CTA (Parallax translateZ: 35px) */}
        <div
          className="mt-4 pt-3.5 border-t border-[#D4AF37]/30 flex items-center justify-between gap-2"
          style={{ transform: 'translateZ(35px)' }}
        >
          {/* Sponsoring Org & Grant */}
          <div className="flex items-center gap-2">
            <span className="text-xl p-1 rounded-lg bg-[#EEDFB8]/70 border border-[#D4AF37]/40">
              {problem.sponsor_logo}
            </span>
            <div>
              <div className="text-[10px] text-[#2B1609]/70 font-semibold truncate max-w-[110px] sm:max-w-[130px]">
                {problem.sponsor}
              </div>
              <div className="text-xs font-black text-[#4A1504] flex items-center">
                <IndianRupee className="w-3 h-3 text-[#C59B27]" />
                <span>{problem.grant_amount}</span>
              </div>
            </div>
          </div>

          {/* Countdown & Action CTA Button */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-[#9C7A4A] flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-[#C59B27]" />
              {problem.days_left}d remaining
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(problem);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4A1504] text-[#FFF3B0] group-hover:bg-[#7B2710] group-hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] border border-[#D4AF37]/50 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Apply</span>
              <ArrowUpRight className="w-3 h-3 text-[#D4AF37] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

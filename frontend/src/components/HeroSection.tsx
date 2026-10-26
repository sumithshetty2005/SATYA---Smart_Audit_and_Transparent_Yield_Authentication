import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Send, Compass, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onExploreClick: () => void;
  onSubmitClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreClick, onSubmitClick }) => {
  const trianglePathRef = useRef<SVGPolygonElement>(null);
  const shlokaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle breathing animation for Baudhayana cutout and triangle
    const interval = setInterval(() => {
      if (trianglePathRef.current) {
        trianglePathRef.current.style.filter = `drop-shadow(0 0 ${8 + Math.sin(Date.now() / 400) * 4}px rgba(212,175,55,0.7))`;
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12">
      {/* Background Mandala Watermark Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <svg
          className="w-[750px] h-[750px] animate-spin-slow"
          viewBox="0 0 200 200"
          fill="none"
          stroke="#D4AF37"
          strokeWidth="0.5"
        >
          <circle cx="100" cy="100" r="95" strokeDasharray="3 3" />
          <circle cx="100" cy="100" r="85" />
          <circle cx="100" cy="100" r="70" strokeDasharray="2 2" />
          <circle cx="100" cy="100" r="50" />
          <polygon points="100,5 125,75 195,100 125,125 100,195 75,125 5,100 75,75" stroke="#4A1504" strokeWidth="0.8" />
          <polygon points="100,15 160,100 100,185 40,100" stroke="#C59B27" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="30" stroke="#D4AF37" strokeWidth="1" />
        </svg>
      </div>

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Cutout of Maharishi Baudhayana (800 BC – 740 BC) */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="lg:col-span-3 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1"
        >
          <div className="relative group">
            {/* Ambient Gold Aura */}
            <div className="absolute -inset-3 bg-gradient-to-r from-[#D4AF37]/30 to-[#4A1504]/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70" />

            {/* Cutout Card Container */}
            <div className="relative p-2.5 rounded-2xl glass-parchment-gold border-2 border-[#D4AF37]/70 shadow-xl overflow-hidden max-w-[260px] sm:max-w-[280px]">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#FBF4E6] to-[#EEDFB8] flex items-center justify-center p-2">
                <img
                  src="/assets/baudhayana_cutout.png"
                  alt="Maharishi Baudhayana (800 BC - 740 BC)"
                  className="w-full h-auto object-cover rounded-lg shadow-inner filter contrast-105 transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to full cover if cutout crop is missing
                    (e.target as HTMLImageElement).src = '/assets/aicte_cover.png';
                  }}
                />
              </div>

              {/* Caption Tag */}
              <div className="mt-3 text-center">
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4A1504] text-[#FFF3B0] tracking-wide font-cinzel">
                  महर्षि बौधायन
                </div>
                <h4 className="font-cinzel text-xs font-bold text-[#4A1504] mt-1">
                  Maharishi Baudhayana
                </h4>
                <p className="text-[10px] text-[#2B1609]/75 font-semibold">
                  (800 BCE – 740 BCE) • Sulba Sūtra
                </p>
                <p className="text-[9px] text-[#7B2710] italic mt-0.5">
                  Pioneer of the Indian Geometric Theorem
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center Column: Official AICTE Emblem, Sanskrit Shloka & Core CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="lg:col-span-6 flex flex-col items-center text-center order-1 lg:order-2"
        >
          {/* Top Pill: Statutory Reference */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-parchment border border-[#D4AF37] shadow-sm mb-4">
            <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
            <span className="text-xs font-bold tracking-wider text-[#4A1504] font-cinzel uppercase">
              AICTE Approval Process Handbook (APH 2024–2027)
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-black text-[#4A1504] leading-tight tracking-tight">
            PROBLEM STATEMENT <br />
            <span className="text-gold-gradient font-black">PROVIDER PORTAL</span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#2B1609]/80 font-medium max-w-xl">
            Where National Ministries, Defense Labs & Industry Giants post high-impact engineering challenges for India's 10,000+ technical institutions.
          </p>

          {/* The Baudhayana Sulba-Sutra Shloka Card */}
          <div
            ref={shlokaRef}
            className="w-full my-6 p-5 sm:p-6 rounded-2xl glass-parchment-gold border border-[#D4AF37] shadow-xl relative overflow-hidden group"
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="text-xs font-bold uppercase tracking-widest text-[#C59B27] font-cinzel mb-2">
              ॥ बौधायन शुल्बसूत्र ॥
            </div>

            {/* Sacred Sanskrit Verse */}
            <blockquote className="font-vedic text-base sm:text-lg text-[#4A1504] leading-relaxed font-bold tracking-wide">
              "॥ दीर्घचतुरस्रस्याक्ष्णया रज्जुः पार्श्वमानी तिर्यग् मानी च यत् पृथग् भूते कुरुतस्तदुभयं करोति ॥"
            </blockquote>

            {/* Classical English Translation */}
            <p className="mt-3 text-xs sm:text-sm text-[#2B1609]/85 italic font-serif leading-normal border-t border-[#D4AF37]/40 pt-2.5">
              "A rope stretched along the length of the diagonal produces an area which the vertical and horizontal sides make together."
            </p>

            <div className="mt-2 text-[11px] font-bold text-[#4A1504] font-cinzel">
              — Baudhayana Sulba-Sutra (1.48) • The Vedic Origin of Pythagorean Geometry
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            <button
              onClick={onExploreClick}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#4A1504] via-[#7B2710] to-[#4A1504] text-[#FFF3B0] hover:shadow-[0_0_25px_rgba(212,175,55,0.45)] border border-[#D4AF37] flex items-center justify-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span>Explore Problem Statements</span>
            </button>

            <button
              onClick={onSubmitClick}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-[#FBF4E6] text-[#4A1504] hover:bg-white hover:text-[#4A1504] hover:shadow-lg border border-[#D4AF37]/80 flex items-center justify-center gap-2.5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#C59B27]" />
              <span>Submit a Challenge (Ticket)</span>
            </button>
          </div>

          {/* Metric Highlights */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#4A1504]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
              <strong>148+</strong> Active Statements
            </span>
            <span className="text-[#D4AF37]">•</span>
            <span className="flex items-center gap-1.5">
              <strong>₹42.8 Cr</strong> Allocated Grants
            </span>
            <span className="text-[#D4AF37]">•</span>
            <span className="flex items-center gap-1.5">
              <strong>1,840+</strong> Partner Institutions
            </span>
          </div>
        </motion.div>

        {/* Right Column: Pythagorean Right-Angled Geometric Diagram */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="lg:col-span-3 flex flex-col items-center lg:items-end text-center lg:text-right order-3"
        >
          <div className="relative group max-w-[280px]">
            {/* Ambient Gold Aura */}
            <div className="absolute -inset-3 bg-gradient-to-l from-[#D4AF37]/30 to-[#4A1504]/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70" />

            {/* Geometric Theorem Diagram Card */}
            <div className="relative p-4 rounded-2xl glass-parchment-gold border-2 border-[#D4AF37]/70 shadow-xl overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#4A1504] font-cinzel">GEOMETRIC PROOF</span>
                <span className="text-[10px] font-bold text-[#C59B27] px-2 py-0.5 rounded bg-[#4A1504]/10">c² = a² + b²</span>
              </div>

              {/* Interactive SVG Diagram */}
              <div className="w-full aspect-square bg-[#FBF4E6]/80 rounded-xl p-3 border border-[#D4AF37]/40 flex items-center justify-center relative">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  {/* Right-angled triangle */}
                  <polygon
                    ref={trianglePathRef}
                    points="40,160 160,160 40,70"
                    fill="rgba(212, 175, 55, 0.25)"
                    stroke="#4A1504"
                    strokeWidth="3"
                    className="transition-all duration-500"
                  />
                  {/* Right angle symbol */}
                  <rect x="40" y="145" width="15" height="15" fill="none" stroke="#4A1504" strokeWidth="1.5" />

                  {/* Square on side a (base) */}
                  <rect
                    x="40"
                    y="160"
                    width="120"
                    height="30"
                    fill="rgba(197, 155, 39, 0.15)"
                    stroke="#C59B27"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text x="100" y="180" textAnchor="middle" fontSize="12" fill="#4A1504" fontWeight="bold">
                    Base (a)
                  </text>

                  {/* Square on side b (height) */}
                  <rect
                    x="10"
                    y="70"
                    width="30"
                    height="90"
                    fill="rgba(74, 21, 4, 0.1)"
                    stroke="#4A1504"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <text x="25" y="120" textAnchor="middle" fontSize="11" fill="#4A1504" fontWeight="bold" transform="rotate(-90 25 120)">
                    Height (b)
                  </text>

                  {/* Hypotenuse label (c) */}
                  <text x="110" y="110" textAnchor="middle" fontSize="13" fill="#C59B27" fontWeight="bold">
                    Hypotenuse (c)
                  </text>

                  {/* Shloka notation */}
                  <circle cx="160" cy="160" r="4" fill="#4A1504" />
                  <circle cx="40" cy="70" r="4" fill="#4A1504" />
                  <circle cx="40" cy="160" r="4" fill="#4A1504" />
                </svg>
              </div>

              <div className="mt-3 text-center">
                <div className="text-xs font-bold text-[#4A1504] font-cinzel">
                  Śulba-Pramāṇa (शुल्बप्रमाण)
                </div>
                <p className="text-[10px] text-[#2B1609]/70 mt-0.5">
                  Pre-dating Pythagoras by over 250 years in Indian mathematical science.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Scroll Indicator */}
      <button
        onClick={onExploreClick}
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-xs font-bold text-[#4A1504] hover:text-[#C59B27] transition-colors cursor-pointer group"
      >
        <span>Scroll to Explore</span>
        <ArrowDown className="w-4 h-4 text-[#C59B27] animate-bounce" />
      </button>
    </section>
  );
};

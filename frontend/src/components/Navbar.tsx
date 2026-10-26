import React, { useState } from 'react';
import { Search, PlusCircle, Award, BookOpen, Layers, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenTicketWizard: () => void;
  onOpenLeaderboard: () => void;
  onOpenGuidelines: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenTicketWizard,
  onOpenLeaderboard,
  onOpenGuidelines,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authRole, setAuthRole] = useState<'provider' | 'innovator'>('provider');

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F5E6C8]/90 border-b border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(74,21,4,0.08)]">
        {/* Top Gold Leaf Filigree Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504] opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* AICTE Emblem & Title */}
          <a href="#" className="flex items-center gap-3.5 group flex-shrink-0">
            <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-br from-[#FFF3B0] to-[#EEDFB8] border border-[#D4AF37]/60 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src="/assets/aicte_logo_crop.png"
                alt="AICTE Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback emblem if crop is rendering
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xl font-bold text-[#4A1504] font-cinzel">🏛️</span>
            </div>
            <div className="flex flex-col">
              <span className="font-vedic text-xs font-semibold tracking-wider text-[#C59B27] uppercase">
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </span>
              <span className="font-cinzel text-lg sm:text-xl font-extrabold tracking-tight text-[#4A1504]">
                AICTE <span className="text-[#C59B27] font-sans-modern font-semibold text-sm sm:text-base">PS Portal</span>
              </span>
            </div>
          </a>

          {/* Quick Search Bar */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2 relative">
            <Search className="w-4 h-4 text-[#C59B27] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by keyword, tech stack, or domain..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-full bg-[#FBF4E6] border border-[#D4AF37]/50 text-[#2B1609] placeholder-[#9C7A4A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white/90 shadow-inner transition-all"
            />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#4A1504]">
            <a href="#problem-statements" className="hover:text-[#C59B27] transition-colors flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#C59B27]" />
              Browse PS
            </a>
            <a href="#ticket-flow" className="hover:text-[#C59B27] transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
              Ticket Flow
            </a>
            <button
              onClick={onOpenLeaderboard}
              className="hover:text-[#C59B27] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#C59B27]" />
              Leaderboard
            </button>
            <button
              onClick={onOpenGuidelines}
              className="hover:text-[#C59B27] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#C59B27]" />
              Guidelines
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenTicketWizard}
              className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#4A1504] via-[#7B2710] to-[#4A1504] text-[#FFF3B0] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#D4AF37]/60 flex items-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#D4AF37]" />
              <span className="hidden xs:inline">Submit</span> Ticket
            </button>

            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#FBF4E6] text-[#4A1504] hover:bg-white border border-[#D4AF37]/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#C59B27]" />
              <span>Login</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#C59B27] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search problem statements or tech..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-full bg-[#FBF4E6] border border-[#D4AF37]/50 text-[#2B1609] placeholder-[#9C7A4A] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
            />
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl glass-parchment-gold border border-[#D4AF37] shadow-2xl">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-[#4A1504] hover:text-[#C59B27] font-bold text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-3xl">🏛️</span>
              <h3 className="font-cinzel text-xl font-bold text-[#4A1504] mt-2">
                AICTE Single Sign-On
              </h3>
              <p className="text-xs text-[#2B1609]/70 mt-1">
                Access the Problem Statement Provider & Innovation Ecosystem
              </p>
            </div>

            {/* Role Switcher */}
            <div className="flex rounded-xl bg-[#EEDFB8] p-1 mb-5 border border-[#D4AF37]/40">
              <button
                onClick={() => setAuthRole('provider')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authRole === 'provider'
                    ? 'bg-[#4A1504] text-[#FFF3B0] shadow'
                    : 'text-[#4A1504] hover:text-[#C59B27]'
                }`}
              >
                🏢 Statement Provider (Govt / Industry)
              </button>
              <button
                onClick={() => setAuthRole('innovator')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authRole === 'innovator'
                    ? 'bg-[#4A1504] text-[#FFF3B0] shadow'
                    : 'text-[#4A1504] hover:text-[#C59B27]'
                }`}
              >
                🎓 Student / Innovator Team
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(`Logged in as verified ${authRole === 'provider' ? 'Problem Statement Provider' : 'Innovator Team'}!`);
                setShowAuthModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#4A1504] mb-1">
                  Institutional / Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder={authRole === 'provider' ? 'director@isro.gov.in' : 'lead@iitb.ac.in'}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/80 border border-[#D4AF37]/50 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A1504] mb-1">
                  Password / Digilocker PIN
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white/80 border border-[#D4AF37]/50 text-[#2B1609] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-[#4A1504]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#4A1504] rounded" />
                  Remember credentials
                </label>
                <a href="#" className="hover:underline text-[#C59B27] font-semibold">
                  DigiLocker OAuth
                </a>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#4A1504] via-[#7B2710] to-[#4A1504] text-[#FFF3B0] hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-[#D4AF37]/60 transition-all cursor-pointer"
              >
                Authenticate & Enter Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

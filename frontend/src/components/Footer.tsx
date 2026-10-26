import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

const footerLinks = [
  { href: '#home', label: 'Home' },
  { href: '#features', label: 'Features' },
  { href: '#audit', label: 'Audit workspace' },
  { href: '#about', label: 'About SATYA' },
  { href: '#faq', label: 'FAQ' },
];

export const Footer: React.FC = () => (
  <footer className="relative mt-16 overflow-hidden border-t border-[#D4AF37]/50 bg-[#2B1609] text-[#F5E6C8]">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504]" />

    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-start">
        <div className="max-w-xl space-y-4">
          <a href="#home" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37]">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37] bg-[#4A1504]">
              <ShieldCheck className="h-6 w-6 text-[#D4AF37]" />
            </span>
            <span>
              <span className="block font-cinzel text-lg font-bold text-[#FFF3B0]">SATYA</span>
              <span className="block text-[10px] text-[#F5E6C8]/70">Smart Audit and Transparent Yield Authentication</span>
            </span>
          </a>
          <p className="text-sm leading-relaxed text-[#F5E6C8]/75">
            A prototype for reviewing technical education documents, surfacing evidence gaps, and organizing audit signals for human review.
          </p>
          <span className="inline-flex rounded-full border border-[#D4AF37]/40 bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-wide text-[#F3D778]">
            AICTE Problem Statement SH26261 · Demonstration prototype
          </span>
        </div>

        <nav aria-label="Footer navigation" className="md:justify-self-end">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">Explore SATYA</h2>
          <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3 md:grid-cols-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="inline-flex items-center gap-1 text-[#F5E6C8]/80 transition-colors hover:text-[#FFF3B0]">
                  {link.label}<ArrowUpRight className="h-3 w-3 opacity-60" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-[#D4AF37]/20 pt-5 text-[11px] text-[#F5E6C8]/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} SATYA prototype. Built for project demonstration.</p>
        <p className="max-w-2xl sm:text-right">Not an official AICTE service. Demo findings are illustrative and do not constitute regulatory decisions or issuer verification.</p>
      </div>
    </div>
  </footer>
);

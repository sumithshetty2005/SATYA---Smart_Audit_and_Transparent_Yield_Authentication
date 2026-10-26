import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#2B1609] text-[#F5E6C8] pt-14 pb-8 overflow-hidden border-t-2 border-[#D4AF37]">
      {/* Torn Paper Top Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: AICTE Apex Authority */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <div className="font-cinzel text-base font-bold text-[#FFF3B0]">
                  AICTE PS PORTAL
                </div>
                <div className="text-[10px] text-[#D4AF37] font-vedic">
                  अखिल भारतीय तकनीकी शिक्षा परिषद
                </div>
              </div>
            </div>

            <p className="text-xs text-[#F5E6C8]/75 leading-relaxed">
              Statutory body and apex national council for technical education under the Department of Higher Education, Ministry of Education, Government of India.
            </p>

            <div className="flex items-center gap-2 text-xs text-[#D4AF37]">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-semibold">APH 2024–2027 Regulatory Compliant</span>
            </div>
          </div>

          {/* Col 2: Headquarters & Contact */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              National Headquarters
            </h4>
            <div className="space-y-2 text-xs text-[#F5E6C8]/80">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C59B27] flex-shrink-0 mt-0.5" />
                <span>
                  Nelson Mandela Marg, Vasant Kunj, New Delhi, Delhi 110070, India
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                <span>+91 11 29581000 / 26131576</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C59B27] flex-shrink-0" />
                <span>problem-provider@aicte-india.org</span>
              </div>
            </div>
          </div>

          {/* Col 3: Key Portals & Initiatives */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Connected Portals
            </h4>
            <ul className="space-y-1.5 text-xs text-[#F5E6C8]/75">
              <li>
                <a href="https://www.aicte-india.org" target="_blank" rel="noreferrer" className="hover:text-[#FFF3B0] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  Official AICTE India Main Portal
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FFF3B0] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  Smart India Hackathon (SIH) Repository
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FFF3B0] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  AICTE NEAT (National Tech Alliance)
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FFF3B0] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  Indian Knowledge Systems (IKS) Division
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#FFF3B0] flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
                  DigiLocker National Academic Depository
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Vedic Geometric Heritage */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              Vedic Scientific Heritage
            </h4>
            <p className="text-xs text-[#F5E6C8]/70 leading-relaxed italic">
              "॥ दीर्घचतुरस्रस्याक्ष्णया रज्जुः पार्श्वमानी तिर्यग् मानी च यत् पृथग् भूते कुरुतस्तदुभयं करोति ॥"
            </p>
            <p className="text-[11px] text-[#D4AF37] font-semibold">
              Celebrating Maharishi Baudhayana (800 BCE – 740 BCE) & India's timeless architectural and mathematical legacy.
            </p>
          </div>
        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-6 border-t border-[#D4AF37]/20 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#F5E6C8]/60 gap-3">
          <div>
            © {new Date().getFullYear()} All India Council for Technical Education (AICTE). All Rights Reserved.
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-[#FFF3B0]">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-[#FFF3B0]">Terms of Challenge Submission</a>
            <span>•</span>
            <a href="#" className="hover:text-[#FFF3B0]">RTI Act AICTE Cell</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

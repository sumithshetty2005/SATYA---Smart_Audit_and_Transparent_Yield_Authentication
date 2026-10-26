import React from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileSearch,
  Fingerprint,
  Network,
  Eye,
  Scroll,
  LayoutDashboard,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import type { InstitutionProfile, LayerId, OfficerRole } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
  currentLayer: LayerId;
  onSelectLayer: (layer: LayerId) => void;
  onOpenInstitutionSelector: () => void;
  onOpenReportModal: () => void;
  officerRole: OfficerRole;
  onChangeOfficerRole: (role: OfficerRole) => void;
}

export const ScrutinyHeader: React.FC<Props> = ({
  institution,
  currentLayer,
  onSelectLayer,
  onOpenInstitutionSelector,
  onOpenReportModal,
  officerRole,
  onChangeOfficerRole,
}) => {
  const navTabs: { id: LayerId; label: string; icon: React.ReactNode; badge?: string; badgeColor?: string }[] = [
    { id: 'overview', label: 'Executive Briefing', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'layer1', label: '1. Ingestion & LayoutLMv3', icon: <FileSearch className="w-4 h-4" /> },
    {
      id: 'layer2',
      label: '2. Forensics & ELA Hub',
      icon: <Fingerprint className="w-4 h-4" />,
      badge: institution.layer2.tamperingVerdict === 'CLEAN' ? 'Clean' : 'Alert',
      badgeColor: institution.layer2.tamperingVerdict === 'CLEAN' ? 'bg-emerald-600' : 'bg-red-600',
    },
    {
      id: 'layer3',
      label: '3. DigiLocker & PKI',
      icon: <ShieldCheck className="w-4 h-4" />,
      badge: institution.layer3.pkiCertificate.digestMatch ? 'Valid' : 'Digest Error',
      badgeColor: institution.layer3.pkiCertificate.digestMatch ? 'bg-emerald-600' : 'bg-red-600',
    },
    {
      id: 'layer4',
      label: '4. GraphRAG APH Rules',
      icon: <Network className="w-4 h-4" />,
      badge: institution.layer4.citations.length > 0 ? `${institution.layer4.citations.length} Gaps` : 'Passed',
      badgeColor: institution.layer4.citations.length > 0 ? 'bg-red-600' : 'bg-emerald-600',
    },
    { id: 'layer5', label: '5. Vision CV & CAD', icon: <Eye className="w-4 h-4" /> },
    { id: 'layer6', label: '6. Merkle Audit & Orders', icon: <Scroll className="w-4 h-4" /> },
    {
      id: 'anomalies',
      label: 'Cross-Anomalies & IHI',
      icon: <Building2 className="w-4 h-4" />,
      badge: institution.crossAnomalies.length > 0 ? `${institution.crossAnomalies.length} Collisions` : `IHI ${institution.healthIndex.healthIndex}`,
      badgeColor: institution.crossAnomalies.length > 0 ? 'bg-red-600' : 'bg-emerald-600',
    },
  ];

  return (
    <div className="w-full relative z-20">
      {/* Topmost Official Strip */}
      <div className="bg-[#2B1609] text-[#F5E6C8] px-4 py-1.5 text-[11px] font-sans-modern flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-6 rounded-xs overflow-hidden shadow-xs">
            <div className="w-1/3 bg-[#FF9933]" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-[#138808]" />
          </div>
          <span className="font-medium tracking-wide">
            Problem Statement SH26261 • AICTE Regulatory Scrutiny Architecture
          </span>
          <span className="hidden md:inline text-[#D4AF37]">•</span>
          <span className="hidden md:inline text-[#F5E6C8]/80 font-mono">
            APH 2024–2027 Gazette v4.2 Active
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px]">DigiLocker Sandbox: CONNECTED</span>
          </div>
          <span className="text-[#D4AF37]/50">|</span>
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <select
              value={officerRole}
              onChange={(e) => onChangeOfficerRole(e.target.value as OfficerRole)}
              className="bg-[#4A1504] text-[#F5E6C8] border border-[#D4AF37]/40 rounded px-2 py-0.5 text-[11px] focus:outline-none cursor-pointer"
            >
              <option value="SENIOR_SCRUTINY_OFFICER">Officer: Senior Scrutiny Lead</option>
              <option value="REGIONAL_OFFICER">Officer: Regional Director (RO)</option>
              <option value="CHAIRMAN_AICTE">Officer: AICTE Chairman / Secretary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="mx-auto px-4 md:px-8 py-5 max-w-7xl">
        <div className="bg-[#FAF4E8]/90 backdrop-blur-md rounded-2xl border-2 border-[#D4AF37]/50 shadow-xl p-5 md:p-6 relative overflow-hidden">
          {/* Subtle Vedic Mandala Watermark in Top Right */}
          <div
            className="absolute -right-16 -top-16 w-64 h-64 pointer-events-none opacity-10 bg-contain bg-no-repeat"
            style={{ backgroundImage: `url('/assets/mandala.png')` }}
          />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Branding & Institution */}
            <div className="flex items-start gap-4">
              <img
                src="/assets/aicte_logo_crop.png"
                alt="AICTE Logo"
                className="w-16 h-16 md:w-20 md:h-20 object-contain shrink-0 drop-shadow-md"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-cinzel font-bold tracking-widest rounded-md uppercase">
                    AICTE Central Scrutiny Engine
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#D4AF37]/20 text-[#4A1504] border border-[#D4AF37]/50 text-[10px] font-mono font-bold rounded-md">
                    {institution.id}
                  </span>
                  <span className="px-2 py-0.5 bg-black/5 text-[#2B1609]/70 text-[10px] font-semibold rounded-md">
                    {institution.region} Region • {institution.city}, {institution.state}
                  </span>
                </div>
                <h1 className="font-cinzel font-bold text-lg md:text-2xl text-[#4A1504] leading-tight">
                  {institution.name}
                </h1>
                <p className="text-xs text-[#2B1609]/75 font-sans-modern flex items-center gap-2">
                  <span>{institution.category}</span>
                  <span>•</span>
                  <span>Sanctioned Intake: <strong className="text-[#4A1504]">{institution.sanctionedIntake} Seats</strong></span>
                  <span>•</span>
                  <span>Academic Year: <strong className="text-[#4A1504]">2025–2026</strong></span>
                </p>
              </div>
            </div>

            {/* Right: Quick Action & Compliance Gauge */}
            <div className="flex flex-wrap items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
              <button
                onClick={onOpenInstitutionSelector}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/80 hover:bg-[#F5E6C8] text-[#4A1504] border border-[#D4AF37]/50 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-[#D4AF37]" />
                <span>Switch Institution Dossier</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-semibold tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Scroll className="w-4 h-4 text-[#D4AF37]" />
                <span>Inspection Order Dossier</span>
              </button>

              {/* Status Badge */}
              <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 shadow-sm ${
                institution.verdict === 'PASSED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : institution.verdict === 'DEFICIENT'
                  ? 'bg-red-50 text-red-800 border-red-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                {institution.verdict === 'PASSED' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-75">
                    Scrutiny Verdict
                  </div>
                  <div className="font-cinzel font-bold text-xs tracking-wider">
                    {institution.verdict.replace('_', ' ')} ({institution.overallScore}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = currentLayer === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectLayer(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4A1504] text-[#F5E6C8] shadow-md border border-[#D4AF37]'
                      : 'bg-white/50 hover:bg-[#F5E6C8]/80 text-[#2B1609]/80 border border-[#D4AF37]/25'
                  }`}
                >
                  <span className={isActive ? 'text-[#D4AF37]' : 'text-[#4A1504]'}>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono text-white ${tab.badgeColor || 'bg-[#4A1504]'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

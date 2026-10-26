import React, { useState } from 'react';
import { AlertOctagon } from 'lucide-react';
import type { InstitutionProfile } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
  allInstitutions: InstitutionProfile[];
  onSelectInstitution: (inst: InstitutionProfile) => void;
}

export const CrossInstitutionalIntelligence: React.FC<Props> = ({
  institution,
  allInstitutions,
  onSelectInstitution,
}) => {
  const [selectedAnomalyType, setSelectedAnomalyType] = useState<'ALL' | 'LAND' | 'FACULTY'>('ALL');
  const health = institution.healthIndex;

  // Flatten all cross anomalies
  const allAnomalies = allInstitutions.flatMap((inst) => inst.crossAnomalies);
  const uniqueAnomalies = Array.from(
    new Map(allAnomalies.map((a) => [a.anomalyId, a])).values()
  );

  const filteredAnomalies = uniqueAnomalies.filter((a) => {
    if (selectedAnomalyType === 'LAND') return a.anomalyType === 'DUPLICATE_LAND_PARCEL';
    if (selectedAnomalyType === 'FACULTY') return a.anomalyType === 'GHOST_FACULTY_OVERLAP';
    return true;
  });

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                AICTE SYSTEM-WIDE INTELLIGENCE
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                Institutional Health Index (IHI) • Cross-Institutional Land Double-Pledging • Ghost Faculty Radar
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Cross-Institutional Anomaly Intelligence & Health Index (IHI)
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Analyzes multi-institutional filings across council regions to catch syndicated fraud: 
              duplicate land title survey numbers pledged across multiple applications, and "Ghost Faculty" registered 
              as full-time professors simultaneously at multiple technical colleges.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className={`p-3.5 rounded-xl border text-right shadow-sm ${
              health.healthIndex >= 85
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : health.healthIndex >= 70
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              <span className="text-[10px] uppercase font-bold opacity-75 block">Institutional Health Index</span>
              <div className="font-mono font-extrabold text-xl">{health.healthIndex} / 100</div>
              <span className="text-[10px] font-bold block">{health.grade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Health Index (IHI) Weighted Vector Breakdown */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
          <div>
            <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
              Institutional Health Index (IHI) Weighted Composite Formula
            </h3>
            <p className="text-xs text-[#2B1609]/70">
              Aggregated weighted metric evaluating regulatory compliance, forensic integrity, cryptography, and cadre stability
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
            health.riskAssessment === 'LOW_RISK'
              ? 'bg-emerald-100 text-emerald-800'
              : health.riskAssessment === 'MODERATE_RISK'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800'
          }`}>
            Risk Level: {health.riskAssessment.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase text-[#4A1504]">Regulatory Compliance (35%)</span>
              <span className="font-mono font-bold text-[#4A1504]">{health.regulatoryComplianceScore}%</span>
            </div>
            <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${health.regulatoryComplianceScore}%` }}
                className={`h-full rounded-full ${health.regulatoryComplianceScore >= 80 ? 'bg-emerald-600' : 'bg-red-600'}`}
              />
            </div>
            <span className="text-[10px] text-[#2B1609]/60 block">Layer 4 GraphRAG APH Rules</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase text-[#4A1504]">Forensic Authenticity (25%)</span>
              <span className="font-mono font-bold text-[#4A1504]">{health.forensicAuthenticityScore}%</span>
            </div>
            <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${health.forensicAuthenticityScore}%` }}
                className={`h-full rounded-full ${health.forensicAuthenticityScore >= 80 ? 'bg-emerald-600' : 'bg-red-600'}`}
              />
            </div>
            <span className="text-[10px] text-[#2B1609]/60 block">Layer 2 ELA & Laplacian Blur</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase text-[#4A1504]">Cryptographic Provenance (20%)</span>
              <span className="font-mono font-bold text-[#4A1504]">{health.cryptographicProvenanceScore}%</span>
            </div>
            <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${health.cryptographicProvenanceScore}%` }}
                className={`h-full rounded-full ${health.cryptographicProvenanceScore >= 80 ? 'bg-emerald-600' : 'bg-red-600'}`}
              />
            </div>
            <span className="text-[10px] text-[#2B1609]/60 block">Layer 3 PKI DSC & DigiLocker</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[10px] font-bold uppercase text-[#4A1504]">Cadre Stability (20%)</span>
              <span className="font-mono font-bold text-[#4A1504]">{health.cadreInfrastructureStabilityScore}%</span>
            </div>
            <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${health.cadreInfrastructureStabilityScore}%` }}
                className={`h-full rounded-full ${health.cadreInfrastructureStabilityScore >= 80 ? 'bg-emerald-600' : 'bg-red-600'}`}
              />
            </div>
            <span className="text-[10px] text-[#2B1609]/60 block">Classroom & Faculty Stability</span>
          </div>
        </div>

        {/* IHI Recommendations */}
        <div className="p-4 bg-white/70 rounded-xl border border-[#D4AF37]/30 space-y-2 text-xs">
          <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] block">
            Statutory Corrective Actions & IHI Directives:
          </span>
          <ul className="space-y-1 text-[11px] text-[#2B1609]/85">
            {health.recommendations.map((rec, rIdx) => (
              <li key={rIdx} className="flex items-start gap-1.5">
                <span className="text-[#D4AF37] font-bold">▸</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Cross-Institutional Collisions & Duplicate Claim Radar */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
                Detected Cross-Institutional Fraud & Collisions ({uniqueAnomalies.length} Flagged Incidents)
              </h3>
              <p className="text-xs text-[#2B1609]/70">
                AI cross-matching algorithms detecting double-pledged land parcels and multi-college Ghost Faculty
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedAnomalyType('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedAnomalyType === 'ALL'
                  ? 'bg-[#4A1504] text-[#F5E6C8]'
                  : 'bg-white/70 hover:bg-[#FAF4E8] text-[#2B1609]'
              }`}
            >
              All Anomaly Vectors
            </button>
            <button
              onClick={() => setSelectedAnomalyType('LAND')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedAnomalyType === 'LAND'
                  ? 'bg-red-700 text-white'
                  : 'bg-white/70 hover:bg-[#FAF4E8] text-[#2B1609]'
              }`}
            >
              Duplicate Land Survey
            </button>
            <button
              onClick={() => setSelectedAnomalyType('FACULTY')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                selectedAnomalyType === 'FACULTY'
                  ? 'bg-amber-700 text-white'
                  : 'bg-white/70 hover:bg-[#FAF4E8] text-[#2B1609]'
              }`}
            >
              Ghost Faculty Overlap
            </button>
          </div>
        </div>

        {/* Anomalies Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAnomalies.map((anomaly) => (
            <div
              key={anomaly.anomalyId}
              className="p-5 rounded-2xl bg-[#FAF4E8] border-2 border-red-500/40 shadow-sm space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  anomaly.anomalyType === 'DUPLICATE_LAND_PARCEL'
                    ? 'bg-red-700 text-white'
                    : 'bg-amber-700 text-white'
                }`}>
                  {anomaly.anomalyType.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono font-bold text-red-700">
                  SEVERITY: {anomaly.severity}
                </span>
              </div>

              <div>
                <h4 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Colliding Entity: {anomaly.entityIdentifier}
                </h4>
                <p className="text-[11px] text-[#2B1609]/80 mt-1 leading-relaxed">
                  {anomaly.description}
                </p>
              </div>

              {/* Conflicting Institutions Comparison Table */}
              <div className="space-y-1.5 p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#4A1504] block">
                  Simultaneous Claim Breakdown:
                </span>
                {anomaly.conflictingInstitutions.map((c, cIdx) => (
                  <div
                    key={cIdx}
                    className="p-2 bg-[#FAF4E8]/60 rounded-lg border border-[#D4AF37]/20 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-[#4A1504] block">{c.institutionName}</span>
                      <span className="text-[10px] text-[#2B1609]/70 font-mono">ID: {c.institutionId} • {c.detail}</span>
                    </div>
                    <button
                      onClick={() => {
                        const target = allInstitutions.find((i) => i.id === c.institutionId);
                        if (target) onSelectInstitution(target);
                      }}
                      className="px-2 py-1 bg-[#4A1504] text-[#F5E6C8] hover:bg-[#2B1609] rounded text-[10px] font-medium shrink-0 cursor-pointer"
                    >
                      Audit
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-red-50 rounded-xl border border-red-300 text-[11px] text-red-950">
                <span className="font-bold text-red-800">Direct Action: </span>
                <span>{anomaly.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

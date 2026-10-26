import React from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck2,
  Fingerprint,
  Database,
  Network,
  Eye,
  Scroll,
  ArrowRight,
  Sparkles,
  Cpu,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { InstitutionProfile, LayerId } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
  onSelectLayer: (layer: LayerId) => void;
  onOpenReportModal: () => void;
}

export const ExecutiveSummary: React.FC<Props> = ({
  institution,
  onSelectLayer,
  onOpenReportModal,
}) => {
  const layerCards: {
    id: LayerId;
    layerNum: string;
    title: string;
    tech: string;
    status: 'PASSED' | 'WARNING' | 'FAILED';
    metrics: string;
    summary: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'layer1',
      layerNum: 'Layer 1',
      title: 'Ingestion & Layout Extraction',
      tech: 'Microsoft LayoutLMv3 + Pydantic v2',
      status: 'PASSED',
      metrics: `${institution.layer1.tokens.length} tokens classified (99.1% avg conf)`,
      summary: `Parsed land area (${institution.layer1.payload.landAreaAcres} Acres), built-up area (${institution.layer1.payload.builtUpAreaSqm.toLocaleString()} sq.m), faculty roll (${institution.layer1.payload.facultyCount} faculty).`,
      icon: <FileCheck2 className="w-5 h-5" />,
    },
    {
      id: 'layer2',
      layerNum: 'Layer 2',
      title: 'Visual Forensics & Forgery Hub',
      tech: 'Error Level Analysis (ELA) + Laplacian Blur',
      status: institution.layer2.tamperingVerdict === 'CLEAN' ? 'PASSED' : 'FAILED',
      metrics: `ELA Anomaly Score: ${institution.layer2.elaAnomalyScore}/100`,
      summary:
        institution.layer2.tamperingVerdict === 'CLEAN'
          ? 'Native vector flatbed scan confirmed. Zero synthetic text splicing or alpha flattening detected.'
          : `${institution.layer2.elaPatches.length} tampered pixel patches detected on Land Title Deed acreage & Municipal Seal.`,
      icon: <Fingerprint className="w-5 h-5" />,
    },
    {
      id: 'layer3',
      layerNum: 'Layer 3',
      title: 'Authoritative Source & PKI',
      tech: 'DigiLocker NAD OAuth2 + X.509 DSC Validator',
      status: institution.layer3.pkiCertificate.digestMatch && !institution.layer3.digiLocker.mismatchFound ? 'PASSED' : 'FAILED',
      metrics: `Source Trust Index: ${institution.layer3.overallSourceTrust}%`,
      summary:
        institution.layer3.digiLocker.mismatchFound
          ? `DigiLocker Land Registry lists 4.20 Acres vs 7.20 claimed. Cryptographic digest mismatch post-signing.`
          : 'Authoritative state land record matched. Class-3 DSC verified with e-Mudhra root CA.',
      icon: <Database className="w-5 h-5" />,
    },
    {
      id: 'layer4',
      layerNum: 'Layer 4',
      title: 'GraphRAG APH Compliance',
      tech: 'Neo4j Knowledge Graph + Multi-Agent XAI',
      status: institution.layer4.citations.filter(c => c.severity === 'CRITICAL_DEFICIENCY').length === 0 ? 'PASSED' : 'FAILED',
      metrics: `${institution.layer4.compliancePercentage}% Statutory Compliance Score`,
      summary:
        institution.layer4.citations.length === 0
          ? 'Passed all 18 statutory vectors under AICTE APH 2024–2027 Gazette.'
          : `${institution.layer4.citations.length} statutory deficiencies cited across APH Chapter II, IV, and VI.`,
      icon: <Network className="w-5 h-5" />,
    },
    {
      id: 'layer5',
      layerNum: 'Layer 5',
      title: 'Infrastructure Computer Vision',
      tech: 'Shapely CAD Geometry + YOLOv11 Grid',
      status: institution.layer5.geotagPhoto.geofenceValid ? 'PASSED' : 'WARNING',
      metrics: `Circulation: ${(institution.layer5.cadFloorPlan.circulationRatio * 100).toFixed(1)}% | CAD Area: ${institution.layer5.cadFloorPlan.carpetAreaSqm.toLocaleString()} sq.m`,
      summary:
        institution.layer5.geotagPhoto.geofenceValid
          ? 'EXIF geotags match municipal survey coordinates within 8.2m tolerance. Mandatory lab equipment detected.'
          : 'Geotag photo coordinates fall outside registered municipal cadastral plot boundary.',
      icon: <Eye className="w-5 h-5" />,
    },
    {
      id: 'layer6',
      layerNum: 'Layer 6',
      title: 'Merkle Tree SHA-256 Audit',
      tech: 'SHA-256 Hash Chains & Officer Decision Portal',
      status: 'PASSED',
      metrics: `Block Chain Height: #${institution.layer6.blocks.length} Verified`,
      summary: `Merkle Root: ${institution.layer6.merkleRoot.slice(0, 18)}... Sealed with immutable timestamp proof.`,
      icon: <Scroll className="w-5 h-5" />,
    },
    {
      id: 'anomalies',
      layerNum: 'System Analytics',
      title: 'Cross-Institutional Fraud & IHI',
      tech: 'Double-Pledging & Ghost Faculty Matcher',
      status: institution.crossAnomalies.length === 0 ? 'PASSED' : 'FAILED',
      metrics: `IHI: ${institution.healthIndex.healthIndex}/100 (${institution.healthIndex.grade})`,
      summary:
        institution.crossAnomalies.length === 0
          ? 'Zero cross-institutional title deed collisions or overlapping faculty registered in council database.'
          : `${institution.crossAnomalies.length} critical multi-institutional collisions: Survey-42/1B double-pledging & Ghost Faculty overlap.`,
      icon: <Cpu className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-8 font-sans-modern">
      {/* Neoclassical + Vedic Architectural Hero Ribbon */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#FAF4E8] via-[#F5E6C8] to-[#EEDFB8] p-6 md:p-10 shadow-2xl">
        {/* Intricate Sacred Mandala Background Overlay */}
        <div
          className="absolute -right-20 -bottom-20 w-96 h-96 pointer-events-none opacity-15 bg-contain bg-no-repeat animate-spin-slow"
          style={{ backgroundImage: `url('/assets/mandala.png')` }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text / Heritage Concept */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4A1504] text-[#F5E6C8] text-xs font-cinzel font-semibold tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>APH 2024–2027 • VEDIC ARCHITECTURAL EXACTITUDE MEETS AI FORENSICS</span>
            </div>

            <h2 className="font-cinzel text-2xl md:text-4xl lg:text-5xl font-bold text-[#4A1504] tracking-wide leading-tight">
              Where Ancient Rigor <br />
              <span className="text-[#2B1609] italic font-serif">Protects National Standards</span>
            </h2>

            <p className="text-sm md:text-base text-[#2B1609]/85 leading-relaxed max-w-2xl font-serif">
              Built for Problem Statement <strong className="text-[#4A1504]">SH26261</strong>, this regulatory intelligence engine bridges 
              the geometric precision of ancient Indian treatises (Baudhayana Sulbasutras) with modern forensic AI, 
              LayoutLMv3 multi-modal tokenizers, GraphRAG Neo4j rule engines, and immutable Merkle audit proofs.
            </p>

            {/* Baudhayana Shulba Sutras Shloka Callout */}
            <div className="p-4 rounded-2xl bg-white/60 border border-[#D4AF37]/50 shadow-inner max-w-2xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl select-none">🏛️</span>
                <div className="space-y-1">
                  <div className="font-serif italic font-bold text-xs md:text-sm text-[#4A1504]">
                    "दीर्घस्याक्ष्णया रज्जुः पार्श्वमानी तिर्यङ्ग्मानी च यत्पृथग्भूते कुरुतस्तदुभयं करोति ॥"
                  </div>
                  <p className="text-[11px] text-[#2B1609]/75 font-sans-modern">
                    — <em>Baudhayana Sulba-Sutra 1.48 (~800 BCE)</em>: The foundational Indian theorem of rectangular geometry and spatial planning, embodying the mathematical integrity required for all AICTE institutional physical infrastructure.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onSelectLayer('layer1')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold tracking-wider shadow-md transition-all cursor-pointer"
              >
                <span>Launch Layer-1 Ingestion</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
              <button
                onClick={() => onSelectLayer('layer4')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/80 hover:bg-[#F5E6C8] text-[#4A1504] border border-[#D4AF37]/60 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Network className="w-4 h-4 text-[#D4AF37]" />
                <span>Explore GraphRAG Rule Matrix</span>
              </button>
              <button
                onClick={onOpenReportModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#4A1504] border border-[#D4AF37] rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Scroll className="w-4 h-4 text-[#4A1504]" />
                <span>Print Official EoA Scrutiny Order</span>
              </button>
            </div>
          </div>

          {/* Right: Vedic Scholar Illustration & Verdict Card */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-xs p-5 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-[#D4AF37]/50 shadow-xl text-center space-y-4">
              <div className="relative mx-auto w-36 h-36 rounded-full overflow-hidden border-3 border-[#D4AF37] shadow-lg bg-[#FAF4E8]">
                <img
                  src="/assets/vedic_scholar.png"
                  alt="Vedic Sage Baudhayana"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-[#4A1504] tracking-widest block">
                  Scrutiny Compliance Index
                </span>
                <div className="font-cinzel text-3xl font-extrabold text-[#4A1504] my-1">
                  {institution.overallScore} / 100
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  institution.verdict === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : institution.verdict === 'DEFICIENT'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {institution.verdict === 'PASSED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{institution.verdict.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="text-[11px] text-[#2B1609]/75 pt-3 border-t border-[#D4AF37]/30">
                Permanent AICTE File ID: <span className="font-mono font-bold text-[#4A1504]">{institution.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Layer Architecture Grid */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-cinzel font-bold text-xl text-[#4A1504]">
              Six-Layer Regulatory Verification Pipeline
            </h3>
            <p className="text-xs text-[#2B1609]/70">
              End-to-end scrutiny from multi-page document layout to cryptographically sealed Merkle decisions
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#4A1504] bg-[#D4AF37]/20 px-3 py-1.5 rounded-xl border border-[#D4AF37]/40">
            <Cpu className="w-4 h-4 text-[#D4AF37]" />
            <span>FastAPI Processing Pipeline Synchronized</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {layerCards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              onClick={() => onSelectLayer(card.id)}
              className="group p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#D4AF37]/40 hover:border-[#D4AF37] hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-[#4A1504] text-[#F5E6C8] group-hover:bg-[#D4AF37] group-hover:text-[#4A1504] transition-colors">
                      {card.icon}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D4AF37] block">
                        {card.layerNum}
                      </span>
                      <h4 className="font-cinzel font-bold text-sm text-[#4A1504] group-hover:text-[#2B1609] transition-colors">
                        {card.title}
                      </h4>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    card.status === 'PASSED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : card.status === 'WARNING'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {card.status}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#4A1504] font-semibold bg-[#FAF4E8] px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                  {card.metrics}
                </div>

                <p className="text-xs text-[#2B1609]/80 leading-relaxed">
                  {card.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs font-semibold text-[#4A1504] group-hover:text-[#2B1609]">
                <span className="text-[10px] font-mono text-[#2B1609]/60">{card.tech}</span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  History,
  Scan,
  Compass,
  Zap,
} from 'lucide-react';
import type { InstitutionProfile, ELAPatch } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
}

export const Layer2Forensics: React.FC<Props> = ({ institution }) => {
  const forensics = institution.layer2;
  const [selectedPatch, setSelectedPatch] = useState<ELAPatch | null>(
    forensics.elaPatches[0] || null
  );
  const [elaMultiplier, setElaMultiplier] = useState<number>(20);

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                LAYER 2 • FORENSIC VISION
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                Error Level Analysis (ELA) • Laplacian Blur Gauge • Incremental Revision History
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Visual Forensics & Document Forgery Detection Hub
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Detects pixel compression anomalies, artificial smoothing from digital erasure, font subset mismatches, 
              and incremental PDF trailer splicing indicative of fabricated land deeds or altered institutional approvals.
            </p>
          </div>

          <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-3 shrink-0 ${
            forensics.tamperingVerdict === 'CLEAN'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            {forensics.tamperingVerdict === 'CLEAN' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600 animate-bounce" />
            )}
            <div>
              <span className="block text-[10px] uppercase font-bold opacity-75">Forensics Verdict</span>
              <span className="font-cinzel font-bold text-xs tracking-wider">
                {forensics.tamperingVerdict.replace('_', ' ')} ({forensics.elaAnomalyScore}/100)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Forensics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive ELA Split-Slider Viewer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Interactive Error Level Analysis (ELA) Heatmap Comparison
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#2B1609]/70">Residual Gain: {elaMultiplier}x</span>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={elaMultiplier}
                  onChange={(e) => setElaMultiplier(Number(e.target.value))}
                  className="w-24 accent-[#4A1504] cursor-pointer"
                />
              </div>
            </div>

            {/* Side-by-side document and ELA signal view */}
            <div className="grid gap-4 md:grid-cols-2">
              <section className="overflow-hidden rounded-xl border border-[#4A1504]/20 bg-[#F7F0E3]">
                <div className="flex items-center justify-between border-b border-[#D4AF37]/30 px-4 py-3">
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.16em] text-[#8A672D]">SOURCE VIEW</p>
                    <h4 className="mt-0.5 font-cinzel text-xs font-bold text-[#4A1504]">Illustrative document fields</h4>
                  </div>
                  <Scan className="h-4 w-4 text-[#9B762D]" />
                </div>
                <div className="flex min-h-[270px] flex-col justify-between p-4 sm:min-h-[310px]">
                  <div className="space-y-2 text-[10px] text-[#453426]">
                    <p className="border-b border-[#4A1504]/15 pb-2 text-center font-bold tracking-wide">LAND CONVEYANCE RECORD · {institution.state.toUpperCase()}</p>
                    <p className="text-center text-[9px] text-[#2B1609]/65">Reference {institution.id} · {institution.city.toUpperCase()}</p>
                    <div className="mt-4 rounded-lg border border-[#D4AF37]/45 bg-white/80 p-3">
                      <span className="block text-[9px] uppercase tracking-wide text-[#2B1609]/60">Schedule of property</span>
                      <span className="mt-1 block font-cinzel text-sm font-bold text-[#4A1504]">Declared land: {institution.layer1.payload.landAreaAcres} acres</span>
                    </div>
                    <div className="rounded-lg border border-[#D4AF37]/35 bg-white/70 p-3">
                      <span className="block text-[9px] uppercase tracking-wide text-[#2B1609]/60">Survey reference</span>
                      <span className="mt-1 block font-semibold">{institution.layer1.payload.surveyNumber}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#4A1504]/15 pt-3 text-[9px] text-[#594635]">
                    <span className="rounded-full border border-dashed border-[#9B762D]/60 px-2.5 py-1">SEAL AREA</span>
                    <span className="text-right">{institution.layer3.pkiCertificate.subjectName}<br /><span className="text-[#2B1609]/55">Signature block</span></span>
                  </div>
                </div>
              </section>

              <section className="relative isolate overflow-hidden rounded-xl border border-red-900/30 bg-[#160C09] text-white">
                <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(ellipse at 48% 58%, rgba(239,68,68,.3), transparent 22%), radial-gradient(ellipse at 72% 72%, rgba(245,158,11,.18), transparent 18%), repeating-linear-gradient(0deg, transparent 0 23px, rgba(255,255,255,.035) 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(255,255,255,.035) 24px)' }} />
                <div className="relative flex items-center justify-between border-b border-red-400/25 px-4 py-3">
                  <div>
                    <p className="text-[9px] font-bold tracking-[0.16em] text-red-300">ELA SIGNAL VIEW</p>
                    <h4 className="mt-0.5 font-cinzel text-xs font-bold text-white">Residual intensity map</h4>
                  </div>
                  <span className="rounded border border-white/15 px-2 py-1 text-[9px] font-mono text-white/65">GAIN {elaMultiplier}×</span>
                </div>
                <div className="relative flex min-h-[270px] flex-col justify-between p-4 sm:min-h-[310px]">
                  <div className="flex items-center justify-between text-[9px] font-mono text-white/55"><span>COMPRESSION RESIDUALS</span><span>{forensics.elaAnomalyScore}/100</span></div>
                  <div className="relative mx-auto flex h-32 w-full max-w-[260px] items-center justify-center rounded-lg border border-white/15 bg-white/[0.03]">
                    <span className={`absolute left-[28%] top-[25%] h-16 w-20 rounded-full blur-xl ${forensics.tamperingVerdict === 'CLEAN' ? 'bg-emerald-400/35' : 'bg-red-500/65'}`} />
                    <span className={`absolute right-[20%] bottom-[18%] h-12 w-16 rounded-full blur-lg ${forensics.tamperingVerdict === 'CLEAN' ? 'bg-emerald-300/20' : 'bg-orange-400/55'}`} />
                    <div className={`relative rounded-md border px-4 py-2 text-center text-[9px] font-bold tracking-wide shadow-lg ${forensics.tamperingVerdict === 'CLEAN' ? 'border-emerald-400/70 bg-emerald-950/70 text-emerald-200' : 'border-red-400/80 bg-red-950/80 text-red-200'}`}>
                      {forensics.tamperingVerdict === 'CLEAN' ? 'LOW VARIANCE SIGNAL' : 'ANOMALY REGION'}
                    </div>
                    {forensics.tamperingVerdict !== 'CLEAN' && <span className="absolute left-[31%] top-[29%] h-6 w-8 rounded-full border border-red-300/90" />}
                  </div>
                  <div className={`rounded-lg border p-3 ${forensics.tamperingVerdict === 'CLEAN' ? 'border-emerald-400/30 bg-emerald-950/45' : 'border-red-400/35 bg-red-950/45'}`}>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      {forensics.tamperingVerdict === 'CLEAN' ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <AlertTriangle className="h-4 w-4 text-red-300" />}
                      <span className={forensics.tamperingVerdict === 'CLEAN' ? 'text-emerald-200' : 'text-red-200'}>{forensics.tamperingVerdict === 'CLEAN' ? 'No prominent residual anomaly in this sample' : `Potential residual anomaly · ${institution.layer1.payload.landAreaAcres} acre field`}</span>
                    </div>
                    <p className="mt-1 text-[9px] leading-relaxed text-white/60">Illustrative signal visualization. Review the source document and evidence before drawing conclusions.</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Tampered Patches List */}
          {forensics.elaPatches.length > 0 && (
            <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
              <h4 className="font-cinzel font-bold text-sm text-[#4A1504] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Detected Tampered Regions ({forensics.elaPatches.length} Anomaly Patches)
              </h4>
              <div className="space-y-2">
                {forensics.elaPatches.map((patch) => (
                  <div
                    key={patch.id}
                    onClick={() => setSelectedPatch(patch)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      selectedPatch?.id === patch.id
                        ? 'bg-red-500/15 border-red-500 text-red-950 font-medium'
                        : 'bg-white/60 hover:bg-[#F5E6C8]/60 border-[#D4AF37]/30 text-[#2B1609]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{patch.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                          patch.verdict === 'TAMPERED'
                            ? 'bg-red-700 text-white'
                            : 'bg-emerald-700 text-white'
                        }`}>
                          {patch.verdict}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-85 leading-relaxed">{patch.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-red-700 block">Anomaly</span>
                      <span className="font-mono font-bold text-sm text-red-700">{patch.anomalyScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Gauges, Metadata Tree & pHash */}
        <div className="lg:col-span-4 space-y-4">
          {/* Blur & Artificial Flattening Gauge */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              OpenCV Laplacian Blur & Flattening Gauge
            </h4>

            <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 text-center space-y-2">
              <div className="font-mono font-extrabold text-2xl text-[#4A1504]">
                {forensics.laplacianBlurScore} <span className="text-xs font-normal text-[#2B1609]/60">Variance</span>
              </div>
              <div className="w-full bg-[#EEDFB8] h-2.5 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min((forensics.laplacianBlurScore / 400) * 100, 100)}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    forensics.laplacianBlurScore < 100 ? 'bg-red-600' : 'bg-emerald-600'
                  }`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#2B1609]/60 font-mono">
                <span>0 (Blurred / Smoothed)</span>
                <span>Normal (&gt;250)</span>
                <span>400+ (Sharp)</span>
              </div>
            </div>

            <div className="text-xs text-[#2B1609]/80 space-y-1">
              <div className="flex justify-between">
                <span>Artificial Smoothing:</span>
                <span className={`font-bold ${forensics.artificialFlatteningDetected ? 'text-red-700' : 'text-emerald-700'}`}>
                  {forensics.artificialFlatteningDetected ? 'DETECTED' : 'CLEAN'}
                </span>
              </div>
              <p className="text-[11px] text-[#2B1609]/70 pt-1 border-t border-[#D4AF37]/20">
                {forensics.localizedBlurRegion}
              </p>
            </div>
          </div>

          {/* pHash Template Match */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              Perceptual Hash (pHash) Template Match
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#2B1609]/70">Gazette Template Match:</span>
                <span className="font-mono font-bold text-sm text-[#4A1504]">
                  {forensics.pHashTemplateMatchPercent}%
                </span>
              </div>
              <div className="p-2 bg-[#FAF4E8] rounded-lg border border-[#D4AF37]/30 font-mono text-[11px] text-[#4A1504] break-all">
                Hash: 0x{forensics.pHashSignature}
              </div>
              <p className="text-[11px] text-[#2B1609]/70">
                Matches official State Land Registry form geometry within 4-bit Hamming distance threshold.
              </p>
            </div>
          </div>

          {/* PDF Metadata History Tree */}
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] flex items-center gap-2">
              <History className="w-4 h-4 text-[#D4AF37]" />
              PDF Incremental Revision History Tree
            </h4>

            <div className="space-y-2.5 text-xs text-[#2B1609]">
              <div className="p-2.5 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/30 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 text-[10px]">Creator Tool:</span>
                  <span className="font-semibold text-[11px] text-[#4A1504]">{forensics.metadata.creatorTool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 text-[10px]">Producer Engine:</span>
                  <span className="font-semibold text-[11px] text-[#2B1609]">{forensics.metadata.producer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 text-[10px]">Incremental Revisions:</span>
                  <span className="font-mono font-bold text-[#4A1504]">{forensics.metadata.incrementalRevisions} Saves</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 text-[10px]">Font Subset Integrity:</span>
                  <span className={`font-bold text-[10px] ${
                    forensics.metadata.fontIntegrity === 'CLEAN' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {forensics.metadata.fontIntegrity}
                  </span>
                </div>
              </div>

              {forensics.metadata.suspiciousRevisionTrace && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-950 text-[11px] space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[9px] text-red-700 block">
                    Suspicious Splicing Byte Trace:
                  </span>
                  <p className="font-mono leading-relaxed">{forensics.metadata.suspiciousRevisionTrace}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

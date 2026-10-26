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
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100
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

            {/* Split Slider Interactive Viewer */}
            <div className="relative w-full aspect-[1/1.25] rounded-xl overflow-hidden border-2 border-[#4A1504]/30 select-none bg-[#FAF4E8]">
              {/* Background: Original Document Layer */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between text-[#2B1609] font-serif">
                <div className="text-center border-b border-[#2B1609]/20 pb-3">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-[#4A1504]">
                    GOVERNMENT LAND CONVEYANCE REGISTER • {institution.state.toUpperCase()}
                  </div>
                  <div className="text-xs font-bold mt-1">
                    PERMANENT DOSSIER REF: {institution.id} • {institution.city.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4 text-xs my-auto">
                  <p>WHEREAS the applicant educational trust claims continuous legal title:</p>
                  <div className="p-3 bg-white/80 rounded border border-[#D4AF37]/40 relative">
                    <span className="text-[10px] text-[#2B1609]/60 block">SCHEDULE OF PROPERTY — CLAUSE 14</span>
                    <p className="font-bold text-sm text-[#4A1504] mt-1">
                      Total Contiguous Land Demarcation: <span className={forensics.tamperingVerdict !== 'CLEAN' ? 'underline decoration-red-500 decoration-2' : ''}>{institution.layer1.payload.landAreaAcres} ACRES</span>
                    </p>
                    {forensics.tamperingVerdict !== 'CLEAN' && (
                      <span className="text-[9px] text-red-600 font-mono block mt-1">
                        * Document text visually rendered as {institution.layer1.payload.landAreaAcres} ACRES
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-white/80 rounded border border-[#D4AF37]/40">
                    <span className="text-[10px] text-[#2B1609]/60 block">MUNICIPAL SURVEY / KHASRA NUMBERS</span>
                    <p className="font-semibold text-xs mt-0.5">{institution.layer1.payload.surveyNumber}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-[#2B1609]/20 pt-4">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#4A1504]/50 flex items-center justify-center text-center p-1 text-[8px] uppercase font-bold text-[#4A1504]">
                    Sub-Registrar Official Embossed Seal
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="font-serif italic font-bold">{institution.layer3.pkiCertificate.subjectName}</div>
                    <div className="text-[8px] text-[#2B1609]/60">Authorized Signatory</div>
                  </div>
                </div>
              </div>

              {/* Foreground: ELA Heatmap Layer (Clipped by Slider) */}
              <div
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                className="absolute inset-0 bg-[#0F0804] text-white p-6 flex flex-col justify-between font-mono transition-none"
              >
                <div className="text-center border-b border-red-500/30 pb-3">
                  <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                    [ELA RESIDUAL INTENSITY MATRIX • GAIN {elaMultiplier}x]
                  </div>
                  <div className="text-xs text-red-300 font-bold mt-1">
                    HIGH ERROR CONCENTRATION AT MODIFIED PIXEL CLUSTERS
                  </div>
                </div>

                <div className="space-y-4 text-xs my-auto">
                  <p className="text-gray-400">Residual pixel entropy calculated via JPEG 95% re-compression delta:</p>
                  
                  {forensics.tamperingVerdict !== 'CLEAN' ? (
                    <div className="p-3 bg-red-950/80 rounded border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)] relative animate-pulse">
                      <span className="text-[9px] text-red-400 uppercase font-bold block">
                        ⚠ HIGH FREQUENCY COMPRESSION RESIDUAL ANOMALY
                      </span>
                      <p className="font-bold text-sm text-red-300 mt-1">
                        Target Area: {institution.layer1.payload.landAreaAcres} ACRES [Residual Energy: {forensics.elaAnomalyScore} / 100]
                      </p>
                      <span className="text-[9px] text-amber-300 font-mono block mt-1">
                        Tampering Verdict: Digital Insertion. Overwritten acreage text and spliced stamp boundary.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/80 rounded border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-emerald-300">
                      <span className="text-[9px] uppercase font-bold block text-emerald-400">
                        ✓ UNIFORM LOW-ENTROPY NATIVE SCAN
                      </span>
                      <p className="font-bold text-sm mt-1">
                        Target Area: {institution.layer1.payload.landAreaAcres} ACRES [Residual Energy: {forensics.elaAnomalyScore} / 100]
                      </p>
                      <span className="text-[9px] text-emerald-400 font-mono block mt-1">
                        Verified Clean: No digital insertion, splicing, or compression halos detected.
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-black/60 rounded border border-gray-700 text-gray-500">
                    <span className="text-[9px] block">Survey Baseline ({institution.layer1.payload.surveyNumber})</span>
                    <span className="text-[10px] text-emerald-400">Baseline Flatbed Scan Noise Verified</span>
                  </div>
                </div>

                {/* Glowing Tampered Seal Hotspot */}
                <div className="flex justify-between items-end border-t border-red-500/30 pt-4">
                  <div className="w-24 h-24 rounded-full border-2 border-red-500 bg-red-950/70 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center text-center p-1 text-[8px] uppercase font-bold text-red-300">
                    Spliced Alpha Seal Detected
                  </div>
                  <div className="text-right text-[10px] text-gray-400">
                    <div>Signature Block: Clean</div>
                    <div className="text-[8px] text-emerald-400">Consistent Ink Artifacts</div>
                  </div>
                </div>
              </div>

              {/* Slider Divider Bar */}
              <div
                style={{ left: `${sliderPosition}%` }}
                className="absolute top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)] z-30 pointer-events-none"
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#4A1504] border-2 border-[#D4AF37] text-[#F5E6C8] flex items-center justify-center shadow-lg text-[9px] font-bold">
                  ⇄
                </div>
              </div>

              {/* Drag controller overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
              />
            </div>

            {/* Slider Controls Hint */}
            <div className="flex items-center justify-between text-xs text-[#2B1609]/70 px-2">
              <span>◀ Original Document View (Left)</span>
              <span className="font-mono text-[#4A1504] font-semibold">Drag slider across canvas to reveal ELA heatmap</span>
              <span>ELA Difference Residuals (Right) ▶</span>
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

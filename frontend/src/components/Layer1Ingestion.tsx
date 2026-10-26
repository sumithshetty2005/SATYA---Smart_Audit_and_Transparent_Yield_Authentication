import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Eye,
  Sliders,
  BadgeAlert,
} from 'lucide-react';
import type { InstitutionProfile, TokenItem } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
}

export const Layer1Ingestion: React.FC<Props> = ({ institution }) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [hoveredToken, setHoveredToken] = useState<TokenItem | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenItem | null>(null);
  const [activeTab, setActiveTab] = useState<'tokens' | 'pydantic_preview' | 'raw_schema'>('tokens');
  const [copied, setCopied] = useState(false);
  const [activePage, setActivePage] = useState<number>(1);

  const tokens = institution.layer1.tokens;
  const payload = institution.layer1.payload;

  const filteredTokens = tokens.filter((t) => {
    if (activeFilter === 'ALL') return true;
    return t.label === activeFilter;
  });

  const handleCopySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(institution.layer1.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLabelColor = (label: TokenItem['label']) => {
    switch (label) {
      case 'HEADER':
        return 'border-purple-500 bg-purple-500/15 text-purple-900';
      case 'KEY':
        return 'border-blue-500 bg-blue-500/15 text-blue-900';
      case 'VALUE':
        return 'border-amber-600 bg-amber-500/15 text-amber-900';
      case 'TABLE_CELL':
        return 'border-emerald-500 bg-emerald-500/15 text-emerald-900';
      case 'SEAL':
        return 'border-red-500 bg-red-500/20 text-red-900 font-bold';
      case 'SIGNATURE':
        return 'border-cyan-600 bg-cyan-500/15 text-cyan-900';
      default:
        return 'border-gray-500 bg-gray-500/10 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Layer Header */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                LAYER 1 • MULTI-MODAL OCR
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                Microsoft LayoutLMv3 Base Tokenizer + Pydantic v2 Parsing Pipeline
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Multi-Page PDF Ingestion & Document Token Extraction
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Converts uploaded institutional deeds and forms into high-resolution normalized 2D coordinate space [0, 1000].
              Visual embeddings and text tokens are jointly classified into semantic entities (Land Title, Cadre Table, Registrar Seal, Signature).
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 shrink-0 bg-[#FAF4E8] p-3 rounded-xl border border-[#D4AF37]/40">
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-[#4A1504]">Classified Tokens</span>
              <span className="font-mono font-extrabold text-base text-[#2B1609]">{tokens.length} Elements</span>
            </div>
            <div className="h-8 w-px bg-[#D4AF37]/40" />
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-emerald-700">Schema Validation</span>
              <span className="font-mono font-extrabold text-xs text-emerald-800">Pydantic OK</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'tokens'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-sm'
                  : 'bg-white/60 hover:bg-[#F5E6C8] text-[#2B1609]'
              }`}
            >
              Interactive LayoutLMv3 Token Viewer
            </button>
            <button
              onClick={() => setActiveTab('pydantic_preview')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'pydantic_preview'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-sm'
                  : 'bg-white/60 hover:bg-[#F5E6C8] text-[#2B1609]'
              }`}
            >
              Structured Pydantic Entities
            </button>
            <button
              onClick={() => setActiveTab('raw_schema')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'raw_schema'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-sm'
                  : 'bg-white/60 hover:bg-[#F5E6C8] text-[#2B1609]'
              }`}
            >
              Raw JSON Schema Payload
            </button>
          </div>

          {/* Page Picker */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#2B1609]/70 font-medium">Document Page:</span>
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => setActivePage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activePage === p
                    ? 'bg-[#4A1504] text-[#F5E6C8]'
                    : 'bg-white/60 hover:bg-[#F5E6C8] text-[#2B1609] border border-[#D4AF37]/30'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace based on Tab */}
      {activeTab === 'tokens' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Document Canvas with Interactive Bounding Box Overlays */}
          <div className="lg:col-span-8 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white/60 rounded-xl border border-[#D4AF37]/30 text-xs">
              <span className="text-[11px] font-semibold text-[#4A1504] mr-2">Token Filter:</span>
              {['ALL', 'HEADER', 'KEY', 'VALUE', 'TABLE_CELL', 'SEAL', 'SIGNATURE'].map((label) => (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                    activeFilter === label
                      ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                      : 'bg-white/70 hover:bg-[#F5E6C8] text-[#2B1609]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Document Page Canvas */}
            <div className="relative w-full aspect-[1/1.3] bg-[#FAF4E8] rounded-2xl border-2 border-[#D4AF37]/60 shadow-xl overflow-hidden p-6 select-none font-serif">
              {/* Paper Watermark */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url('/assets/mandala.png')` }}
              />

              {/* Faux Government Document Header */}
              <div className="text-center pb-4 mb-4 border-b border-[#2B1609]/20 relative z-10">
                <div className="text-[10px] tracking-widest uppercase font-bold text-[#4A1504]">
                  GOVERNMENT OF {institution.state.toUpperCase()} • REVENUE & LAND REGISTRATION DEPARTMENT
                </div>
                <div className="text-xs font-bold text-[#2B1609] mt-0.5">
                  OFFICIAL TITLE DEED & AFFIDAVIT • FILE REF: {institution.id}
                </div>
                <div className="text-[9px] font-mono text-[#2B1609]/60">
                  Cadastral Survey Location: {institution.layer1.payload.surveyNumber} • {institution.city} ({institution.region} Region)
                </div>
              </div>

              {/* Rendered Interactive Token Bounding Boxes */}
              <div className="relative w-full h-[85%]">
                {filteredTokens.map((token) => {
                  const [ymin, xmin, ymax, xmax] = token.bbox;
                  const isHovered = hoveredToken?.id === token.id;
                  const isSelected = selectedToken?.id === token.id;
                  const top = `${(ymin / 1000) * 100}%`;
                  const left = `${(xmin / 1000) * 100}%`;
                  const height = `${((ymax - ymin) / 1000) * 100}%`;
                  const width = `${((xmax - xmin) / 1000) * 100}%`;

                  return (
                    <div
                      key={token.id}
                      onMouseEnter={() => setHoveredToken(token)}
                      onMouseLeave={() => setHoveredToken(null)}
                      onClick={() => setSelectedToken(token)}
                      style={{ top, left, height, width }}
                      className={`absolute rounded border cursor-pointer transition-all duration-150 flex items-center px-2 text-xs ${getLabelColor(
                        token.label
                      )} ${
                        isHovered || isSelected
                          ? 'ring-2 ring-[#4A1504] shadow-lg z-20 scale-[1.01]'
                          : 'z-10'
                      } ${token.highlight ? 'animate-pulse' : ''}`}
                    >
                      <span className="truncate text-[11px] font-mono font-medium">
                        {token.text}
                      </span>
                      <span className="ml-auto text-[8px] font-mono opacity-80 pl-1 shrink-0">
                        {(token.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Token Inspector & Bounding Box Coordinates */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-4">
              <h3 className="font-cinzel font-bold text-sm text-[#4A1504] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                LayoutLMv3 Token Coordinate Inspector
              </h3>

              {hoveredToken || selectedToken ? (
                (() => {
                  const target = hoveredToken || selectedToken!;
                  return (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#4A1504] text-[#F5E6C8]">
                            {target.label}
                          </span>
                          <span className="font-mono text-xs font-bold text-emerald-700">
                            Confidence: {(target.confidence * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="font-serif font-bold text-sm text-[#2B1609]">
                          "{target.text}"
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-[#4A1504]">
                          Normalized 2D Bounding Box [ymin, xmin, ymax, xmax]:
                        </span>
                        <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs">
                          <div className="p-2 bg-white rounded border border-[#D4AF37]/30">
                            <span className="block text-[9px] text-[#2B1609]/50">Y-Min</span>
                            <span className="font-bold text-[#4A1504]">{target.bbox[0]}</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-[#D4AF37]/30">
                            <span className="block text-[9px] text-[#2B1609]/50">X-Min</span>
                            <span className="font-bold text-[#4A1504]">{target.bbox[1]}</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-[#D4AF37]/30">
                            <span className="block text-[9px] text-[#2B1609]/50">Y-Max</span>
                            <span className="font-bold text-[#4A1504]">{target.bbox[2]}</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-[#D4AF37]/30">
                            <span className="block text-[9px] text-[#2B1609]/50">X-Max</span>
                            <span className="font-bold text-[#4A1504]">{target.bbox[3]}</span>
                          </div>
                        </div>
                      </div>

                      {target.highlight && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] flex items-start gap-2">
                          <BadgeAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Flagged for Cross-Layer Auditing:</strong> This token exhibits significant downstream variance in Layer 2 (ELA Forensics) or Layer 3 (DigiLocker Authority).
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 text-xs text-[#2B1609]/60 space-y-2">
                  <Eye className="w-8 h-8 text-[#D4AF37]/50 mx-auto" />
                  <p>Hover over or click any token in the document canvas to inspect OCR confidence and 2D bounding box geometry.</p>
                </div>
              )}
            </div>

            {/* Quick Document Summary */}
            <div className="p-5 rounded-2xl bg-white/70 border border-[#D4AF37]/40 shadow-sm space-y-3">
              <h4 className="font-cinzel font-bold text-xs text-[#4A1504] uppercase tracking-wider">
                Extracted Filing Identity
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#D4AF37]/20 pb-1">
                  <span className="text-[#2B1609]/70">Land Demarcation:</span>
                  <span className="font-bold text-[#4A1504]">{payload.landAreaAcres} Acres</span>
                </div>
                <div className="flex justify-between border-b border-[#D4AF37]/20 pb-1">
                  <span className="text-[#2B1609]/70">Instructional Area:</span>
                  <span className="font-bold text-[#2B1609]">{payload.instructionalAreaSqm.toLocaleString()} sq.m</span>
                </div>
                <div className="flex justify-between border-b border-[#D4AF37]/20 pb-1">
                  <span className="text-[#2B1609]/70">Faculty Cadre:</span>
                  <span className="font-bold text-[#2B1609]">{payload.cadre.ratio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/70">Student-Faculty Ratio:</span>
                  <span className="font-bold text-[#4A1504]">{payload.studentFacultyRatio}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pydantic Entities Preview Tab */}
      {activeTab === 'pydantic_preview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 bg-white/70 rounded-2xl border border-[#D4AF37]/40 space-y-3">
            <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase">Vector 1 • Land Holdings</span>
            <h4 className="font-cinzel font-bold text-base text-[#4A1504]">Campus Land Demarcation</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Stated Land Area:</span>
                <span className="font-mono font-bold text-sm text-[#4A1504]">{payload.landAreaAcres} Acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Contiguity Status:</span>
                <span className="font-semibold text-emerald-700">Contiguous Title</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Survey / Dag Number:</span>
                <span className="font-mono text-[#2B1609]">{payload.surveyNumber}</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/70 rounded-2xl border border-[#D4AF37]/40 space-y-3">
            <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase">Vector 2 • Physical Built-Up</span>
            <h4 className="font-cinzel font-bold text-base text-[#4A1504]">Built-Up Area Breakdown</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Total Built-Up Area:</span>
                <span className="font-mono font-bold text-sm text-[#4A1504]">{payload.builtUpAreaSqm.toLocaleString()} sq.m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Instructional Carpet:</span>
                <span className="font-mono text-[#2B1609]">{payload.instructionalAreaSqm.toLocaleString()} sq.m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Circulation Ratio:</span>
                <span className="font-mono text-[#2B1609]">{(payload.circulationAreaRatio * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/70 rounded-2xl border border-[#D4AF37]/40 space-y-3">
            <span className="text-[10px] font-mono font-bold text-[#D4AF37] uppercase">Vector 3 • Teaching Cadre</span>
            <h4 className="font-cinzel font-bold text-base text-[#4A1504]">Faculty Roster & Cadre</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Total Faculty Count:</span>
                <span className="font-mono font-bold text-sm text-[#4A1504]">{payload.facultyCount} Members</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Prof : Assoc : Asst:</span>
                <span className="font-mono text-[#2B1609]">{payload.cadre.professors} : {payload.cadre.associateProfessors} : {payload.cadre.assistantProfessors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Cadre Compliance:</span>
                <span className={`font-bold ${payload.cadre.cadreCompliant ? 'text-emerald-700' : 'text-red-700'}`}>
                  {payload.cadre.cadreCompliant ? 'Compliant 1:2:6' : 'Deficient Skew'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Schema Tab */}
      {activeTab === 'raw_schema' && (
        <div className="p-6 rounded-2xl bg-[#2B1609] text-[#F5E6C8] font-mono text-xs border border-[#D4AF37]/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#FAF4E8]">ExtractedApplicationPayload (Pydantic v2 Schema Output)</span>
            </div>
            <button
              onClick={handleCopySchema}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#4A1504] hover:bg-[#D4AF37] hover:text-[#4A1504] rounded-lg text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="max-h-96 overflow-y-auto text-[11px] leading-relaxed text-[#FAF4E8]/90 scrollbar-thin">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

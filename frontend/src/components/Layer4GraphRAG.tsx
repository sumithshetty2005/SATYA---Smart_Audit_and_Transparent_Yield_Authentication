import React, { useState } from 'react';
import {
  Network,
  Cpu,
  Filter,
} from 'lucide-react';
import type { InstitutionProfile, GraphNode, APHCitation } from '../types/compliance';

interface Props {
  institution: InstitutionProfile;
}

export const Layer4GraphRAG: React.FC<Props> = ({ institution }) => {
  const { nodes, edges, agentSteps, citations, compliancePercentage } = institution.layer4;
  const [filterMode, setFilterMode] = useState<'ALL' | 'VIOLATIONS' | 'COMPLIANT'>('ALL');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0] || null);
  const [selectedCitation, setSelectedCitation] = useState<APHCitation | null>(citations[0] || null);

  const filteredNodes = nodes.filter((node) => {
    if (filterMode === 'ALL') return true;
    if (filterMode === 'VIOLATIONS') return node.status === 'VIOLATION';
    if (filterMode === 'COMPLIANT') return node.status === 'COMPLIANT';
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
                LAYER 4 • AGENTIC GRAPHRAG
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                Neo4j Knowledge Graph Traversal • Hybrid BM25 + BGE-M3 RRF • LangGraph Multi-Agent
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              GraphRAG APH 2024–2027 Regulatory Compliance Engine
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Constructs dynamic 1- to 2-hop subgraphs across AICTE Approval Process Handbook (APH 2024–2027). 
              Orchestrates 4 specialized LLM agents to detect mathematical and physical threshold shortfalls with exact statutory citations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 text-right">
              <span className="block text-[10px] uppercase font-bold text-[#4A1504]">Statutory Compliance</span>
              <span className="font-mono font-extrabold text-lg text-[#2B1609]">{compliancePercentage}%</span>
            </div>
            <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-300 text-right">
              <span className="block text-[10px] uppercase font-bold text-red-700">Flagged Gaps</span>
              <span className="font-mono font-extrabold text-lg">{citations.length} Gaps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Knowledge Graph Visualizer & Agent Trace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Neo4j Knowledge Graph Visualizer */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Neo4j Knowledge Graph Sub-Graph Visualizer (APH Rules & Institutional Facts)
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-3.5 h-3.5 text-[#4A1504]" />
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value as any)}
                  className="bg-[#FAF4E8] border border-[#D4AF37]/40 rounded px-2 py-1 text-[11px] text-[#4A1504] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Show All Nodes ({nodes.length})</option>
                  <option value="VIOLATIONS">Violations Only</option>
                  <option value="COMPLIANT">Compliant Only</option>
                </select>
              </div>
            </div>

            {/* Interactive SVG Graph Canvas */}
            <div className="relative w-full aspect-[16/10] bg-[#FAF4E8] rounded-xl border-2 border-[#D4AF37]/40 shadow-inner overflow-hidden select-none">
              {/* Subtle Mandala Watermark in Canvas */}
              <div
                className="absolute inset-0 pointer-events-none opacity-5 bg-center bg-no-repeat bg-contain"
                style={{ backgroundImage: `url('/assets/mandala.png')` }}
              />

              <svg className="w-full h-full" viewBox="0 0 600 440">
                {/* Graph Edges */}
                {edges.map((edge, idx) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const isViolated = edge.status === 'VIOLATED';

                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x || 300}
                        y1={sourceNode.y || 200}
                        x2={targetNode.x || 300}
                        y2={targetNode.y || 200}
                        stroke={isViolated ? '#DC2626' : '#C59B27'}
                        strokeWidth={isViolated ? '2.5' : '1.5'}
                        strokeDasharray={isViolated ? '4 3' : undefined}
                        className={isViolated ? 'animate-pulse' : ''}
                      />
                      {/* Edge Label Pill */}
                      <text
                        x={((sourceNode.x || 300) + (targetNode.x || 300)) / 2}
                        y={((sourceNode.y || 200) + (targetNode.y || 200)) / 2 - 4}
                        fill={isViolated ? '#991B1B' : '#4A1504'}
                        fontSize="7"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {edge.relationship}
                      </text>
                    </g>
                  );
                })}

                {/* Graph Nodes */}
                {filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isViolation = node.status === 'VIOLATION';
                  const isCompliant = node.status === 'COMPLIANT';

                  let fillColor = '#FAF4E8';
                  let strokeColor = '#D4AF37';
                  let textColor = '#4A1504';

                  if (node.type === 'INSTITUTION') {
                    fillColor = '#4A1504';
                    strokeColor = '#D4AF37';
                    textColor = '#F5E6C8';
                  } else if (isViolation) {
                    fillColor = '#FEE2E2';
                    strokeColor = '#DC2626';
                    textColor = '#991B1B';
                  } else if (isCompliant) {
                    fillColor = '#ECFDF5';
                    strokeColor = '#059669';
                    textColor = '#065F46';
                  }

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {/* Glow halo on selected */}
                      {isSelected && (
                        <circle
                          cx={node.x || 300}
                          cy={node.y || 200}
                          r="32"
                          fill="none"
                          stroke="#D4AF37"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin-slow"
                        />
                      )}

                      <circle
                        cx={node.x || 300}
                        cy={node.y || 200}
                        r="24"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? '3' : '2'}
                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                      />

                      <text
                        x={node.x || 300}
                        y={(node.y || 200) + 3}
                        fill={textColor}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {node.type === 'INSTITUTION' ? '🏛️' : node.type === 'RULE' ? '📜' : '📍'}
                      </text>

                      {/* Node Label Below */}
                      <text
                        x={node.x || 300}
                        y={(node.y || 200) + 34}
                        fill="#2B1609"
                        fontSize="8"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                      >
                        {node.name.length > 22 ? `${node.name.slice(0, 20)}...` : node.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-2 left-3 text-[10px] text-[#2B1609]/60 font-mono">
                Neo4j Bolt: bolt://neo4j.aicte.gov.in:7687 | Subgraph: APH-2024-27
              </div>
            </div>

            {/* Selected Node Details Drawer */}
            {selectedNode && (
              <div className="p-4 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel font-bold text-sm text-[#4A1504]">
                    Node: {selectedNode.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedNode.status === 'VIOLATION'
                      ? 'bg-red-100 text-red-800'
                      : selectedNode.status === 'COMPLIANT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-[#D4AF37]/20 text-[#4A1504]'
                  }`}>
                    {selectedNode.type} {selectedNode.status ? `• ${selectedNode.status}` : ''}
                  </span>
                </div>
                {selectedNode.clause && (
                  <div className="text-[11px] font-mono text-[#4A1504] font-semibold">
                    Statutory Handbook Reference: {selectedNode.clause}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Agent Collaborative Trace */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm space-y-3">
            <h4 className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#4A1504] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#D4AF37]" />
              Multi-Agent Orchestration Trace (LangGraph)
            </h4>

            <div className="space-y-3">
              {agentSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF4E8] border border-[#D4AF37]/30 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[#4A1504]">
                      <span className="text-base">{step.agentIcon}</span>
                      <span>{step.agentName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#2B1609]/60">
                      {step.latencyMs} ms
                    </span>
                  </div>

                  <p className="text-[11px] text-[#2B1609]/80 leading-relaxed">
                    {step.summary}
                  </p>

                  <div className="space-y-1 pt-1 border-t border-[#D4AF37]/20">
                    {step.findings.map((f, fIdx) => (
                      <div key={fIdx} className="text-[10px] text-[#4A1504] font-medium flex items-center gap-1.5">
                        <span className="text-[#D4AF37]">▸</span>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Citations Table */}
      <div className="p-6 rounded-2xl bg-white/75 backdrop-blur-md border border-[#D4AF37]/50 shadow-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
          <div>
            <h3 className="font-cinzel font-bold text-base text-[#4A1504]">
              Grounded AICTE APH Regulatory Citations & Enforcement Findings
            </h3>
            <p className="text-xs text-[#2B1609]/70">
              Generated by XAI Citation Agent with exact statutory provisions under AICTE Act 1987
            </p>
          </div>
          <span className="px-3 py-1 bg-[#4A1504] text-[#F5E6C8] text-xs font-cinzel font-bold rounded-lg">
            {citations.length} Active Citations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {citations.map((cit) => (
            <div
              key={cit.id}
              onClick={() => setSelectedCitation(cit)}
              className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-3 ${
                selectedCitation?.id === cit.id
                  ? 'bg-red-500/10 border-red-500 shadow-md'
                  : 'bg-white/60 hover:bg-[#FAF4E8] border-[#D4AF37]/30 text-[#2B1609]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-700 text-white">
                  {cit.severity.replace('_', ' ')}
                </span>
                <span className="font-mono text-[10px] text-[#4A1504] font-semibold">{cit.aphClause}</span>
              </div>

              <div>
                <h4 className="font-cinzel font-bold text-sm text-[#4A1504]">{cit.ruleTitle}</h4>
                <p className="text-[10px] text-[#2B1609]/70 font-mono mt-0.5">{cit.aphChapter}</p>
              </div>

              <div className="space-y-1.5 p-2.5 bg-white/70 rounded-lg border border-[#D4AF37]/20 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60">Statutory Norm:</span>
                  <span className="font-semibold text-[#4A1504]">{cit.statutoryThreshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60">Verified Fact:</span>
                  <span className="font-bold text-red-700">{cit.institutionalValue}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#D4AF37]/20">
                  <span className="text-[#2B1609]/60">Calculated Delta:</span>
                  <span className="font-mono font-bold text-red-800">{cit.delta}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#2B1609]/80 italic border-l-2 border-[#D4AF37] pl-2">
                "{cit.legalEnforcementStatement}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

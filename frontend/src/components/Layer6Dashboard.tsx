import React, { useState } from 'react';
import { Scroll } from 'lucide-react';
import type {
  ScrutinyApplicationRecord,
  MerkleNode,
  ScrutinyAction,
} from '../types/merkle';
import { SCRUTINY_APPLICATIONS } from '../data/scrutinyApplicationsData';
import { MerkleAuditLedger } from './MerkleAuditLedger';
import { OfficerReviewWorkbench } from './OfficerReviewWorkbench';
import { buildMerkleTree } from '../utils/crypto';

interface Props {
  onOpenReportModal?: () => void;
}

export const Layer6Dashboard: React.FC<Props> = ({ onOpenReportModal }) => {
  // Store applications in state so officer decisions append live
  const [applications, setApplications] = useState<ScrutinyApplicationRecord[]>(
    SCRUTINY_APPLICATIONS
  );
  const [selectedAppId, setSelectedAppId] = useState<string>(
    SCRUTINY_APPLICATIONS[0].applicationId
  );
  const [activeTab, setActiveTab] = useState<'workbench' | 'ledger' | 'unified'>('workbench');

  const currentApp =
    applications.find((a) => a.applicationId === selectedAppId) || applications[0];

  // Callback when officer submits decision in workbench
  const handleAppendOfficerDecision = (action: ScrutinyAction, newMerkleNode: MerkleNode) => {
    setApplications((prevApps) =>
      prevApps.map((app) => {
        if (app.applicationId !== currentApp.applicationId) return app;

        const updatedNodes = [...app.merkleNodes, newMerkleNode];
        // Recalculate tree root
        const tree = buildMerkleTree(updatedNodes.map((n) => n.hash));

        // Update node root references
        const syncedNodes = updatedNodes.map((n) => ({
          ...n,
          merkleRoot: tree.root,
        }));

        let newStatus = app.globalStatus;
        if (action.actionType === 'APPROVE') newStatus = 'PASSED';
        if (action.actionType === 'REJECT') newStatus = 'REJECTED';
        if (action.actionType === 'DISCREPANCY_NOTICE') newStatus = 'FLAGGED FOR SCRUTINY';

        return {
          ...app,
          globalStatus: newStatus,
          storedRootHash: tree.root,
          merkleNodes: syncedNodes,
          actionsHistory: [action, ...app.actionsHistory],
        };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Level Layer Navigation & Dossier Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A1504] text-[#F5E6C8] flex items-center justify-center shadow-sm">
            <Scroll className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-vedic text-[10px] font-bold text-[#4A1504] uppercase">
                AICTE LAYER 6 ENGINE
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded font-bold">
                SHA-256 LEDGER SYNCED
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-base text-[#4A1504]">
              Web Dashboard &amp; Cryptographic Audit Chain Engine
            </h2>
          </div>
        </div>

        {/* View Switcher Tabs & Application Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Dossier Quick Switcher */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-[#4A1504] text-[11px] hidden sm:inline">Dossier:</span>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="p-2 bg-[#FAF4E8] border border-[#D4AF37]/50 rounded-xl text-xs font-mono font-semibold text-[#4A1504] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
            >
              {applications.map((app) => (
                <option key={app.applicationId} value={app.applicationId}>
                  {app.applicationId} • {app.institutionName.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-[#FAF4E8] p-1 rounded-xl border border-[#D4AF37]/40 text-xs font-cinzel font-bold">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'workbench'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                  : 'text-[#4A1504] hover:bg-white/60'
              }`}
            >
              Officer Review Workbench
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                  : 'text-[#4A1504] hover:bg-white/60'
              }`}
            >
              Cryptographic Audit Log
            </button>
            <button
              onClick={() => setActiveTab('unified')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer hidden lg:block ${
                activeTab === 'unified'
                  ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                  : 'text-[#4A1504] hover:bg-white/60'
              }`}
            >
              Dual-Pane View
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content Display */}
      {activeTab === 'workbench' && (
        <OfficerReviewWorkbench
          application={currentApp}
          onAppendOfficerDecision={handleAppendOfficerDecision}
          onOpenReportModal={onOpenReportModal}
        />
      )}

      {activeTab === 'ledger' && (
        <MerkleAuditLedger
          application={currentApp}
          nodes={currentApp.merkleNodes}
          merkleRoot={currentApp.storedRootHash}
        />
      )}

      {activeTab === 'unified' && (
        <div className="space-y-8">
          <OfficerReviewWorkbench
            application={currentApp}
            onAppendOfficerDecision={handleAppendOfficerDecision}
            onOpenReportModal={onOpenReportModal}
          />
          <div className="pt-6 border-t-2 border-[#D4AF37]/40">
            <MerkleAuditLedger
              application={currentApp}
              nodes={currentApp.merkleNodes}
              merkleRoot={currentApp.storedRootHash}
            />
          </div>
        </div>
      )}
    </div>
  );
};

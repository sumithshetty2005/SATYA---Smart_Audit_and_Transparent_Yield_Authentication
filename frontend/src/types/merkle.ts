/**
 * Types & Data Models for Layer 6:
 * Web Dashboard & Cryptographic Audit Chain Engine
 * Problem Statement SH26261: AICTE Regulatory Compliance & Verification
 */

export type EventType =
  | 'DOCUMENT_INGESTION'
  | 'ELA_FORGERY_CHECK'
  | 'DIGILOCKER_PKI_RECEIPT'
  | 'NEO4J_GRAPHRAG_EVAL'
  | 'OFFICER_SCRUTINY_DECISION';

export type MerkleBlockStatus = 'PASSED' | 'FLAGGED_TAMPERED' | 'VERIFIED' | 'TAMPERED';
export type LeafStatus = 'VALID' | 'TAMPERED';
export type GlobalComplianceStatus = 'PASSED' | 'FLAGGED FOR SCRUTINY' | 'REJECTED';
export type OfficerDecisionType = 'APPROVE' | 'DISCREPANCY_NOTICE' | 'REJECT';

export interface MerkleNode {
  id: string;
  blockHeight: number;
  stepNumber: number;
  stepTitle: string;
  eventType: EventType;
  hash: string;
  parentHash: string | null;
  previousHash: string;
  payloadHash: string;
  timestamp: string;
  nonce: number;
  status: MerkleBlockStatus;
  leafStatus: LeafStatus;
  leftHash: string | null;
  rightHash: string | null;
  merkleProof: string[];
  merkleRoot: string;
  payloadSummary: string;
  metadata: {
    sourceModule: string;
    targetEntity?: string;
    confidenceScore?: number;
    anomalyDetected?: boolean;
    aphClauseCitation?: string;
    signerIdentity?: string;
    officerRemarks?: string;
    [key: string]: any;
  };
}

export interface ScrutinyAction {
  actionId: string;
  actionType: OfficerDecisionType;
  applicationId: string;
  institutionName: string;
  officerName: string;
  officerRole: 'Senior Scrutiny Officer' | 'Regional Director' | 'Member Secretary AICTE';
  officerSignature: string;
  notes: string;
  timestamp: string;
  resultingLeafHash: string;
}

export type BBoxCategory = 'LAYOUTLMV3' | 'ELA_FORGERY' | 'YOLO_CAD';
export type BBoxColor = 'blue' | 'red' | 'yellow';

export interface BoundingBoxOverlay {
  id: string;
  boxType: BBoxCategory;
  boxColor: BBoxColor;
  label: string;
  value: string;
  bbox: [number, number, number, number]; // [top %, left %, width %, height %]
  confidence: number;
  evidenceNote: string;
  statutoryClause?: string;
  statusText?: string;
}

export interface GraphRAGGapFinding {
  id: string;
  ruleTitle: string;
  clauseReference: string; // e.g., "Chapter II, Clause 2.4.1"
  aphSection: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'COMPLIANT';
  extractedValue: string;
  statutoryThreshold: string;
  discrepancyDelta: string;
  legalWarning: string;
  explanation: string;
}

export interface ScrutinyApplicationRecord {
  applicationId: string; // e.g., "AICTE-2026-NRO-8849201"
  institutionName: string; // "Vidyapeeth Institute of Technology & Management"
  programType: string; // "Undergraduate Technical / Engineering (B.Tech 4-Year)"
  globalStatus: GlobalComplianceStatus;
  region: string;
  establishedYear: number;
  sanctionedIntake: number;
  documentTitle: string;
  documentPagesCount: number;
  landClaimedAcres: number;
  landVerifiedAcres: number;
  builtUpAreaSqm: number;
  facultyCadreRatio: string;
  storedRootHash: string;
  merkleNodes: MerkleNode[];
  boundingBoxes: BoundingBoxOverlay[];
  graphFindings: GraphRAGGapFinding[];
  actionsHistory: ScrutinyAction[];
}

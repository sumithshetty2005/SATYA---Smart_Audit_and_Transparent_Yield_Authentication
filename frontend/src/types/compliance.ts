export type LayerId = 'overview' | 'layer1' | 'layer2' | 'layer3' | 'layer4' | 'layer5' | 'layer6' | 'anomalies';

export type ComplianceVerdict = 'PASSED' | 'DEFICIENT' | 'TAMPERED_FRAUD' | 'CONDITIONAL_APPROVAL' | 'PENDING_SCRUTINY';

export type OfficerRole = 'SENIOR_SCRUTINY_OFFICER' | 'REGIONAL_OFFICER' | 'CHAIRMAN_AICTE';

export interface TokenItem {
  id: string;
  text: string;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 normalized
  label: 'HEADER' | 'KEY' | 'VALUE' | 'TABLE_CELL' | 'SEAL' | 'SIGNATURE';
  confidence: number;
  highlight?: boolean;
}

export interface ExtractedCadre {
  professors: number;
  associateProfessors: number;
  assistantProfessors: number;
  ratio: string;
  cadreCompliant: boolean;
}

export interface ExtractedPayload {
  institutionName: string;
  institutionCode: string;
  programme: string;
  locationType: 'Mega City' | 'Urban' | 'Rural' | 'Hilly Area';
  sanctionedIntake: number;
  landAreaAcres: number;
  landContiguity: boolean;
  surveyNumber: string;
  builtUpAreaSqm: number;
  instructionalAreaSqm: number;
  administrativeAreaSqm: number;
  circulationAreaRatio: number;
  facultyCount: number;
  studentFacultyRatio: string;
  cadre: ExtractedCadre;
  computerTerminals: number;
  bandwidthMbps: number;
  fireNocNumber: string;
  architectCouncilReg: string;
}

export interface ELAPatch {
  id: string;
  name: string;
  region: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
  anomalyScore: number;
  verdict: 'TAMPERED' | 'SUSPICIOUS' | 'ORIGINAL';
  description: string;
}

export interface PDFMetadata {
  fileName: string;
  fileSizeBytes: number;
  pdfVersion: string;
  creationDate: string;
  modificationDate: string;
  producer: string;
  creatorTool: string;
  pageCount: number;
  isLinearized: boolean;
  incrementalRevisions: number;
  fontIntegrity: 'CLEAN' | 'EMBEDDED_SUBSET_MISMATCH' | 'SYNTHETIC_OVERLAY';
  suspiciousRevisionTrace: string;
}

export interface ForensicsData {
  elaAnomalyScore: number;
  tamperingVerdict: 'FLAGGED_FORGERY' | 'CLEAN' | 'MINOR_RECOMPRESSION';
  laplacianBlurScore: number;
  artificialFlatteningDetected: boolean;
  localizedBlurRegion: string;
  pHashSignature: string;
  pHashTemplateMatchPercent: number;
  metadata: PDFMetadata;
  elaPatches: ELAPatch[];
}

export interface PKICertificate {
  subjectName: string;
  issuerCN: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  keyAlgorithm: string;
  signatureAlgorithm: string;
  digestMatch: boolean;
  ocspStatus: 'GOOD' | 'REVOKED' | 'UNKNOWN';
  postSigningAlterationDetected: boolean;
  bytesAlteredTrace?: string;
}

export interface DigiLockerRecord {
  serviceId: string;
  serviceName: string;
  documentType: string;
  authoritativeDeedNo: string;
  authoritativeAcreage: number;
  registeredOwner: string;
  registrationDate: string;
  oauthStatus: 'AUTHENTICATED' | 'TOKEN_EXPIRED' | 'UNLINKED';
  mismatchFound: boolean;
  mismatchDetails?: string;
  apiHandshakeLatencyMs: number;
}

export interface QRCodeData {
  foundOnPage: number;
  qrPayloadUrl: string;
  hmacSignatureValid: boolean;
  issuerDomain: string;
  trustedDomain: boolean;
  embeddedMetadata: {
    approvalRef: string;
    sanctionedYear: string;
    intakeApproved: number;
    authorizedSignatory: string;
  };
}

export interface SourceVerificationData {
  digiLocker: DigiLockerRecord;
  pkiCertificate: PKICertificate;
  qrCode: QRCodeData;
  overallSourceTrust: number; // 0 - 100
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'INSTITUTION' | 'PROGRAMME' | 'LOCATION' | 'RULE' | 'THRESHOLD' | 'DEFICIENCY';
  val?: number;
  clause?: string;
  status?: 'COMPLIANT' | 'VIOLATION' | 'NEUTRAL';
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
  status?: 'PASSED' | 'VIOLATED';
}

export interface MultiAgentStep {
  agentName: 'Orchestrator Agent' | 'Rule Extraction Agent' | 'Discrepancy Agent' | 'XAI Citation Agent';
  agentIcon: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'ALERT';
  latencyMs: number;
  summary: string;
  findings: string[];
}

export interface APHCitation {
  id: string;
  aphChapter: string;
  aphSection: string;
  aphClause: string;
  tableReference: string;
  ruleTitle: string;
  statutoryThreshold: string;
  institutionalValue: string;
  delta: string;
  severity: 'CRITICAL_DEFICIENCY' | 'MAJOR_DEFICIENCY' | 'COMPLIANT';
  legalEnforcementStatement: string;
}

export interface GraphRAGData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  agentSteps: MultiAgentStep[];
  citations: APHCitation[];
  compliancePercentage: number;
}

export interface CADPolygon {
  id: string;
  roomName: string;
  category: 'INSTRUCTIONAL' | 'ADMIN' | 'AMENITY' | 'CIRCULATION' | 'FIRE_EGRESS';
  areaSqm: number;
  calculatedBy: string;
  points: string; // SVG polygon string
  status: 'COMPLIANT' | 'DEFICIENT' | 'PASS';
}

export interface EXIFGeoData {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  captureDevice: string;
  timestamp: string;
  distanceFromPlotCentroidMeters: number;
  surveyToleranceMeters: number;
  geofenceValid: boolean;
  streetAddress: string;
}

export interface YOLOAsset {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in %
  requiredQty: number;
  detectedQty: number;
  compliant: boolean;
}

export interface VisionCVData {
  cadFloorPlan: {
    totalAreaSqm: number;
    carpetAreaSqm: number;
    circulationRatio: number;
    requiredCirculationRatio: number;
    nearestFireExitDistanceM: number;
    maxAllowedEgressDistanceM: number;
    polygons: CADPolygon[];
  };
  geotagPhoto: EXIFGeoData;
  yoloDetections: YOLOAsset[];
}

export interface MerkleBlock {
  blockHeight: number;
  timestamp: string;
  layerSource: string;
  transactionType: string;
  previousHash: string;
  currentHash: string;
  merklePath: string[];
  signature: string;
  status: 'VERIFIED' | 'TAMPERED';
}

export interface CrossInstitutionalAnomaly {
  anomalyId: string;
  anomalyType: 'DUPLICATE_LAND_PARCEL' | 'GHOST_FACULTY_OVERLAP';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entityIdentifier: string;
  conflictingInstitutions: {
    institutionId: string;
    institutionName: string;
    submissionId: string;
    detail: string;
  }[];
  description: string;
  recommendedAction: string;
}

export interface InstitutionalHealthIndex {
  healthIndex: number; // 0-100
  grade: 'A (Exemplary)' | 'B (Conditional)' | 'C (Critical Risk)';
  regulatoryComplianceScore: number;
  forensicAuthenticityScore: number;
  cryptographicProvenanceScore: number;
  cadreInfrastructureStabilityScore: number;
  riskAssessment: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK';
  recommendations: string[];
}

export interface InstitutionProfile {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  region: 'WRO' | 'NRO' | 'SRO' | 'ERO' | 'NWRO' | 'CRO' | 'SCRO' | 'SWRO';
  category: string;
  establishedYear: number;
  sanctionedIntake: number;
  verdict: ComplianceVerdict;
  overallScore: number;
  deficiencyCount: number;
  lastScrutinyTimestamp: string;
  scrutinyOfficer: string;
  
  // Health Index & Cross-Anomaly Intelligence
  healthIndex: InstitutionalHealthIndex;
  crossAnomalies: CrossInstitutionalAnomaly[];

  // Layer data
  layer1: {
    tokens: TokenItem[];
    payload: ExtractedPayload;
    rawJsonSchema: Record<string, unknown>;
  };
  layer2: ForensicsData;
  layer3: SourceVerificationData;
  layer4: GraphRAGData;
  layer5: VisionCVData;
  layer6: {
    merkleRoot: string;
    blocks: MerkleBlock[];
    officerDecisionHistory: {
      officer: string;
      role: OfficerRole;
      action: string;
      timestamp: string;
      remarks: string;
    }[];
  };
}

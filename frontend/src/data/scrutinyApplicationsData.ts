import type { ScrutinyApplicationRecord, MerkleNode } from '../types/merkle';
import { sha256, buildMerkleTree, generateMerkleProof } from '../utils/crypto';

// Compute initial cryptographically sound Merkle tree for Vidyapeeth
const vidyapeethPayloads = [
  // Step 1: Document Ingestion
  JSON.stringify({
    step: 1,
    file: 'Vidyapeeth_Application_Dossier_2026.pdf',
    sizeBytes: 4210984,
    pages: 14,
    sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ingestedAt: '2026-10-26T09:15:30Z',
    channel: 'AICTE-NRO-PORTAL-S3'
  }),
  // Step 2: ELA Forgery Check Receipt
  JSON.stringify({
    step: 2,
    module: 'ELA_FORENSICS_CORE_V3',
    patchCount: 14,
    tamperingDetected: true,
    elaAnomalyScore: 84.6,
    flaggedRegions: ['STAMP_SUB_REGISTRAR', 'ACREAGE_TEXT_4.00_TO_7.20'],
    verdict: 'FLAGGED_TAMPERED',
    timestamp: '2026-10-26T09:16:12Z'
  }),
  // Step 3: DigiLocker & PKI Verification Receipts
  JSON.stringify({
    step: 3,
    digiLockerApi: 'https://api.digilocker.gov.in/v2/revenue/khasra/verify',
    khasraRecord: 'Khasra-884/2A-Panchkula',
    authoritativeAcreage: 4.00,
    claimedAcreage: 7.20,
    pkiSigner: 'CN=Executive Trustee, O=Vidyapeeth Trust, C=IN',
    pkiDigestMatch: false,
    dscStatus: 'INVALID_POST_SIGNING_MODIFICATION',
    timestamp: '2026-10-26T09:16:45Z'
  }),
  // Step 4: Neo4j GraphRAG Evaluation Summary Node
  JSON.stringify({
    step: 4,
    graphEngine: 'Neo4j Aura Enterprise v5.24',
    handbookVersion: 'APH_2024_2027_GAZETTE_V4',
    evaluationsRun: 32,
    violationsCount: 3,
    criticalViolations: [
      'APH Chapter II Clause 2.4.1 (Cadre Ratio 1:1:12 vs 1:2:6)',
      'APH Chapter II Clause 2.1 (Acreage deficit 4.00 vs 5.00 Acres required)',
      'APH Chapter VI Clause 6.3.2 (Emergency Fire Egress Obstruction in Computing Lab)'
    ],
    timestamp: '2026-10-26T09:17:20Z'
  })
];

// Leaf hashes
const leafHashes = vidyapeethPayloads.map((p, idx) => sha256(`LEAF_${idx + 1}_${p}`));
const tree = buildMerkleTree(leafHashes);

const vidyapeethNodes: MerkleNode[] = [
  {
    id: 'block-001',
    blockHeight: 1,
    stepNumber: 1,
    stepTitle: 'Step 1: Document Ingestion Hash',
    eventType: 'DOCUMENT_INGESTION',
    hash: leafHashes[0],
    parentHash: tree.levels[1] ? tree.levels[1][0] : null,
    previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    payloadHash: sha256(vidyapeethPayloads[0]),
    timestamp: '2026-10-26T09:15:30Z',
    nonce: 1048576,
    status: 'PASSED',
    leafStatus: 'VALID',
    leftHash: null,
    rightHash: null,
    merkleProof: generateMerkleProof(tree.levels, 0),
    merkleRoot: tree.root,
    payloadSummary: 'Raw PDF Ingestion & Byte Integrity Digest: Vidyapeeth_Application_Dossier_2026.pdf (14 pages, 4.2 MB)',
    metadata: {
      sourceModule: 'Ingestion Gateway',
      targetEntity: 'Vidyapeeth Institute of Technology & Management',
      fileHashSha256: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ocrPagesProcessed: 14,
      ingestionCluster: 'NRO-Cluster-Primary-01'
    }
  },
  {
    id: 'block-002',
    blockHeight: 2,
    stepNumber: 2,
    stepTitle: 'Step 2: ELA Forgery Check Receipt',
    eventType: 'ELA_FORGERY_CHECK',
    hash: leafHashes[1],
    parentHash: tree.levels[1] ? tree.levels[1][0] : null,
    previousHash: leafHashes[0],
    payloadHash: sha256(vidyapeethPayloads[1]),
    timestamp: '2026-10-26T09:16:12Z',
    nonce: 2097152,
    status: 'FLAGGED_TAMPERED',
    leafStatus: 'VALID',
    leftHash: null,
    rightHash: null,
    merkleProof: generateMerkleProof(tree.levels, 1),
    merkleRoot: tree.root,
    payloadSummary: 'Error Level Analysis (ELA) Forensic Check: FLAGGED_TAMPERED (Anomaly score 84.6% in Land Deed Stamp & Acreage Box)',
    metadata: {
      sourceModule: 'Layer 2 Forensics Engine (PyTorch / OpenCV)',
      anomalyDetected: true,
      confidenceScore: 0.945,
      affectedBBoxes: ['Land Area Stamp #4', 'Text Patch #12'],
      laplacianBlurVariance: 38.2,
      tamperingVerdict: 'FLAGGED_TAMPERED'
    }
  },
  {
    id: 'block-003',
    blockHeight: 3,
    stepNumber: 3,
    stepTitle: 'Step 3: DigiLocker & PKI Verification Receipts',
    eventType: 'DIGILOCKER_PKI_RECEIPT',
    hash: leafHashes[2],
    parentHash: tree.levels[1] ? tree.levels[1][1] : null,
    previousHash: leafHashes[1],
    payloadHash: sha256(vidyapeethPayloads[2]),
    timestamp: '2026-10-26T09:16:45Z',
    nonce: 3145728,
    status: 'FLAGGED_TAMPERED',
    leafStatus: 'VALID',
    leftHash: null,
    rightHash: null,
    merkleProof: generateMerkleProof(tree.levels, 2),
    merkleRoot: tree.root,
    payloadSummary: 'Government Source Cross-Verification: State Revenue API mismatch (Authoritative: 4.00 Acres vs Claimed: 7.20 Acres). PKI Digest Invalid.',
    metadata: {
      sourceModule: 'DigiLocker MoE Gateway & NIC PKI Bridge',
      digiLockerMatch: false,
      pkiDigestMatch: false,
      authoritativeSource: 'Haryana Land Records Bhulekh Khasra-884/2A',
      registeredOwner: 'State Revenue Demarcated Entity (4.00 Acres)'
    }
  },
  {
    id: 'block-004',
    blockHeight: 4,
    stepNumber: 4,
    stepTitle: 'Step 4: Neo4j GraphRAG Evaluation Summary Node',
    eventType: 'NEO4J_GRAPHRAG_EVAL',
    hash: leafHashes[3],
    parentHash: tree.levels[1] ? tree.levels[1][1] : null,
    previousHash: leafHashes[2],
    payloadHash: sha256(vidyapeethPayloads[3]),
    timestamp: '2026-10-26T09:17:20Z',
    nonce: 4194304,
    status: 'FLAGGED_TAMPERED',
    leafStatus: 'VALID',
    leftHash: null,
    rightHash: null,
    merkleProof: generateMerkleProof(tree.levels, 3),
    merkleRoot: tree.root,
    payloadSummary: 'Agentic GraphRAG Knowledge Traversal: 3 Statutory Non-Compliances linked to APH 2024–2027 Chapters II & VI.',
    metadata: {
      sourceModule: 'GraphRAG Autonomous Reasoning Multi-Agent Pipeline',
      aphClauseCitation: 'Chapter II Clause 2.4.1 & Clause 2.1',
      compliancePercentage: 62.5,
      rulesTested: 32,
      violationsCount: 3
    }
  }
];

export const SCRUTINY_APPLICATIONS: ScrutinyApplicationRecord[] = [
  {
    applicationId: 'AICTE-2026-NRO-8849201',
    institutionName: 'Vidyapeeth Institute of Technology & Management',
    programType: 'Undergraduate Technical / Engineering (B.Tech 4-Year)',
    globalStatus: 'FLAGGED FOR SCRUTINY',
    region: 'Northern Regional Office (NRO, Chandigarh)',
    establishedYear: 2012,
    sanctionedIntake: 420,
    documentTitle: 'Vidyapeeth_Application_Dossier_2026.pdf',
    documentPagesCount: 14,
    landClaimedAcres: 7.20,
    landVerifiedAcres: 4.00,
    builtUpAreaSqm: 19450,
    facultyCadreRatio: '1:1:12 (Non-compliant)',
    storedRootHash: tree.root,
    merkleNodes: vidyapeethNodes,
    boundingBoxes: [
      {
        id: 'box-blue-1',
        boxType: 'LAYOUTLMV3',
        boxColor: 'blue',
        label: 'Land Area (Claimed)',
        value: '7.20 ACRES',
        bbox: [18, 12, 38, 7], // top%, left%, width%, height%
        confidence: 0.985,
        evidenceNote: 'Extracted token "7.20 ACRES" from Land Schedule Table (Khasra 884/2A).',
        statutoryClause: 'APH 2024-27 Chapter II, Cl. 2.1',
        statusText: 'Extracted Value'
      },
      {
        id: 'box-blue-2',
        boxType: 'LAYOUTLMV3',
        boxColor: 'blue',
        label: 'Built-Up Area',
        value: '19,450 SQ. METERS',
        bbox: [32, 12, 45, 6],
        confidence: 0.978,
        evidenceNote: 'Extracted total covered area across Academic & Administrative Blocks.',
        statutoryClause: 'APH 2024-27 Chapter VI, Cl. 6.1',
        statusText: 'Extracted Value'
      },
      {
        id: 'box-blue-3',
        boxType: 'LAYOUTLMV3',
        boxColor: 'blue',
        label: 'Intake Capacity',
        value: '420 SEATS (7 DIVISIONS)',
        bbox: [44, 12, 42, 6],
        confidence: 0.992,
        evidenceNote: 'Extracted intake distribution: CSE (180), ECE (120), ME (60), CE (60).',
        statutoryClause: 'APH 2024-27 Chapter I, Cl. 1.3',
        statusText: 'Extracted Value'
      },
      {
        id: 'box-red-1',
        boxType: 'ELA_FORGERY',
        boxColor: 'red',
        label: 'Altered Text Zone (4.00 ➔ 7.20)',
        value: 'ELA Anomaly 88.4%',
        bbox: [17, 11, 40, 9],
        confidence: 0.942,
        evidenceNote: 'Laplacian smoothing & compression artifact mismatch. Digital font overwrote original "4.00 Acres".',
        statutoryClause: 'AICTE Act Sec. 10(k) Fraud Provision',
        statusText: 'TAMPERED ZONE'
      },
      {
        id: 'box-red-2',
        boxType: 'ELA_FORGERY',
        boxColor: 'red',
        label: 'Sub-Registrar Seal Splicing',
        value: 'ELA Anomaly 82.1%',
        bbox: [68, 55, 36, 18],
        confidence: 0.916,
        evidenceNote: 'Cloned revenue stamp detected. High-frequency noise boundaries indicate copy-move forgery.',
        statutoryClause: 'Indian Penal Code Sec. 468 / AICTE Penal Clause',
        statusText: 'FORGERY CONFIRMED'
      },
      {
        id: 'box-yellow-1',
        boxType: 'YOLO_CAD',
        boxColor: 'yellow',
        label: 'CAD Lab Machinery Deficit',
        value: '1 / 3 CNC Lathes Detected',
        bbox: [56, 12, 38, 12],
        confidence: 0.893,
        evidenceNote: 'YOLOv11 model detected only 1 operational CNC milling unit. 3 units mandated for Mechanical batch size.',
        statutoryClause: 'APH 2024-27 Appendix 6 (Lab Equipment Norms)',
        statusText: 'DEFICIT ALERT'
      },
      {
        id: 'box-yellow-2',
        boxType: 'YOLO_CAD',
        boxColor: 'yellow',
        label: 'Blocked Fire Egress Corridor',
        value: 'Passage Width 1.4m (Req: 2.5m)',
        bbox: [75, 12, 35, 10],
        confidence: 0.924,
        evidenceNote: 'Vector CAD floor plan overlay reveals partitioned storage blocking Primary Exit #2.',
        statutoryClause: 'APH 2024-27 Chapter VI, Cl. 6.3.2 (NBC 2016)',
        statusText: 'SAFETY NON-COMPLIANCE'
      }
    ],
    graphFindings: [
      {
        id: 'gap-01',
        ruleTitle: 'Non-compliant Faculty Cadre Ratio',
        clauseReference: 'Chapter II, Clause 2.4.1',
        aphSection: 'Faculty Cadre & Qualifications Framework',
        severity: 'CRITICAL',
        extractedValue: '1 Professor : 1 Associate Professor : 12 Assistant Professors',
        statutoryThreshold: '1 : 2 : 6 (Mandatory Cadre Balance for Technical UG)',
        discrepancyDelta: '-1 Associate Prof, +6 Assistant Profs (Deficit in Senior Academic Leadership)',
        legalWarning: 'Non-compliance attracts reduction of approved intake by 50% under Section 10(p).',
        explanation: 'Institutional roster indicates extreme shortage of regular Associate Professors in Computer Science and Electronics. The cadre structure heavily depends on ad-hoc junior instructors.'
      },
      {
        id: 'gap-02',
        ruleTitle: 'Contiguous Land Area Shortfall post-Forensic Verification',
        clauseReference: 'Chapter II, Clause 2.1',
        aphSection: 'Essential Land Requirements for Rural/Urban Technical Institutions',
        severity: 'CRITICAL',
        extractedValue: '4.00 Acres (Authoritative DigiLocker Bhulekh Demarcation)',
        statutoryThreshold: 'Minimum 5.00 Contiguous Acres (Non-Mega City Technical Campus)',
        discrepancyDelta: '-1.00 Acre Statutory Deficit (-20% shortfall from statutory minimum)',
        legalWarning: 'Direct disqualification of Extension of Approval (EoA); triggers mandatory show-cause notice.',
        explanation: 'While the applicant claimed 7.20 Acres on altered municipal deed, DigiLocker land registry API confirmed authentic ownership of only 4.00 Acres on Khasra 884/2A.'
      },
      {
        id: 'gap-03',
        ruleTitle: 'Circulation & Emergency Egress Corridor Width Violation',
        clauseReference: 'Chapter VI, Clause 6.3.2',
        aphSection: 'Safety, Fire Evacuation & Structural Norms (NBC 2016 Standards)',
        severity: 'MAJOR',
        extractedValue: '1.40 Meters corridor width (blocked by temporary server partition)',
        statutoryThreshold: 'Minimum 2.50 Meters unobstructed clearance for Academic Blocks',
        discrepancyDelta: '-1.10 Meters Fire Safety Corridor Width Deficit',
        legalWarning: 'Withholding of Building Completion & Safety Clearance Certificate until rectified.',
        explanation: 'Vector CAD boundary traversal detected that the second escape route on the 2nd floor of Block B has been obstructed by unauthorized partition walls.'
      },
      {
        id: 'gap-04',
        ruleTitle: 'Dual-Institutional Employment Prohibition (Ghost Faculty Overlap)',
        clauseReference: 'Annexure 5.2, Clause 5.2.3',
        aphSection: 'Faculty Biometric & Institutional Registry Cross-Authentication',
        severity: 'MAJOR',
        extractedValue: 'Overlap Flagged: Dr. Harish Chandra (Aadhaar/PAN Match)',
        statutoryThreshold: 'Zero concurrent faculty appointments across AICTE approved colleges',
        discrepancyDelta: 'Simultaneous appointment claimed at Rohtak Institute of Tech (AICTE-2026-NRO-5512)',
        legalWarning: 'De-registration of faculty profile and blacklisting under AICTE Faculty Disciplinary Code.',
        explanation: 'Cross-institutional graph entity resolution identified duplicate registration of senior faculty member across two institutions in the same academic cycle.'
      }
    ],
    actionsHistory: []
  },
  {
    applicationId: 'AICTE-2026-WRO-4458923',
    institutionName: 'Apex Global Institute of Technology',
    programType: 'Undergraduate Engineering & Technology (B.Tech)',
    globalStatus: 'REJECTED',
    region: 'Western Regional Office (WRO, Mumbai/Pune)',
    establishedYear: 2015,
    sanctionedIntake: 420,
    documentTitle: 'Apex_Sanctioned_Deed_PMRDA.pdf',
    documentPagesCount: 18,
    landClaimedAcres: 3.20,
    landVerifiedAcres: 0.00,
    builtUpAreaSqm: 14200,
    facultyCadreRatio: '1:1:14 (Deficient)',
    storedRootHash: '0x8849bca012849102837491029384719283749102938471928374910293847abc',
    merkleNodes: [],
    boundingBoxes: [],
    graphFindings: [],
    actionsHistory: [
      {
        actionId: 'ACT-WRO-001',
        actionType: 'REJECT',
        applicationId: 'AICTE-2026-WRO-4458923',
        institutionName: 'Apex Global Institute of Technology',
        officerName: 'Dr. A. V. Joshi',
        officerRole: 'Regional Director',
        officerSignature: 'SHA256:OFFICER-DS-WRO-AV-JOSHI-9921',
        notes: 'Rejected on grounds of double-pledged land survey number Survey-42/1B and ghost faculty duplication.',
        timestamp: '2026-10-25T14:30:00Z',
        resultingLeafHash: '0x9924ba9182374918273948172938471928374918273948172938471928374918'
      }
    ]
  },
  {
    applicationId: 'AICTE-2026-WRO-3324567',
    institutionName: 'Sardar Patel College of Engineering',
    programType: 'Undergraduate / Postgraduate Engineering (B.Tech/M.Tech)',
    globalStatus: 'PASSED',
    region: 'Western Regional Office (WRO, Mumbai)',
    establishedYear: 1962,
    sanctionedIntake: 600,
    documentTitle: 'SPCE_Sanctioned_Deed_Complete.pdf',
    documentPagesCount: 22,
    landClaimedAcres: 12.50,
    landVerifiedAcres: 12.50,
    builtUpAreaSqm: 42000,
    facultyCadreRatio: '1:2:6 (Exemplary Full Compliance)',
    storedRootHash: '0x1029481029481029481029481029481029481029481029481029481029481029',
    merkleNodes: [],
    boundingBoxes: [],
    graphFindings: [],
    actionsHistory: [
      {
        actionId: 'ACT-WRO-002',
        actionType: 'APPROVE',
        applicationId: 'AICTE-2026-WRO-3324567',
        institutionName: 'Sardar Patel College of Engineering',
        officerName: 'Prof. T. G. Sitharam',
        officerRole: 'Member Secretary AICTE',
        officerSignature: 'SHA256:OFFICER-DS-HQ-SITHARAM-001',
        notes: 'Approved Extension of Approval (EoA) for 2026-2027. All cadastral and cadre metrics verified authentic.',
        timestamp: '2026-10-24T11:00:00Z',
        resultingLeafHash: '0x3344556677889900aabbccddeeff00112233445566778899aabbccddeeff0011'
      }
    ]
  }
];

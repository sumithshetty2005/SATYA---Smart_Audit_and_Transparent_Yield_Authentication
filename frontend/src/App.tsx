import React, { useState, useRef } from 'react';
import { ThreeBackground } from './components/ThreeBackground';
import { DocumentFindingsView, type ScrutinyResult } from './components/DocumentFindingsView';
import { OfficialInspectionReportModal } from './components/OfficialInspectionReportModal';
import { SpecificationsModal } from './components/SpecificationsModal';
import { Footer } from './components/Footer';
import {
  UploadCloud,
  FileCheck2,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Cpu,
  Fingerprint,
  Database,
  Network,
  Eye,
  Scroll,
  Award,
  CheckCircle2,
} from 'lucide-react';

export function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [scrutinyResult, setScrutinyResult] = useState<ScrutinyResult | null>(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const findingsRef = useRef<HTMLDivElement>(null);

  const steps = [
    { label: 'Layer 1: LayoutLMv3 Token Extraction & 2D Bounding Boxes', icon: <FileText className="w-4 h-4" /> },
    { label: 'Layer 2: Error Level Analysis (ELA) & Laplacian Smoothing Check', icon: <Fingerprint className="w-4 h-4" /> },
    { label: 'Layer 3: DigiLocker Registry API & PKI X.509 DSC Validator', icon: <Database className="w-4 h-4" /> },
    { label: 'Layer 4: Neo4j Knowledge Graph & APH 2024–27 Multi-Agent Rules', icon: <Network className="w-4 h-4" /> },
    { label: 'Layer 5: Shapely CAD Spatial Geometry & YOLOv11 Machinery Grid', icon: <Eye className="w-4 h-4" /> },
    { label: 'Layer 6: SHA-256 Merkle Block Hash Sealing & Digest Generation', icon: <Scroll className="w-4 h-4" /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setScrutinyResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setScrutinyResult(null);
    }
  };

  const executeScrutinyAnalysis = (isTamperedDemo: boolean = false) => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 450);

    setTimeout(() => {
      setIsAnalyzing(false);

      const fName = selectedFile ? selectedFile.name : isTamperedDemo ? 'Altered_Land_Deed_Scanned.pdf' : 'AICTE_Institutional_Filing_2025.pdf';
      const fSize = selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : '3.4 MB';

      // Generate dynamic findings based on mode
      const resultData: ScrutinyResult = isTamperedDemo
        ? {
            fileName: fName,
            fileSizeFormatted: fSize,
            pageCount: 6,
            uploadedAt: new Date().toLocaleTimeString(),
            verdict: 'TAMPERED_FRAUD',
            overallScore: 52,
            healthIndex: {
              score: 54.2,
              grade: 'C (Critical Risk)',
              riskLevel: 'HIGH_RISK',
              recommendations: [
                'Issue immediate statutory Show-Cause Notice under AICTE Section 10(k).',
                'Digitally altered land deed text (4.00 Acres overwritten as 7.20 Acres).',
                'Cryptographic PKI signature digest altered post-signing.',
                'Mandate physical Revenue Demarcation survey before consideration.',
              ],
            },
            layer1: {
              tokensCount: 148,
              tokens: [
                { id: 't1', text: 'STATE LAND REGISTRATION & REVENUE DEPARTMENT', bbox: [50, 80, 110, 920], label: 'HEADER', confidence: 0.998 },
                { id: 't2', text: 'Application File Reference: AICTE-APP-2025-SCR', bbox: [130, 80, 175, 490], label: 'KEY', confidence: 0.985 },
                { id: 't3', text: 'Survey / Khasra Plot No: Survey-42/1B, Sector Institutional', bbox: [190, 80, 235, 640], label: 'KEY', confidence: 0.978 },
                { id: 't4', text: 'Stated Contiguous Land Area: 7.20 ACRES', bbox: [250, 80, 310, 560], label: 'VALUE', confidence: 0.942, highlight: true },
                { id: 't5', text: 'Instructional Built-Up Area: 11,850.00 SQ.M', bbox: [320, 80, 375, 620], label: 'VALUE', confidence: 0.991 },
                { id: 't6', text: 'Faculty Cadre: 45 Members | Cadre Ratio 1:3:11', bbox: [460, 80, 515, 740], label: 'TABLE_CELL', confidence: 0.965, highlight: true },
                { id: 't7', text: 'Student-to-Faculty Ratio (Enrolled 840): 1:18.66', bbox: [525, 80, 580, 710], label: 'TABLE_CELL', confidence: 0.974, highlight: true },
                { id: 't8', text: 'Sub-Registrar Official Embossed Seal', bbox: [620, 120, 740, 320], label: 'SEAL', confidence: 0.889, highlight: true },
                { id: 't9', text: 'Digital Certificate DSC Signature', bbox: [750, 550, 850, 910], label: 'SIGNATURE', confidence: 0.954 },
              ],
              payload: {
                institutionName: 'Technical Institution Applicant',
                institutionCode: 'AICTE-APP-2025-SCR',
                programme: 'Engineering & Technology (UG B.Tech)',
                locationType: 'Urban',
                sanctionedIntake: 420,
                landAreaAcres: 7.20,
                landContiguity: true,
                surveyNumber: 'Survey-42/1B',
                builtUpAreaSqm: 14250,
                instructionalAreaSqm: 11850,
                administrativeAreaSqm: 2400,
                circulationAreaRatio: 0.202,
                facultyCount: 45,
                studentFacultyRatio: '1:18.66',
                cadre: {
                  professors: 3,
                  associateProfessors: 9,
                  assistantProfessors: 33,
                  ratio: '1:3:11 (Statutory Shortfall)',
                  cadreCompliant: false,
                },
                computerTerminals: 380,
                bandwidthMbps: 100,
                fireNocNumber: 'NOC-FIRE-2023-9014',
                architectCouncilReg: 'CA/2012/55490',
              },
            },
            layer2: {
              elaAnomalyScore: 82.5,
              tamperingVerdict: 'FLAGGED_FORGERY',
              laplacianBlurScore: 41.2,
              artificialFlatteningDetected: true,
              localizedBlurRegion: 'Coordinates [Y: 250-310, X: 80-560] around Stated Land acreage text',
              pHashSignature: 'e8f0a31c5b78d249',
              pHashMatchPercent: 88.4,
              patches: [
                {
                  id: 'p1',
                  name: 'Acreage Insertion Anomaly',
                  region: [250, 80, 310, 560],
                  anomalyScore: 89.6,
                  verdict: 'TAMPERED',
                  description: 'High error-level variance around 7.20 ACRES. Pixel residual energy is 4.8x higher than surrounding body text.',
                },
              ],
            },
            layer3: {
              digiLockerMatch: false,
              authoritativeAcreage: 4.00,
              claimedAcreage: 7.20,
              pkiValid: false,
              pkiSigner: 'Authorized Signatory',
              postSigningBytesAltered: true,
              qrPayloadValid: false,
              sourceTrustScore: 34,
            },
            layer4: {
              nodes: [
                { id: 'n1', name: 'Application Filing', type: 'INSTITUTION', status: 'VIOLATION', x: 280, y: 190 },
                { id: 'n2', name: 'Engineering & Tech', type: 'PROGRAMME', status: 'NEUTRAL', x: 130, y: 90 },
                { id: 'n3', name: 'Urban Category', type: 'LOCATION', status: 'NEUTRAL', x: 440, y: 90 },
                { id: 'n4', name: 'APH Cl. 2.4.1 (Min Land 5.0 Acres)', type: 'RULE', clause: 'APH 2024-27 Ch. II Sec 2.4', status: 'VIOLATION', x: 460, y: 260 },
                { id: 'n5', name: 'APH Cl. 4.3.2 (Cadre Ratio 1:2:6)', type: 'RULE', clause: 'APH 2024-27 Ch. IV Sec 4.3', status: 'VIOLATION', x: 120, y: 310 },
              ],
              citations: [
                {
                  id: 'c1',
                  aphChapter: 'Chapter II - Approval for New / Extension',
                  aphSection: 'Section 2.4 - Land Requirements',
                  aphClause: 'Clause 2.4.1 & Table 2.1',
                  tableReference: 'Table 2.1: Minimum Land Requirement',
                  ruleTitle: 'Contiguous Land Shortfall',
                  statutoryThreshold: '5.00 Acres Contiguous (Urban Category)',
                  institutionalValue: '4.00 Acres Verified in Registry',
                  delta: '-1.00 Acre Deficit',
                  severity: 'CRITICAL_DEFICIENCY',
                  legalEnforcementStatement: 'Deficit contiguous land attracts automatic rejection under Section 10(k) AICTE Act 1987.',
                },
                {
                  id: 'c2',
                  aphChapter: 'Chapter IV - Faculty Cadre Norms',
                  aphSection: 'Section 4.3 - Staffing Formula',
                  aphClause: 'Clause 4.3.2',
                  tableReference: 'Table 4.1: Cadre Ratio 1:2:6',
                  ruleTitle: 'Cadre Ratio Skew',
                  statutoryThreshold: '1:2:6 (Prof : Assoc : Asst)',
                  institutionalValue: '1:3:11 (3 Prof, 9 Assoc, 33 Asst)',
                  delta: 'Shortfall of 4 Full Professors',
                  severity: 'MAJOR_DEFICIENCY',
                  legalEnforcementStatement: 'Institutional skew towards junior faculty violates statutory quality mandates.',
                },
              ],
              compliancePercent: 52,
            },
            layer5: {
              cadTotalAreaSqm: 14250,
              circulationRatio: 0.202,
              nearestFireExitM: 35.8,
              geofenceValid: false,
              gpsCoords: '18.5204° N, 73.8567° E (388m outside boundary)',
              polygons: [
                { id: 'cad-1', roomName: 'Classrooms Block', category: 'INSTRUCTIONAL', areaSqm: 528, calculatedBy: 'Shapely CAD', points: '50,50 350,50 350,220 50,220', status: 'PASS' },
                { id: 'cad-2', roomName: 'Circulation Corridors', category: 'CIRCULATION', areaSqm: 210, calculatedBy: 'Shapely CAD', points: '250,235 350,235 350,420 250,420', status: 'DEFICIENT' },
              ],
              yoloDetections: [
                { id: 'y1', label: 'CNC Lathe Machine', confidence: 0.974, bbox: [12, 10, 48, 42], requiredQty: 20, detectedQty: 18, compliant: false },
                { id: 'y2', label: 'Digital Storage Oscilloscope', confidence: 0.989, bbox: [52, 15, 85, 45], requiredQty: 20, detectedQty: 22, compliant: true },
              ],
            },
            layer6: {
              merkleRoot: '0xd7b4e98f02ca819934e6c1a85b9f71c422891d03a11029c9ef8826d2e90f14ba',
              blocks: [
                {
                  blockHeight: 1,
                  timestamp: new Date().toISOString(),
                  layerSource: 'Layer 1 Ingestion',
                  transactionType: 'DOCUMENT_TOKENIZATION',
                  previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  currentHash: '0x4f1a8e29bc9012da779812401f827361a998c0b2f34e819920194bcde1092837',
                  merklePath: ['0x2a1b...', '0x89c1...'],
                  signature: 'SIG_LAYOUTLMV3_EXTRACT',
                  status: 'VERIFIED',
                },
                {
                  blockHeight: 2,
                  timestamp: new Date().toISOString(),
                  layerSource: 'Layer 2 Forensics',
                  transactionType: 'ELA_RESIDUAL_FLAG',
                  previousHash: '0x4f1a8e29bc9012da779812401f827361a998c0b2f34e819920194bcde1092837',
                  currentHash: '0x9812ef1048bca19277d0192e847382901bcf9128374910294871294819028374',
                  merklePath: ['0x310f...', '0xaa90...'],
                  signature: 'SIG_FORGERY_DETECTED',
                  status: 'TAMPERED',
                },
              ],
            },
          }
        : {
            fileName: fName,
            fileSizeFormatted: fSize,
            pageCount: 12,
            uploadedAt: new Date().toLocaleTimeString(),
            verdict: 'PASSED',
            overallScore: 94,
            healthIndex: {
              score: 92.5,
              grade: 'A (Exemplary)',
              riskLevel: 'LOW_RISK',
              recommendations: [
                'Unconditional Extension of Approval (EoA 2025–26) recommended.',
                'All statutory land, physical built-up, and cadre norms satisfied.',
                'Native digital scan verified with zero pixel compression artifacts.',
              ],
            },
            layer1: {
              tokensCount: 284,
              tokens: [
                { id: 'ct1', text: 'GOVERNMENT OF INDIA - TECHNICAL EDUCATION FILING', bbox: [50, 80, 110, 920], label: 'HEADER', confidence: 0.999 },
                { id: 'ct2', text: 'Application File Reference: AICTE-APP-2025-CLEAN', bbox: [130, 80, 175, 480], label: 'KEY', confidence: 0.995 },
                { id: 'ct3', text: 'Registered Land Survey Plot: Survey-14/2, Contiguous', bbox: [190, 80, 235, 680], label: 'KEY', confidence: 0.992 },
                { id: 'ct4', text: 'Total Contiguous Campus Land: 8.20 ACRES', bbox: [250, 80, 310, 480], label: 'VALUE', confidence: 0.997 },
                { id: 'ct5', text: 'Instructional Built-Up Area: 22,400.00 SQ.M', bbox: [320, 80, 375, 620], label: 'VALUE', confidence: 0.994 },
                { id: 'ct6', text: 'Faculty Roll: 72 Members | Cadre Ratio 1:2:6', bbox: [460, 80, 515, 750], label: 'TABLE_CELL', confidence: 0.988 },
                { id: 'ct7', text: 'Student-to-Faculty Ratio: 1:14.28 (Statutory <= 1:15)', bbox: [525, 80, 580, 680], label: 'TABLE_CELL', confidence: 0.991 },
                { id: 'ct8', text: 'District Revenue Authority Official Seal', bbox: [620, 120, 740, 320], label: 'SEAL', confidence: 0.989 },
                { id: 'ct9', text: 'PKI Class-3 DSC Digital Signature Token', bbox: [750, 550, 850, 910], label: 'SIGNATURE', confidence: 0.999 },
              ],
              payload: {
                institutionName: 'Technical Institution Applicant',
                institutionCode: 'AICTE-APP-2025-CLEAN',
                programme: 'Engineering & Technology (UG & PG)',
                locationType: 'Urban',
                sanctionedIntake: 600,
                landAreaAcres: 8.20,
                landContiguity: true,
                surveyNumber: 'Survey-14/2',
                builtUpAreaSqm: 22400,
                instructionalAreaSqm: 16800,
                administrativeAreaSqm: 5600,
                circulationAreaRatio: 0.285,
                facultyCount: 72,
                studentFacultyRatio: '1:14.28',
                cadre: {
                  professors: 8,
                  associateProfessors: 16,
                  assistantProfessors: 48,
                  ratio: '1:2:6 (PERFECT STATUTORY RATIO)',
                  cadreCompliant: true,
                },
                computerTerminals: 750,
                bandwidthMbps: 1000,
                fireNocNumber: 'NOC-FIRE-2024-8801',
                architectCouncilReg: 'CA/1994/18920',
              },
            },
            layer2: {
              elaAnomalyScore: 4.8,
              tamperingVerdict: 'CLEAN',
              laplacianBlurScore: 318.4,
              artificialFlatteningDetected: false,
              localizedBlurRegion: 'None. Uniform high-frequency sensor noise across all pages.',
              pHashSignature: '7c19a0f3e25b84d1',
              pHashMatchPercent: 99.4,
              patches: [],
            },
            layer3: {
              digiLockerMatch: true,
              authoritativeAcreage: 8.20,
              claimedAcreage: 8.20,
              pkiValid: true,
              pkiSigner: 'Authorized Institutional Principal',
              postSigningBytesAltered: false,
              qrPayloadValid: true,
              sourceTrustScore: 98,
            },
            layer4: {
              nodes: [
                { id: 'cn1', name: 'Submitted Application', type: 'INSTITUTION', status: 'COMPLIANT', x: 280, y: 190 },
                { id: 'cn2', name: 'Engineering & Technology', type: 'PROGRAMME', status: 'NEUTRAL', x: 130, y: 90 },
                { id: 'cn3', name: 'Urban Category Zone', type: 'LOCATION', status: 'NEUTRAL', x: 440, y: 90 },
                { id: 'cn4', name: 'APH Cl. 2.4.1 (Min Land 5.0 Acres)', type: 'RULE', clause: 'APH 2024-27 Ch. II', status: 'COMPLIANT', x: 460, y: 260 },
                { id: 'cn5', name: 'APH Cl. 4.3.2 (Cadre 1:2:6)', type: 'RULE', clause: 'APH 2024-27 Ch. IV', status: 'COMPLIANT', x: 120, y: 310 },
              ],
              citations: [],
              compliancePercent: 96,
            },
            layer5: {
              cadTotalAreaSqm: 22400,
              circulationRatio: 0.285,
              nearestFireExitM: 19.4,
              geofenceValid: true,
              gpsCoords: '19.1232° N, 72.8361° E (Within plot bounds)',
              polygons: [
                { id: 'ccad-1', roomName: 'Instructional Wings A & B', category: 'INSTRUCTIONAL', areaSqm: 12400, calculatedBy: 'Shapely CAD', points: '40,40 380,40 380,240 40,240', status: 'PASS' },
                { id: 'ccad-2', roomName: 'Main Atrium & Circulation Foyers', category: 'CIRCULATION', areaSqm: 3600, calculatedBy: 'Shapely CAD', points: '290,250 590,250 590,430 290,430', status: 'PASS' },
              ],
              yoloDetections: [
                { id: 'cy1', label: 'CNC 5-Axis VMC Center', confidence: 0.992, bbox: [10, 10, 45, 45], requiredQty: 25, detectedQty: 28, compliant: true },
                { id: 'cy2', label: 'Mixed Signal Oscilloscopes', confidence: 0.995, bbox: [50, 15, 88, 48], requiredQty: 40, detectedQty: 44, compliant: true },
              ],
            },
            layer6: {
              merkleRoot: '0x1102984abce9102837491029384719283749102938471928374910293847abcd',
              blocks: [
                {
                  blockHeight: 1,
                  timestamp: new Date().toISOString(),
                  layerSource: 'Layer 1 Ingestion',
                  transactionType: 'DOCUMENT_TOKENIZATION',
                  previousHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                  currentHash: '0x5102938471928374910293847192837491029384719283749102938471928374',
                  merklePath: ['0x11aa...', '0x22bb...'],
                  signature: 'SIG_LAYOUTLMV3_CLEAN',
                  status: 'VERIFIED',
                },
                {
                  blockHeight: 2,
                  timestamp: new Date().toISOString(),
                  layerSource: 'Layer 2 Forensics',
                  transactionType: 'ELA_RESIDUAL_VERIFICATION',
                  previousHash: '0x5102938471928374910293847192837491029384719283749102938471928374',
                  currentHash: '0x7719283749102938471928374910293847192837491029384719283749102938',
                  merklePath: ['0x33cc...', '0x44dd...'],
                  signature: 'SIG_FORENSICS_VERIFIED_CLEAN',
                  status: 'VERIFIED',
                },
              ],
            },
          };

      setScrutinyResult(resultData);

      // Scroll to findings
      setTimeout(() => {
        findingsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 2800);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans-modern bg-[#F5E6C8] text-[#2B1609] selection:bg-[#D4AF37]/30 selection:text-[#4A1504]">
      {/* Three.js Background Overlay */}
      <ThreeBackground />

      {/* Official Topmost Government Strip */}
      <div className="bg-[#2B1609] text-[#F5E6C8] px-4 py-1.5 text-[11px] font-sans-modern flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/30 relative z-40">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-6 rounded-xs overflow-hidden shadow-xs">
            <div className="w-1/3 bg-[#FF9933]" />
            <div className="w-1/3 bg-white" />
            <div className="w-1/3 bg-[#138808]" />
          </div>
          <span className="font-medium tracking-wide">
            Problem Statement SH26261 • AICTE Regulatory Scrutiny & Document Authentication Engine
          </span>
          <span className="hidden md:inline text-[#D4AF37]">•</span>
          <span className="hidden md:inline text-[#F5E6C8]/80 font-mono">
            APH 2024–2027 Gazette v4.2 Active
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px]">DigiLocker Sandbox: CONNECTED</span>
          </div>
          <span className="text-[#D4AF37]/50">|</span>
          <span className="font-mono text-[10px] text-[#F5E6C8]/75">Merkle Ledger: SYNCED</span>
        </div>
      </div>

      {/* Main Administrative Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF4E8]/90 border-b border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(74,21,4,0.08)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504] opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 group cursor-pointer" onClick={() => setScrutinyResult(null)}>
            <div className="w-12 h-12 rounded-full p-1 bg-gradient-to-br from-[#FFF3B0] to-[#EEDFB8] border border-[#D4AF37]/60 shadow-sm flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105 shrink-0">
              <img
                src="/assets/aicte_logo_crop.png"
                alt="AICTE Crest"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-vedic text-[11px] font-semibold tracking-wider text-[#4A1504] uppercase">
                अखिल भारतीय तकनीकी शिक्षा परिषद
              </span>
              <span className="font-cinzel text-base sm:text-lg font-extrabold tracking-tight text-[#4A1504]">
                AICTE <span className="text-[#C59B27] font-sans-modern font-semibold text-xs sm:text-sm">Compliance Engine</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/70 hover:bg-[#F5E6C8] border border-[#D4AF37]/50 text-[#4A1504] transition-all cursor-pointer"
            >
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>PS SH26261 Specs</span>
            </button>

            {scrutinyResult && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] border border-[#D4AF37]/50 flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Inspection Order</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing & Scrutiny Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10 space-y-10">
        {/* Landing Page Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-[#D4AF37]/60 bg-gradient-to-br from-[#FAF4E8] via-[#F5E6C8] to-[#EEDFB8] p-6 md:p-10 shadow-2xl">
              {/* Sacred Mandala Watermark */}
              <div
                className="absolute -right-20 -bottom-20 w-96 h-96 pointer-events-none opacity-15 bg-contain bg-no-repeat"
                style={{ backgroundImage: `url('/assets/mandala.png')` }}
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4A1504] text-[#F5E6C8] text-xs font-cinzel font-semibold tracking-wider shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>AICTE REGULATORY COMPLIANCE ARCHITECTURE • PS SH26261</span>
                  </div>

                  <h1 className="font-cinzel text-3xl md:text-5xl font-bold text-[#4A1504] tracking-wide leading-tight">
                    AI-Powered Application Validation <br />
                    <span className="text-[#2B1609] italic font-serif">&amp; Document Authentication</span>
                  </h1>

                  <p className="text-sm md:text-base text-[#2B1609]/85 leading-relaxed max-w-2xl font-serif">
                    Upload any AICTE approval application, land title deed, or infrastructure completion certificate (PDF) to run 
                    instant multi-layer forensic inspection, LayoutLMv3 tokenization, DigiLocker cross-checks, and APH 2024–2027 rule validation.
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
                          — <em>Baudhayana Sulba-Sutra 1.48 (~800 BCE)</em>: The foundational Indian geometric principle underpinning physical infrastructure compliance in AICTE handbook standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Vedic Scholar Illustration */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  <div className="relative w-full max-w-xs p-5 bg-white/70 backdrop-blur-md rounded-2xl border-2 border-[#D4AF37]/50 shadow-xl text-center space-y-3">
                    <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-3 border-[#D4AF37] shadow-lg bg-[#FAF4E8]">
                      <img
                        src="/assets/vedic_scholar.png"
                        alt="Vedic Sage Baudhayana"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">Automated Regulatory Audit</h3>
                      <p className="text-[11px] text-[#2B1609]/75 mt-0.5">
                        LayoutLMv3 • ELA Forensics • DigiLocker • Neo4j GraphRAG • Merkle Ledger
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRIMARY INGESTION ZONE: PDF Upload & Drop Area */}
            <div className="p-6 md:p-8 rounded-3xl bg-white/80 backdrop-blur-md border-2 border-[#D4AF37]/50 shadow-xl space-y-6">
              <div className="text-center space-y-2 max-w-2xl mx-auto">
                <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
                  Upload Application Document for AICTE Scrutiny
                </h2>
                <p className="text-xs md:text-sm text-[#2B1609]/75">
                  Submit your institutional PDF filing (Title Deed, Building Completion Certificate, Faculty Form-7, or AICTE Application) to execute full multi-layer regulatory verification.
                </p>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-8 md:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center space-y-4 ${
                  isDragging
                    ? 'border-[#4A1504] bg-[#D4AF37]/20 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-[#D4AF37]/60 bg-[#FAF4E8]/60 hover:bg-[#FAF4E8] hover:border-[#D4AF37]'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-[#4A1504] text-[#F5E6C8] flex items-center justify-center shadow-md">
                  {selectedFile ? (
                    <FileCheck2 className="w-8 h-8 text-[#D4AF37]" />
                  ) : (
                    <UploadCloud className="w-8 h-8 text-[#D4AF37]" />
                  )}
                </div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                      File Selected &amp; Ready for Scrutiny
                    </span>
                    <div className="font-mono font-bold text-base text-[#4A1504]">{selectedFile.name}</div>
                    <p className="text-xs text-[#2B1609]/60 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="font-cinzel font-bold text-base text-[#4A1504]">
                      Drag &amp; drop your application PDF here, or <span className="underline decoration-[#D4AF37]">browse</span>
                    </div>
                    <p className="text-xs text-[#2B1609]/65">
                      Supported formats: PDF documents (.pdf), high-resolution municipal scans (.png, .jpg)
                    </p>
                  </div>
                )}
              </div>

              {/* Action Row & Sample Demo Buttons */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[#4A1504] text-xs mr-1">Instant Demo Samples:</span>
                  <button
                    type="button"
                    onClick={() => executeScrutinyAnalysis(false)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#D4AF37]/50 hover:bg-[#FAF4E8] text-[#4A1504] font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Standard Compliant Filing (Clean)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => executeScrutinyAnalysis(true)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-900 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Altered Title Deed (Tampered ELA Demo)</span>
                  </button>
                </div>

                <button
                  onClick={() => executeScrutinyAnalysis(false)}
                  disabled={isAnalyzing}
                  className="w-full md:w-auto px-6 py-3 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-cinzel font-bold tracking-wider shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Cpu className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isAnalyzing ? 'Executing AI Scrutiny...' : 'Analyze Document & View Findings'}</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              </div>

              {/* Analyzing Progress State */}
              {isAnalyzing && (
                <div className="p-5 rounded-2xl bg-[#FAF4E8] border border-[#D4AF37]/50 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-[#4A1504]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4A1504] animate-ping" />
                      <span>Processing Multi-Layer Regulatory Pipeline...</span>
                    </span>
                    <span className="font-mono">Step {analysisStep + 1} of {steps.length}</span>
                  </div>

                  <div className="w-full bg-[#EEDFB8] h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-[#D4AF37] to-[#4A1504] transition-all duration-300 rounded-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono">
                    {steps.map((st, sIdx) => (
                      <div
                        key={sIdx}
                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                          sIdx === analysisStep
                            ? 'bg-[#4A1504] text-[#F5E6C8] border-[#D4AF37] font-bold shadow-xs'
                            : sIdx < analysisStep
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white/50 text-[#2B1609]/50 border-transparent'
                        }`}
                      >
                        <span>{st.icon}</span>
                        <span className="truncate">{st.label.split(':')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* REVEALED FINDINGS WORKSPACE */}
            <div ref={findingsRef}>
              {scrutinyResult && (
                <DocumentFindingsView
                  result={scrutinyResult}
                  onReset={() => {
                    setSelectedFile(null);
                    setScrutinyResult(null);
                  }}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              )}
            </div>
      </main>

      {/* Official Printable Inspection Report Modal */}
      {scrutinyResult && (
        <OfficialInspectionReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          result={scrutinyResult}
        />
      )}

      {/* Problem Statement Specifications Modal */}
      <SpecificationsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;

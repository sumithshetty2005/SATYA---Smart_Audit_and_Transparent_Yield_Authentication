import React, { useState, useRef, useEffect } from 'react';
import campusImage from './assets/satya-campus.jpg';
import { gsap } from 'gsap';
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
  const currentPage = window.location.pathname.includes('audit') ? 'audit'
    : window.location.pathname.includes('about') ? 'about'
    : window.location.pathname.includes('faq') ? 'faq'
    : 'home';
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
  const featureCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = featureCardsRef.current?.querySelectorAll<HTMLElement>('.satya-feature-card');
    if (!cards?.length) return;
    const animations = gsap.fromTo(cards,
      { y: 48, opacity: 0, rotateX: 8 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.75, stagger: 0.12, ease: 'power3.out', paused: true }
    );
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animations.play();
        observer.disconnect();
      }
    }, { threshold: 0.18 });
    observer.observe(featureCardsRef.current!);
    return () => { observer.disconnect(); animations.kill(); };
  }, []);

  const steps = [
    { label: 'PDF page inventory', icon: <FileText className="w-4 h-4" /> },
    { label: 'Synthetic packet identification', icon: <Fingerprint className="w-4 h-4" /> },
    { label: 'Cross-document comparisons', icon: <Network className="w-4 h-4" /> },
    { label: 'Supporting evidence review', icon: <Eye className="w-4 h-4" /> },
    { label: 'External checks marked unavailable', icon: <Database className="w-4 h-4" /> },
    { label: 'Advisory summary prepared', icon: <Scroll className="w-4 h-4" /> },
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
              carpetAreaSqm: 11371.5,
              circulationRatio: 0.202,
              nearestFireExitM: 35.8,
              geofenceValid: false,
              gpsDistanceMeters: 388.4,
              gpsCoords: '18.5204° N, 73.8567° E (388m outside boundary)',
              polygons: [
                { id: 'cad-1', roomName: 'Classrooms Block', category: 'INSTRUCTIONAL', areaSqm: 10200, calculatedBy: 'Illustrative scenario', points: '40,45 300,45 300,230 40,230', status: 'PASS' },
                { id: 'cad-2', roomName: 'Administration & Support', category: 'ADMIN', areaSqm: 1171.5, calculatedBy: 'Illustrative scenario', points: '330,45 580,45 580,230 330,230', status: 'PASS' },
                { id: 'cad-3', roomName: 'Circulation Corridors', category: 'CIRCULATION', areaSqm: 2878.5, calculatedBy: 'Illustrative scenario', points: '40,250 580,250 580,420 40,420', status: 'DEFICIENT' },
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
              carpetAreaSqm: 16016,
              circulationRatio: 0.285,
              nearestFireExitM: 19.4,
              geofenceValid: true,
              gpsDistanceMeters: 42.5,
              gpsCoords: '19.1232° N, 72.8361° E (Within plot bounds)',
              polygons: [
                { id: 'ccad-1', roomName: 'Instructional Wings A & B', category: 'INSTRUCTIONAL', areaSqm: 12400, calculatedBy: 'Illustrative scenario', points: '40,40 380,40 380,230 40,230', status: 'PASS' },
                { id: 'ccad-2', roomName: 'Main Atrium & Circulation Foyers', category: 'CIRCULATION', areaSqm: 6384, calculatedBy: 'Illustrative scenario', points: '40,245 580,245 580,355 40,355', status: 'PASS' },
                { id: 'ccad-3', roomName: 'Administration & Support', category: 'ADMIN', areaSqm: 3616, calculatedBy: 'Illustrative scenario', points: '40,370 580,370 580,420 40,420', status: 'PASS' },
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

      {/* Main Administrative Navigation Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#FAF4E8]/90 border-b border-[#D4AF37]/40 shadow-[0_4px_20px_rgba(74,21,4,0.08)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504] opacity-90" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <a href="/" className="flex items-center gap-3.5 group shrink-0">
            <div className="satya-mark w-12 h-12 rounded-2xl bg-[#4A1504] border border-[#D4AF37] shadow-sm flex items-center justify-center transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105 shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <span className="font-cinzel text-lg sm:text-xl font-extrabold tracking-tight text-[#4A1504]">SATYA</span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide text-[#7B5133]">Smart Audit &amp; Transparent Yield Authentication</span>
            </div>
          </a>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-5 text-xs font-bold text-[#4A1504]">
            <a href="/" className="hover:text-[#C59B27] transition-colors">Home</a>
            {currentPage === 'home' && <a href="#features" className="hover:text-[#C59B27] transition-colors">Features</a>}
            <a href="/audit.html" className="hover:text-[#C59B27] transition-colors">Audit workspace</a>
            <a href="/about.html" className="hover:text-[#C59B27] transition-colors">About</a>
            <a href="/faq.html" className="hover:text-[#C59B27] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a href="/audit.html" className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4A1504] text-[#FFF3B0] hover:shadow-lg border border-[#D4AF37]/60 transition-all">Start an audit <ArrowRight className="inline w-3.5 h-3.5 ml-1" /></a>
            {scrutinyResult && (
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-cinzel font-bold bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] border border-[#D4AF37]/50 items-center gap-2 transition-all shadow-md cursor-pointer hidden xl:flex"
              >
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Inspection Order</span>
              </button>
            )}
            <button
              onClick={() => setIsSpecsModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 hover:bg-[#F5E6C8] border border-[#D4AF37]/50 text-[#4A1504] transition-all cursor-pointer"
              title="Project specifications"
            >
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>Specs</span>
            </button>
          </div>
        </div>
        <nav aria-label="Mobile navigation" className="lg:hidden flex items-center justify-center gap-5 px-3 pb-3 text-xs font-bold text-[#4A1504]">
          <a href="/" className="hover:text-[#C59B27]">Home</a>
          {currentPage === 'home' && <a href="#features" className="hover:text-[#C59B27]">Features</a>}
          <a href="/audit.html" className="hover:text-[#C59B27]">Audit workspace</a>
          <a href="/about.html" className="hover:text-[#C59B27]">About</a>
          <a href="/faq.html" className="hover:text-[#C59B27]">FAQ</a>
        </nav>
      </header>

      {/* Main Landing & Scrutiny Workspace */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 relative z-10 ${currentPage === 'home' ? 'py-3 space-y-6' : 'py-8 space-y-10'}`}>
        {currentPage === 'home' && <>
        {/* Home / Landing Page Hero Banner */}
        <section id="home" className="scroll-mt-28 relative overflow-hidden border border-[#D4AF37]/45 bg-[#F8F1E5] shadow-[0_24px_70px_rgba(74,21,4,0.12)] lg:h-[calc(100svh-10rem)] lg:min-h-[620px]">
          <div className="grid min-h-[620px] lg:h-full lg:min-h-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="relative z-10 flex flex-col justify-center px-7 py-8 sm:px-12 lg:px-11 lg:py-6 xl:px-14">
              <p className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#8B6825]">
                <span className="h-px w-8 bg-[#B18A3A]" /> Evidence-led institutional review
              </p>
              <h1 className="max-w-xl font-cinzel text-3xl font-semibold leading-[1.08] tracking-tight text-[#35180D] sm:text-4xl xl:text-[3.6rem]">
                Clear evidence.<br />
                <span className="font-serif font-normal italic text-[#79502A]">Confident scrutiny.</span>
              </h1>
              <p className="mt-4 max-w-lg font-serif text-sm leading-6 text-[#5E4938] sm:text-base sm:leading-7">
                A considered workspace for reviewing technical education filings, connecting each claim to its supporting evidence and applicable checks.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="/audit.html" className="inline-flex items-center gap-3 bg-[#35180D] px-4 py-2.5 text-xs font-semibold text-[#FFF4DA] shadow-lg transition hover:bg-[#542512] sm:text-sm">
                  Open audit workspace <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
                </a>
                <a href="#features" className="inline-flex items-center gap-2 border border-[#8B6825]/45 px-4 py-2.5 text-xs font-semibold text-[#4A2818] transition hover:bg-[#EEDFB8]/50 sm:text-sm">
                  See how it works
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#A98956]/30 pt-4 text-[8px] font-bold tracking-[0.14em] text-[#7E6544] sm:text-[9px]">
                <span>DOCUMENT REVIEW</span><span>VISUAL EVIDENCE</span><span>APH RULE MAPPING</span>
              </div>
            </div>

            <div className="relative min-h-[300px] overflow-hidden bg-[#263C3C] sm:min-h-[360px] lg:min-h-0" role="img" aria-label="Illustration of an institutional campus with an evidence review document">
              <img
                src={campusImage}
                alt="University campus with historic brick academic buildings and a landscaped courtyard"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#182B27]/45 via-transparent to-[#182B27]/10" />
              <div className="absolute left-5 top-5 flex items-center gap-2 border border-white/30 bg-[#F8F1E5]/90 px-3 py-2 text-[10px] font-semibold tracking-wide text-[#35180D] shadow-lg backdrop-blur sm:left-8 sm:top-8">
                <ShieldCheck className="h-4 w-4 text-[#9A7429]" /> Evidence, connected to each review
              </div>
              <div className="absolute bottom-5 left-5 w-[min(290px,calc(100%-2.5rem))] border border-[#F1D58C]/70 bg-[#FBF6EB]/95 p-4 shadow-2xl backdrop-blur sm:bottom-8 sm:left-8">
                <div className="flex items-center justify-between border-b border-[#C9B78D]/50 pb-3">
                  <span className="text-[9px] font-bold tracking-[0.18em] text-[#805C26]">REVIEW FILE</span>
                  <FileCheck2 className="h-4 w-4 text-[#8E6A2A]" />
                </div>
                <div className="mt-3 space-y-2"><span className="block h-2 w-4/5 bg-[#6C5B48]/25" /><span className="block h-2 w-full bg-[#6C5B48]/15" /><span className="block h-2 w-2/3 bg-[#6C5B48]/15" /></div>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold text-[#375C48]"><span className="h-2 w-2 rounded-full bg-[#55815F]" /> Traceable findings and review signals</div>
              </div>
              <div className="absolute bottom-8 right-7 hidden text-right text-[9px] font-bold tracking-[0.2em] text-white/75 md:block">SATYA · TECHNICAL EDUCATION REVIEW</div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 space-y-5 py-2">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div><p className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#A27724]">One filing. Multiple checks.</p><h2 className="font-cinzel text-2xl md:text-3xl font-bold text-[#4A1504] mt-1">A clearer path to a trusted review</h2></div>
          </div>
          <div ref={featureCardsRef} className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 perspective-1000">
            {[
              { n: '01', title: 'Read the document', icon: <FileText />, text: 'Extract structured fields and layout signals from institutional applications and supporting records.', tag: 'LAYOUT ANALYSIS', visual: 'scan' },
              { n: '02', title: 'Inspect for alterations', icon: <Fingerprint />, text: 'Surface image inconsistencies and suspicious edits for a reviewer to examine.', tag: 'VISUAL FORENSICS', visual: 'forensic' },
              { n: '03', title: 'Verify the source', icon: <Database />, text: 'Check available signatures, QR references and provenance signals against authoritative records.', tag: 'SOURCE CHECKS', visual: 'verify' },
              { n: '04', title: 'Compare with APH rules', icon: <Network />, text: 'Connect application facts to applicable Approval Process Handbook requirements and citations.', tag: 'RULE MAPPING', visual: 'graph' },
              { n: '05', title: 'Review infrastructure', icon: <Eye />, text: 'Bring spatial and visual evidence into view to help assess facilities and declared resources.', tag: 'EVIDENCE REVIEW', visual: 'evidence' },
              { n: '06', title: 'Seal the audit trail', icon: <ShieldCheck />, text: 'Present findings in a consolidated report with integrity signals for accountable review.', tag: 'AUDIT REPORTING', visual: 'ledger' },
            ].map((feature) => (
              <article key={feature.n} className={`satya-feature-card satya-card-${feature.visual} glass-parchment-gold rounded-2xl p-5 min-h-[240px] relative overflow-hidden group`}>
                <div className="satya-card-visual" aria-hidden="true"><span className="satya-orbit" /><span className="satya-signal" /></div>
                <div className="relative z-10 flex items-start justify-between"><span className="w-10 h-10 rounded-xl bg-[#4A1504] text-[#D4AF37] flex items-center justify-center">{React.cloneElement(feature.icon, { className: 'w-5 h-5' })}</span><span className="text-xs font-mono text-[#9A752E]">{feature.n}</span></div>
                <div className="relative z-10 mt-8"><p className="text-[9px] font-bold tracking-[0.2em] text-[#9A752E]">{feature.tag}</p><h3 className="font-cinzel text-lg font-bold text-[#4A1504] mt-1">{feature.title}</h3><p className="text-xs leading-relaxed text-[#2B1609]/75 mt-2 max-w-sm">{feature.text}</p></div>
              </article>
            ))}
          </div>
        </section>
        </>}

        {currentPage === 'audit' && <>
            {/* PRIMARY INGESTION ZONE: PDF Upload & Drop Area */}
            <section id="audit" className="scroll-mt-28">
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
                  accept=".pdf"
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
                  Upload an institutional application PDF to view the audit findings.
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
                    <span>Positive scenario (simulated fixture)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => executeScrutinyAnalysis(true)}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-white border border-red-300 hover:bg-red-50 text-red-900 font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>Risk scenario (simulated fixture)</span>
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
            </section>

            {/* REVEALED FINDINGS WORKSPACE */}
            <div ref={findingsRef}>
              {scrutinyResult && (
                <DocumentFindingsView
                  key={`${scrutinyResult.fileName}-${scrutinyResult.verdict}-${scrutinyResult.uploadedAt}`}
                  result={scrutinyResult}
                  onReset={() => {
                    setSelectedFile(null);
                    setScrutinyResult(null);
                  }}
                  onOpenReportModal={() => setIsReportModalOpen(true)}
                />
              )}
            </div>
        </>}
        {currentPage === 'about' && <section className="rounded-3xl bg-[#2B1609] text-[#F5E6C8] p-7 md:p-10 border border-[#D4AF37]/50 relative overflow-hidden space-y-7">
              <div className="absolute right-0 top-0 w-72 h-72 rounded-full border border-[#D4AF37]/20 translate-x-1/3 -translate-y-1/3" />
              <div className="relative max-w-4xl space-y-5">
                <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#D4AF37]">About SATYA</p>
                <h1 className="font-cinzel text-3xl md:text-5xl font-bold">Smart Audit and Transparent Yield Authentication</h1>
                <p className="text-base leading-relaxed text-[#F5E6C8]/80">SATYA is a document review and evidence organization system designed around the scrutiny of technical education institution filings. It brings documents, checks, and reviewer observations into one traceable workflow.</p>
                <div className="grid md:grid-cols-2 gap-4 pt-3">
                  {[
                    ['Why SATYA exists', 'Institutional applications can contain many records and claims that must be compared across pages and evidence types. SATYA helps reviewers organize that work and see where attention may be needed.'],
                    ['How a review works', 'A reviewer selects a filing, explores extracted information and available evidence checks, then examines the results across the audit workspace. Each signal should be interpreted alongside its source and limitations.'],
                    ['Evidence in context', 'The workflow groups document analysis, visual forensics, source checks, APH rule mapping, infrastructure review, and audit trail information so that related observations are easier to inspect.'],
                    ['Human accountability', 'Automated checks can assist triage, but a qualified reviewer remains responsible for validating evidence, resolving uncertainty, and making any formal decision.'],
                  ].map(([title, body]) => <article key={title} className="rounded-2xl border border-[#D4AF37]/30 bg-white/5 p-5"><h2 className="font-cinzel text-lg font-bold text-[#F3D778]">{title}</h2><p className="mt-2 text-sm leading-relaxed text-[#F5E6C8]/75">{body}</p></article>)}
                </div>
                <p className="border-l-2 border-[#D4AF37] pl-4 text-sm leading-relaxed text-[#F5E6C8]/65">SATYA is not an official AICTE service. Its review signals do not constitute regulatory decisions or issuer verification.</p>
              </div>
        </section>}
        {currentPage === 'faq' && <section className="space-y-6 py-2">
          <div><p className="text-[10px] font-bold tracking-[0.24em] uppercase text-[#A27724]">Frequently asked questions</p><h1 className="font-cinzel text-3xl md:text-4xl font-bold text-[#4A1504] mt-1">Understanding SATYA and its review workflow</h1><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#2B1609]/70">Answers about supported documents, evidence signals, reviewer responsibilities, and the current integration boundaries.</p></div>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              ['What is SATYA?', 'SATYA stands for Smart Audit and Transparent Yield Authentication. It is designed to organize review of technical education filings and present related evidence signals together.'],
              ['Who is SATYA for?', 'The workflow is intended to support institutional filing review by authorized compliance teams and human reviewers.'],
              ['What kinds of files can I review?', 'The audit workspace is designed for institutional application PDFs and supporting evidence such as land, faculty, building, and infrastructure records.'],
              ['What happens when I analyze a document?', 'The workspace presents a staged review flow and findings view. The exact checks depend on the connected backend and evidence available for the selected file.'],
              ['Are sample scenarios based on my uploaded file?', 'No. Sample scenarios are illustrative fixtures used to explore how findings may be displayed. They are separate from uploaded-file analysis.'],
              ['Does a green result guarantee compliance?', 'No. A displayed status summarizes a particular check and its available evidence. It is not a guarantee of compliance or a formal regulatory decision.'],
              ['Does SATYA make the final decision?', 'No. SATYA presents review signals and evidence for human scrutiny. A qualified officer must assess the context and make any formal decision.'],
              ['Does SATYA connect to DigiLocker or issuer registries?', 'External issuer services are only verified when a real integration is configured and returns evidence. If not connected, the result should be shown as unavailable.'],
              ['What does an unavailable check mean?', 'It means SATYA could not perform that check with the current configuration or evidence. Unavailable should not be interpreted as a pass or a failure.'],
              ['What is the APH rules view?', 'It organizes potential relationships between application claims and Approval Process Handbook requirements, including references that reviewers can inspect.'],
              ['How is infrastructure evidence reviewed?', 'The workspace can present visual and spatial evidence such as facility detections or floor-plan geometry. Findings depend on the input and should be confirmed by reviewers.'],
              ['Can I print or share a report?', 'Where enabled, the report action formats the current review findings for inspection. Review the contents and limitations before using it outside the workspace.'],
              ['Is SATYA an official AICTE service?', 'No. SATYA is a project and is not an official AICTE service. Its signals do not constitute regulatory decisions or issuer verification.'],
              ['How do I try the workspace?', 'Open Audit workspace from the navigation, then choose an eligible document or select an illustrative sample scenario.'],
            ].map(([question, answer]) => <details key={question} className="group rounded-xl border border-[#D4AF37]/35 bg-white/65 px-5 py-4"><summary className="cursor-pointer list-none font-semibold text-sm text-[#4A1504] flex items-center justify-between gap-4">{question}<span className="text-[#A27724] transition-transform group-open:rotate-45">＋</span></summary><p className="pt-3 text-xs leading-relaxed text-[#2B1609]/75">{answer}</p></details>)}
          </div>
        </section>}
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

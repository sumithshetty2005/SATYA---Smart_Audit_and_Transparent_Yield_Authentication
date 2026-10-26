import React, { useState, useEffect } from 'react';
import {
  Key,
  QrCode,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  Clock,
  Copy,
  Check,
  ServerOff,
  UserCheck,
  FileSearch,
} from 'lucide-react';
import type { InstitutionProfile } from '../types/compliance';
import type {
  DigiLockerOutcome,
  DigiLockerSourceReceipt,
  RegistryOption,
  DigiLockerOAuthTokenState,
} from '../types/verification';

interface Props {
  institution?: InstitutionProfile;
  claimedAcreage?: number;
  institutionName?: string;
  institutionId?: string;
}

const BACKEND_BASE = '';

const DEFAULT_REGISTRIES: RegistryOption[] = [
  {
    id: 'MAHABHUMI_LAND_RECORD',
    name: 'Maharashtra e-Mahabhumi (7/12 & Bhunaksha Portal)',
    jurisdiction: 'Government of Maharashtra',
    state: 'Maharashtra',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/mahabhumi/v2/extract',
    sandbox_active: false,
    description: 'Reference only; no authorized SATYA connection is configured.',
  },
  {
    id: 'E_BHULEKH_UP',
    name: 'UP e-Bhulekh Land & Revenue Department',
    jurisdiction: 'Board of Revenue, Uttar Pradesh',
    state: 'Uttar Pradesh',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/up-bhulekh/v1/khasra',
    sandbox_active: false,
    description: 'Reference only; no authorized SATYA connection is configured.',
  },
  {
    id: 'BHOOMI_KA',
    name: 'Karnataka Bhoomi Land Registry',
    jurisdiction: 'Revenue Department, Government of Karnataka',
    state: 'Karnataka',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/karnataka-bhoomi/v3/rtc',
    sandbox_active: false,
    description: 'Reference only; no authorized SATYA connection is configured.',
  },
  {
    id: 'FIRE_NOC_PORTAL',
    name: 'National Directorate of Fire & Emergency Services',
    jurisdiction: 'Ministry of Home Affairs / State Fire Departments',
    state: 'National',
    category: 'Safety Clearances',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/fire-noc/v1/validate',
    sandbox_active: false,
    description: 'Reference only; no authorized SATYA connection is configured.',
  },
  {
    id: 'COA_REGISTRY',
    name: 'Council of Architecture (CoA) Statutory Registry',
    jurisdiction: 'Statutory Body under Architects Act, 1972',
    state: 'National',
    category: 'Professional Licensure',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/coa/v1/license-check',
    sandbox_active: false,
    description: 'Reference only; no authorized SATYA connection is configured.',
  },
];

export const Layer3SourceVerification: React.FC<Props> = ({
  institution,
  claimedAcreage: propClaimedAcreage,
  institutionName: propInstitutionName,
  institutionId: propInstitutionId,
}) => {
  // Institution fallback data
  const instName =
    propInstitutionName || institution?.name || 'Apex Global Institute of Technology';
  const instId = propInstitutionId || institution?.id || '1-4458923110';
  const claimedAcreage =
    propClaimedAcreage ?? institution?.layer1?.payload?.landAreaAcres;

  // Active registries and selected registry
  const [registries, setRegistries] = useState<RegistryOption[]>(DEFAULT_REGISTRIES);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string>('MAHABHUMI_LAND_RECORD');

  // Network state & Returned Receipt
  const [isVerifying, setIsVerifying] = useState(false);
  const [sourceReceipt, setSourceReceipt] = useState<DigiLockerSourceReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // DigiLocker OAuth 2.0 Sandbox State
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [oauthTokenState] = useState<DigiLockerOAuthTokenState>({
    accessToken: '',
    tokenType: 'Bearer',
    expiresIn: 0,
    scope: '',
    consentArtifactId: '',
    consentTimestamp: '',
    citizenAadhaarLast4: '',
    status: 'NOT_CONFIGURED',
  });

  // Fetch available registries from backend on mount
  useEffect(() => {
    fetch(`${BACKEND_BASE}/api/v1/verification/digilocker/registries`)
      .then((res) => {
        if (!res.ok) throw new Error('Backend offline');
        return res.json();
      })
      .then((data: RegistryOption[]) => {
        if (data && data.length > 0) {
          setRegistries(data);
        }
      })
      .catch(() => {
        // Fallback to static defaults
      });
  }, []);

  // Execute Re-query on mount or when requested
  useEffect(() => {
    handleRequeryRegistries();
  }, []);

  const handleRequeryRegistries = async () => {
    setIsVerifying(true);
    setApiError(null);

    const payload = {
      institution_id: instId,
      institution_name: instName,
      survey_number: institution?.layer1?.payload?.surveyNumber,
      claimed_acreage: claimedAcreage,
      target_registry: selectedRegistryId,
      oauth_token: oauthTokenState.accessToken || undefined,
    };

    try {
      const response = await fetch(`${BACKEND_BASE}/api/v1/verification/digilocker/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: Failed to reconcile`);
      }

      const receipt: DigiLockerSourceReceipt = await response.json();
      setSourceReceipt(receipt);
    } catch (err: any) {
      setApiError(err.message || 'Connection to verification service failed.');
      setSourceReceipt(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyReceiptJson = () => {
    if (!sourceReceipt) return;
    navigator.clipboard.writeText(JSON.stringify(sourceReceipt, null, 2));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const hasPKIData = Boolean(institution?.layer3?.pkiCertificate);
  const pkiData = institution?.layer3?.pkiCertificate || {
    subjectName: 'Not supplied',
    issuerCN: 'Not checked',
    serialNumber: 'Not available',
    validFrom: 'Not available',
    validTo: 'Not available',
    keyAlgorithm: 'Not available',
    signatureAlgorithm: 'Not available',
    digestMatch: false,
    ocspStatus: 'UNKNOWN' as const,
    postSigningAlterationDetected: false,
    bytesAlteredTrace: '',
  };

  const hasQRCode = Boolean(institution?.layer3?.qrCode);
  const qrData = institution?.layer3?.qrCode || {
    foundOnPage: 0,
    qrPayloadUrl: '',
    hmacSignatureValid: false,
    issuerDomain: '',
    trustedDomain: false,
    embeddedMetadata: {
      approvalRef: '',
      sanctionedYear: '',
      intakeApproved: 0,
      authorizedSignatory: '',
    },
  };

  const currentOutcome = sourceReceipt?.outcome || 'UNAVAILABLE';

  // Get outcome badge styling
  const getOutcomeBadge = (outcome: DigiLockerOutcome) => {
    switch (outcome) {
      case 'MATCH':
        return {
          label: 'MATCH (VERIFIED)',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'MISMATCH':
        return {
          label: 'MISMATCH (DISCREPANCY)',
          bg: 'bg-red-100 text-red-800 border-red-300',
          icon: <XCircle className="w-3.5 h-3.5 text-red-600" />,
        };
      case 'PENDING':
        return {
          label: 'PENDING (CONSENT AWAITED)',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'UNAVAILABLE':
        return {
          label: 'NOT CONNECTED',
          bg: 'bg-slate-200 text-slate-800 border-slate-300',
          icon: <ServerOff className="w-3.5 h-3.5 text-slate-600" />,
        };
      case 'MANUAL_REVIEW':
        return {
          label: 'MANUAL REVIEW (FIELD SCRUTINY)',
          bg: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: <FileSearch className="w-3.5 h-3.5 text-purple-600" />,
        };
    }
  };

  const outcomeBadge = getOutcomeBadge(currentOutcome);

  // Compute live trust score
  const computedTrustScore = currentOutcome === 'UNAVAILABLE' ? null : (
    currentOutcome === 'MATCH' && pkiData.digestMatch
      ? 96
      : currentOutcome === 'MATCH'
      ? 78
      : currentOutcome === 'MISMATCH'
      ? 34
      : currentOutcome === 'PENDING'
      ? 50
      : 55);

  return (
    <div className="space-y-6 font-sans-modern">
      {/* Top Banner & Control Console */}
      <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-[#4A1504] text-[#F5E6C8] text-[10px] font-mono font-bold rounded">
                LAYER 3 • AUTHORITATIVE RECONCILIATION
              </span>
              <span className="text-xs text-[#2B1609]/70 font-semibold">
                Registry references • OAuth / issuer adapter not configured • signature and QR checks shown only when evidence is supplied
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              Registry Verification Status
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Registry names are reference options only. No authorization, issuer lookup, token exchange, or signed source receipt is available in this prototype, so a match cannot be reported.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* OAuth Sandbox Drawer Trigger */}
            <button
              onClick={() => setIsOAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#FAF4E8] hover:bg-[#F5E6C8] text-[#4A1504] border border-[#D4AF37]/60 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#4A1504]" />
              <span>DigiLocker OAuth (NeGD)</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            </button>

            {/* Re-Query Registries Button */}
            <button
              onClick={() => handleRequeryRegistries()}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Checking integration status...' : 'Check integration status'}</span>
            </button>

            {/* Source Trust Index */}
            <div
              className={`p-3 rounded-xl border text-right min-w-[100px] ${
                computedTrustScore === null
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : computedTrustScore > 75
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : computedTrustScore > 45
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-75 block">Trust Index</span>
              <span className="font-mono font-extrabold text-lg">{computedTrustScore === null ? 'N/A' : `${computedTrustScore}%`}</span>
            </div>
          </div>
        </div>

        {/* Registry selection is informational until a provider is configured. */}
        <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#4A1504]">Target Registry:</span>
            <select
              value={selectedRegistryId}
              onChange={(e) => {
                setSelectedRegistryId(e.target.value);
                // Refresh the unavailable integration status for the selected reference.
                setTimeout(() => handleRequeryRegistries(), 50);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-[#D4AF37]/60 bg-white text-[#4A1504] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#4A1504] cursor-pointer"
            >
              {registries.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name} ({reg.state})
                </option>
              ))}
            </select>
          </div>

          <span className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-700">Integration status: not configured</span>
        </div>

        {apiError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <span>Notice: {apiError}. No fallback or synthetic verification result was used.</span>
          </div>
        )}
      </div>

      {/* Main Grid: Returned Source Receipt & Verification Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: DigiLocker Registry Receipt (Expanded with Real Backend Data) */}
        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                    DigiLocker Land Registry
                  </h3>
                  <span className="text-[10px] text-[#2B1609]/60 block">
                    Not connected · reference only
                  </span>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1 ${outcomeBadge.bg}`}
              >
                {outcomeBadge.icon}
                <span>{outcomeBadge.label}</span>
              </span>
            </div>

            {/* Registry Info Details */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Endpoint:</span>
                <span className="font-mono text-[#4A1504] font-semibold truncate max-w-[180px]">
                  {sourceReceipt?.registry_name || 'No issuer selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Document Type:</span>
                <span className="font-medium text-[#2B1609]">Land Title Deed (7/12 & Khatauni)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Authoritative Deed:</span>
                <span className="font-mono font-bold text-[#2B1609]">
                  {sourceReceipt?.authoritative_record?.deed_number || 'Not supplied'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Registered Owner:</span>
                <span className="font-medium text-[#2B1609] truncate max-w-[190px]">
                  {sourceReceipt?.authoritative_record?.registered_owner ||
                    'Not available - no issuer response'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">API Latency:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {sourceReceipt?.api_latency_ms != null ? `${sourceReceipt.api_latency_ms} ms` : 'N/A - no request sent'}
                </span>
              </div>
            </div>

            {/* Outcome Detail Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                currentOutcome === 'MATCH'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : currentOutcome === 'MISMATCH'
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : currentOutcome === 'PENDING'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : currentOutcome === 'UNAVAILABLE'
                  ? 'bg-slate-100 border-slate-300 text-slate-900'
                  : 'bg-purple-50 border-purple-300 text-purple-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-[10px] tracking-wider">
                  Reconciliation Outcome:
                </span>
                {outcomeBadge.icon}
              </div>

              <p className="font-semibold text-xs leading-snug">
                {sourceReceipt?.status_title || 'Reconciliation Complete'}
              </p>

              {/* Side-by-Side Comparison if records exist */}
              {sourceReceipt?.authoritative_record && (
                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-white/80 rounded border border-[#D4AF37]/30">
                    <span className="text-[9px] text-[#2B1609]/60 block">Claimed in Form</span>
                    <span className="font-bold font-mono text-[#4A1504]">
                      {claimedAcreage} Acres
                    </span>
                  </div>
                  <div className="p-2 bg-white/80 rounded border border-[#D4AF37]/30">
                    <span className="text-[9px] text-[#2B1609]/60 block">State Registry API</span>
                    <span
                      className={`font-bold font-mono ${
                        currentOutcome === 'MATCH' ? 'text-emerald-800' : 'text-red-700'
                      }`}
                    >
                      {sourceReceipt.authoritative_record.authoritative_acreage ?? 'N/A'} Acres
                    </span>
                  </div>
                </div>
              )}

              {/* Discrepancy details */}
              {sourceReceipt?.discrepancy_details && (
                <p className="text-[11px] leading-relaxed pt-1 font-medium">
                  {sourceReceipt.discrepancy_details}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#2B1609]/70 font-mono flex items-center justify-between border-t border-[#D4AF37]/20">
            <span className="truncate max-w-[200px]">
              OAuth: {oauthTokenState.accessToken ? 'Token available' : 'Not configured'}
            </span>
            <span className="text-slate-600 font-bold">No active session</span>
          </div>
        </div>

        {/* Module 2: PKI X.509 Digital Signature Validator */}
        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                    PKI X.509 Signature Validator
                  </h3>
                  <span className="text-[10px] text-[#2B1609]/60 block">
                    pyHanko Bytecode Inspector
                  </span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  !hasPKIData
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : pkiData.digestMatch
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {!hasPKIData ? 'NOT CHECKED' : pkiData.digestMatch ? 'VALID DSC' : 'DIGEST MISMATCH'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Subject CN:</span>
                <span className="font-semibold text-[#4A1504]">{pkiData.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Issuing CA:</span>
                <span className="font-medium text-[#2B1609]">{pkiData.issuerCN}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Serial No:</span>
                <span className="font-mono text-[10px] text-[#2B1609]">{pkiData.serialNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Algorithm:</span>
                <span className="font-mono text-[#2B1609]">
                  {pkiData.keyAlgorithm} / {pkiData.signatureAlgorithm.split(' ')[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">OCSP Status:</span>
                <span className={`font-semibold ${hasPKIData && pkiData.ocspStatus === 'GOOD' ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {hasPKIData ? pkiData.ocspStatus : 'Not checked'}
                </span>
              </div>
            </div>

            {/* Cryptographic Alteration Callout */}
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                !hasPKIData
                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                  : pkiData.postSigningAlterationDetected
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {!hasPKIData ? (
                  <Key className="w-4 h-4 text-slate-600" />
                ) : pkiData.postSigningAlterationDetected ? (
                  <Unlock className="w-4 h-4 text-red-600" />
                ) : (
                  <Lock className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-bold text-[11px]">
                  {!hasPKIData
                    ? 'No signature evidence supplied; validation not run'
                    : pkiData.postSigningAlterationDetected
                    ? 'Unauthorized Post-Signing Modification Detected'
                    : 'Cryptographic Document Integrity Intact'}
                </span>
              </div>
              {pkiData.bytesAlteredTrace && (
                <p className="text-[10px] font-mono text-red-900 leading-relaxed">
                  {pkiData.bytesAlteredTrace}
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#2B1609]/70 font-mono border-t border-[#D4AF37]/20">
            Certificate chain: not checked against an issuer
          </div>
        </div>

        {/* Module 3: Live 2D QR Code Payload Decoder */}
        <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-[#D4AF37]/50 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D4AF37]/30">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-sm text-[#4A1504]">
                    2D QR Payload Decoder
                  </h3>
                  <span className="text-[10px] text-[#2B1609]/60 block">OpenCV cv2.QRCodeDetector</span>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  !hasQRCode
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : qrData.hmacSignatureValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {!hasQRCode ? 'NO QR SUPPLIED' : qrData.hmacSignatureValid ? 'HMAC VALID' : 'HMAC INVALID'}
              </span>
            </div>

            {/* QR Visualization */}
            <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/30 flex items-center gap-3">
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-[#D4AF37]/40 shadow-xs flex items-center justify-center shrink-0">
                <QrCode className="w-14 h-14 text-[#4A1504]" />
              </div>
              <div className="space-y-1 text-xs overflow-hidden">
                <span className="text-[10px] text-[#2B1609]/60 uppercase font-bold block">
                  Decoded URL
                </span>
                <p className="font-mono text-[11px] truncate text-[#4A1504] font-semibold">
                  {qrData.qrPayloadUrl || 'No QR payload supplied'}
                </p>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>Domain Trust:</span>
                  <span
                    className={`font-bold ${
                      !hasQRCode ? 'text-slate-600' : qrData.trustedDomain ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {!hasQRCode ? 'Not checked' : qrData.trustedDomain ? 'Trusted domain' : 'Untrusted domain'}
                  </span>
                </div>
              </div>
            </div>

            {/* Embedded Metadata */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Approval Reference:</span>
                <span className="font-mono font-bold text-[#4A1504]">
                  {qrData.embeddedMetadata.approvalRef}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Approved Intake:</span>
                <span className="font-mono font-bold text-[#2B1609]">
                  {qrData.embeddedMetadata.intakeApproved} Seats
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Signatory:</span>
                <span className="font-medium text-[#2B1609]">
                  {qrData.embeddedMetadata.authorizedSignatory}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-[#2B1609]/70 font-mono border-t border-[#D4AF37]/20">
            QR issuer key: not configured
          </div>
        </div>
      </div>

      {/* Returned Cryptographic Source Verification Receipt Card */}
      {sourceReceipt?.receipt_id && (
        <div className="p-5 rounded-2xl bg-[#FAF4E8] border border-[#D4AF37] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/40">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4A1504]" />
              <div>
                <h4 className="font-cinzel font-bold text-sm text-[#4A1504]">
                  Cryptographic Source Receipt • {sourceReceipt.receipt_id}
                </h4>
                <p className="text-[11px] text-[#2B1609]/70 font-mono">
                  Sealed at {sourceReceipt.timestamp} • Registry: {sourceReceipt.registry_code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReceiptJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D4AF37]/50 rounded-lg text-xs font-semibold text-[#4A1504] hover:bg-[#F5E6C8] transition-all cursor-pointer shadow-xs"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied JSON</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Signed Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cryptographic Hashes & Audit Proofs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2B1609]/60 block font-sans">
                Payload SHA-256 Digest
              </span>
              <p className="text-[11px] text-[#4A1504] truncate font-semibold" title={sourceReceipt.raw_payload_digest ?? undefined}>
                {sourceReceipt.raw_payload_digest}
              </p>
              <span className="text-[9px] text-emerald-700 block">Verified Deterministic Canonical Hash</span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2B1609]/60 block font-sans">
                NeGD Setu HMAC-SHA256 Signature
              </span>
              <p className="text-[11px] text-emerald-800 truncate font-semibold" title={sourceReceipt.hmac_signature ?? undefined}>
                {sourceReceipt.hmac_signature}
              </p>
              <span className="text-[9px] text-[#2B1609]/60 block">Signed via Master Gov Secret</span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2B1609]/60 block font-sans">
                Layer 6 Merkle Leaf Hash
              </span>
              <p className="text-[11px] text-[#4A1504] truncate font-semibold" title={sourceReceipt.merkle_leaf_hash ?? undefined}>
                {sourceReceipt.merkle_leaf_hash}
              </p>
              <span className="text-[9px] text-[#D4AF37] block font-bold">Ready for Merkle Block Commit</span>
            </div>
          </div>
        </div>
      )}

      {/* DigiLocker NeGD API Setu OAuth 2.0 Consent Handshake Modal */}
      {isOAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#F5E6C8] border-2 border-[#D4AF37] rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/60">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-[#4A1504]" />
                <div>
                  <h3 className="font-cinzel font-bold text-lg text-[#4A1504]">
                    DigiLocker OAuth connection unavailable
                  </h3>
                  <span className="text-xs text-[#2B1609]/70 font-semibold">
                    This local prototype has no configured OAuth client
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOAuthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#4A1504]/10 hover:bg-[#4A1504]/20 flex items-center justify-center text-[#4A1504] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#2B1609]">
              <p className="leading-relaxed">
                No OAuth request will be sent from this prototype. A real client ID, approved redirect URI, credentials, and provider setup are required before consent or registry retrieval can be demonstrated.
              </p>

              <div className="p-3.5 bg-white/80 rounded-2xl border border-[#D4AF37]/50 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Client ID:</span>
                  <span className="font-bold text-slate-700">Not configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Redirect URI:</span>
                  <span className="truncate max-w-[240px]">Not configured</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Consent Artifact:</span>
                  <span className="font-bold text-slate-700">None</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Signatory Aadhaar (Last 4):</span>
                  <span className="font-bold">Not requested</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Current Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    NOT CONFIGURED
                  </span>
                </div>
              </div>

              {/* Handshake Sequence Preview */}
              <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 space-y-1.5 text-[11px]">
                <span className="font-cinzel font-bold text-[#4A1504] block">
                  Integration prerequisites
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[#2B1609]/80 font-mono text-[10px]">
                  <li>Obtain authorized sandbox/production client credentials</li>
                  <li>Register and validate an approved callback URL</li>
                  <li>Implement real authorization-code and state validation</li>
                  <li>Call registry services and retain their response provenance</li>
                  <li>Create a receipt only from a verified provider response</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsOAuthModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4A1504] hover:bg-[#4A1504]/10 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                disabled
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-300 text-slate-700 rounded-xl text-xs font-bold shadow-md cursor-not-allowed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  OAuth client not configured
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

const BACKEND_BASE = 'http://127.0.0.1:8000';

const DEFAULT_REGISTRIES: RegistryOption[] = [
  {
    id: 'MAHABHUMI_LAND_RECORD',
    name: 'Maharashtra e-Mahabhumi (7/12 & Bhunaksha Portal)',
    jurisdiction: 'Government of Maharashtra',
    state: 'Maharashtra',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/mahabhumi/v2/extract',
    sandbox_active: true,
    description: 'Authoritative land title deeds, khatauni records, and 7/12 land parcel registers for Western Region.',
  },
  {
    id: 'E_BHULEKH_UP',
    name: 'UP e-Bhulekh Land & Revenue Department',
    jurisdiction: 'Board of Revenue, Uttar Pradesh',
    state: 'Uttar Pradesh',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/up-bhulekh/v1/khasra',
    sandbox_active: true,
    description: 'Real-time Khasra/Khatauni verification and spatial contiguity validation for Northern Region.',
  },
  {
    id: 'BHOOMI_KA',
    name: 'Karnataka Bhoomi Land Registry',
    jurisdiction: 'Revenue Department, Government of Karnataka',
    state: 'Karnataka',
    category: 'Land Revenue Records',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/karnataka-bhoomi/v3/rtc',
    sandbox_active: true,
    description: 'RTC Land Title and Mutation Ledger with digital cryptographic signature validation.',
  },
  {
    id: 'FIRE_NOC_PORTAL',
    name: 'National Directorate of Fire & Emergency Services',
    jurisdiction: 'Ministry of Home Affairs / State Fire Departments',
    state: 'National',
    category: 'Safety Clearances',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/fire-noc/v1/validate',
    sandbox_active: true,
    description: 'Real-time verification of institutional Fire Safety NOCs and structural inspection approvals.',
  },
  {
    id: 'COA_REGISTRY',
    name: 'Council of Architecture (CoA) Statutory Registry',
    jurisdiction: 'Statutory Body under Architects Act, 1972',
    state: 'National',
    category: 'Professional Licensure',
    endpoint: 'https://apisetu.gov.in/sandbox/dl/coa/v1/license-check',
    sandbox_active: true,
    description: 'Validates architect registration numbers and structural certificate authenticity.',
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
    propClaimedAcreage ?? institution?.layer1?.payload?.landAreaAcres ?? 7.2;

  // Active registries and selected registry
  const [registries, setRegistries] = useState<RegistryOption[]>(DEFAULT_REGISTRIES);
  const [selectedRegistryId, setSelectedRegistryId] = useState<string>('MAHABHUMI_LAND_RECORD');

  // Outcome simulation override (or 'AUTO')
  const [requestedOutcome, setRequestedOutcome] = useState<DigiLockerOutcome | 'AUTO'>('AUTO');

  // Network state & Returned Receipt
  const [isVerifying, setIsVerifying] = useState(false);
  const [sourceReceipt, setSourceReceipt] = useState<DigiLockerSourceReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // DigiLocker OAuth 2.0 Sandbox State
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [isOAuthAuthenticating, setIsOAuthAuthenticating] = useState(false);
  const [oauthTokenState, setOauthTokenState] = useState<DigiLockerOAuthTokenState>({
    accessToken: 'dl_tok_9f1a84c01d29e882a933f789bc441021',
    tokenType: 'Bearer',
    expiresIn: 3600,
    scope: 'org.digilocker.land_records org.digilocker.edu_affiliation',
    consentArtifactId: 'CNS-ARTEFACT-8849-B2',
    consentTimestamp: '2026-10-26T11:42:00Z',
    citizenAadhaarLast4: '8819',
    status: 'ACTIVE_CONSENT_GRANTED',
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

  const handleRequeryRegistries = async (forcedOutcomeOverride?: DigiLockerOutcome) => {
    setIsVerifying(true);
    setApiError(null);

    const outcomeToSend =
      forcedOutcomeOverride || (requestedOutcome !== 'AUTO' ? requestedOutcome : undefined);

    const payload = {
      institution_id: instId,
      institution_name: instName,
      deed_number: 'DEED-PUN-2019-9821',
      survey_number: 'Survey-42/1B',
      claimed_acreage: claimedAcreage,
      target_registry: selectedRegistryId,
      forced_outcome: outcomeToSend,
      oauth_token: oauthTokenState.accessToken,
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
      // Local fallback simulator if backend port is not responding
      const fallbackOutcome = outcomeToSend || 'MISMATCH';
      setSourceReceipt({
        receipt_id: `DLR-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        outcome: fallbackOutcome,
        status_title:
          fallbackOutcome === 'MATCH'
            ? 'Authoritative Match Reconciled (100% Integrity)'
            : fallbackOutcome === 'MISMATCH'
            ? 'Regulatory Discrepancy Flagged (Acreage Deficit)'
            : fallbackOutcome === 'PENDING'
            ? 'Signatory Consent Awaited (Sandbox Consent Pending)'
            : fallbackOutcome === 'UNAVAILABLE'
            ? 'Registry Gateway Unavailable (HTTP 504 Timeout)'
            : 'Manual Scrutiny Mandated (Joint Khata Demarcation)',
        status_description:
          fallbackOutcome === 'MATCH'
            ? `All parameters reconcile 100% against official state land register.`
            : fallbackOutcome === 'MISMATCH'
            ? `Institutional claim of ${claimedAcreage} Acres conflicts with State registry records (4.00 Acres).`
            : fallbackOutcome === 'PENDING'
            ? `Consent token pending authorization from registered institutional trustee.`
            : fallbackOutcome === 'UNAVAILABLE'
            ? `State revenue gateway server timed out after 3500ms.`
            : `Joint ancestral holding without Sub-Divisional Officer demarcation map.`,
        registry_code: selectedRegistryId,
        registry_name:
          registries.find((r) => r.id === selectedRegistryId)?.name ||
          'State Land & Revenue Registry',
        authoritative_record:
          fallbackOutcome === 'PENDING' || fallbackOutcome === 'UNAVAILABLE'
            ? null
            : {
                deed_number: 'DEED-PUN-2019-9821',
                survey_number: 'Survey-42/1B',
                registered_owner:
                  fallbackOutcome === 'MATCH'
                    ? `${instName} Education Society`
                    : 'M/s Industrial Agro Farms Pvt Ltd',
                authoritative_acreage: fallbackOutcome === 'MATCH' ? claimedAcreage : 4.0,
                registration_date: '2014-11-03',
                encumbrance_status:
                  fallbackOutcome === 'MATCH' ? 'NIL_ENCUMBRANCE' : 'ACTIVE_BANK_HYPOTHECATION',
                zoning_classification:
                  fallbackOutcome === 'MATCH' ? 'Educational / Institutional' : 'Agricultural Zone',
                issuing_authority: 'Government of Maharashtra',
                state: 'Maharashtra',
                registry_source_url: 'https://apisetu.gov.in/sandbox/dl/mahabhumi/v2/extract',
              },
        claimed_record: {
          institution_id: instId,
          institution_name: instName,
          deed_number: 'DEED-PUN-2019-9821',
          survey_number: 'Survey-42/1B',
          claimed_acreage: claimedAcreage,
          document_type: 'LAND_TITLE_DEED',
        },
        discrepancy_details:
          fallbackOutcome === 'MISMATCH'
            ? `Claimed: ${claimedAcreage} Acres | Registry: 4.00 Acres (-${(
                claimedAcreage - 4.0
              ).toFixed(2)} Acres). Unrelated registered owner.`
            : null,
        discrepancies:
          fallbackOutcome === 'MISMATCH'
            ? [
                {
                  field: 'land_area_acres',
                  claimed: claimedAcreage,
                  authoritative: 4.0,
                  delta: -(claimedAcreage - 4.0),
                  violation: 'APH Chapter II Clause 2.4.1 Land Norm Shortfall',
                  severity: 'CRITICAL',
                },
              ]
            : [],
        oauth_consent_token: oauthTokenState.accessToken,
        oauth_consent_timestamp: new Date().toISOString(),
        api_latency_ms: 184,
        raw_payload_digest: '9a462c413759d8e8e24824af7bf6438df391df050e1f87ef05769d65f572a0c0',
        hmac_signature: '428c85cb2c2e0d0cf27cd53c1ecc92213f3bb99f0ea21b1f80bc3431ca44873c',
        merkle_leaf_hash: '139206e32c04b5642d426d36ce2ccdc19ab48c3b29012ea056d34a07a4d87913',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateOAuthConsent = async () => {
    setIsOAuthAuthenticating(true);
    try {
      // 1. Authorize step
      const authRes = await fetch(`${BACKEND_BASE}/api/v1/verification/digilocker/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution_id: instId,
          redirect_uri: 'http://localhost:5173/verification/oauth/callback',
          scope: 'org.digilocker.land_records org.digilocker.edu_affiliation',
        }),
      });

      const authData = await authRes.json();

      // 2. Token step
      const tokenRes = await fetch(`${BACKEND_BASE}/api/v1/verification/digilocker/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'AUTH_CODE_SANDBOX_SETU_88',
          state: authData.state || 'csrf_state_8912',
          client_id: 'AICTE_SETU_SANDBOX_2026',
        }),
      });

      const tokenData = await tokenRes.json();
      setOauthTokenState({
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope,
        consentArtifactId: tokenData.consent_artifact_id,
        consentTimestamp: tokenData.consent_timestamp,
        citizenAadhaarLast4: tokenData.citizen_aadhaar_last4,
        status: tokenData.status,
      });
    } catch {
      // Local fallback
      setOauthTokenState({
        accessToken: `dl_tok_${Math.random().toString(36).substring(2, 16)}`,
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'org.digilocker.land_records org.digilocker.edu_affiliation',
        consentArtifactId: `CNS-ARTEFACT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        consentTimestamp: new Date().toISOString(),
        citizenAadhaarLast4: '8819',
        status: 'ACTIVE_CONSENT_GRANTED',
      });
    } finally {
      setIsOAuthAuthenticating(false);
      setIsOAuthModalOpen(false);
      // Automatically refresh verification with new consent token
      handleRequeryRegistries();
    }
  };

  const handleCopyReceiptJson = () => {
    if (!sourceReceipt) return;
    navigator.clipboard.writeText(JSON.stringify(sourceReceipt, null, 2));
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const pkiData = institution?.layer3?.pkiCertificate || {
    subjectName: 'Dr. Ramesh Patil, Authorized Signatory',
    issuerCN: 'e-Mudhra Sub-CA for Class 3 Individual',
    serialNumber: '0x4A19B82C901E',
    validFrom: '2023-04-10',
    validTo: '2025-04-10',
    keyAlgorithm: 'RSA 2048-bit',
    signatureAlgorithm: 'SHA-256 with RSA Encryption',
    digestMatch: false,
    ocspStatus: 'GOOD' as const,
    postSigningAlterationDetected: true,
    bytesAlteredTrace: 'Offset 0x0041F90 - 0x0042008 modified after signature creation',
  };

  const qrData = institution?.layer3?.qrCode || {
    foundOnPage: 1,
    qrPayloadUrl: 'https://facilities.aicte-india.org/verify?ref=AICTE-APP-2025-SCR&h=89a7',
    hmacSignatureValid: true,
    issuerDomain: 'facilities.aicte-india.org',
    trustedDomain: true,
    embeddedMetadata: {
      approvalRef: 'AICTE-APP-2025-SCR',
      sanctionedYear: '2025-2026',
      intakeApproved: 420,
      authorizedSignatory: 'Member Secretary, AICTE New Delhi',
    },
  };

  const currentOutcome = sourceReceipt?.outcome || 'MISMATCH';

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
          label: 'UNAVAILABLE (OFFLINE)',
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
  const computedTrustScore =
    currentOutcome === 'MATCH' && pkiData.digestMatch
      ? 96
      : currentOutcome === 'MATCH'
      ? 78
      : currentOutcome === 'MISMATCH'
      ? 34
      : currentOutcome === 'PENDING'
      ? 50
      : currentOutcome === 'UNAVAILABLE'
      ? 45
      : 55;

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
                NeGD API Setu DigiLocker Sandbox • State Land Registries • PKI X.509 • 2D QR Code
              </span>
            </div>
            <h2 className="font-cinzel font-bold text-xl md:text-2xl text-[#4A1504]">
              DigiLocker Registry Handshake & Cryptographic Source Proof
            </h2>
            <p className="text-xs text-[#2B1609]/80 leading-relaxed max-w-3xl">
              Connects directly to authorized state land registries (e-Mahabhumi, UP e-Bhulekh, Bhoomi KA),
              enforces citizen/signatory OAuth 2.0 consent via NeGD API Setu, and delivers tamper-evident
              source verification receipts committed to the Layer 6 audit tree.
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </button>

            {/* Re-Query Registries Button */}
            <button
              onClick={() => handleRequeryRegistries()}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Querying State Registry...' : 'Re-Query Registries'}</span>
            </button>

            {/* Source Trust Index */}
            <div
              className={`p-3 rounded-xl border text-right min-w-[100px] ${
                computedTrustScore > 75
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : computedTrustScore > 45
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold opacity-75 block">Trust Index</span>
              <span className="font-mono font-extrabold text-lg">{computedTrustScore}%</span>
            </div>
          </div>
        </div>

        {/* Regulatory Outcome Selector Bar & Registry Switcher */}
        <div className="mt-5 pt-4 border-t border-[#D4AF37]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#4A1504]">Target Registry:</span>
            <select
              value={selectedRegistryId}
              onChange={(e) => {
                setSelectedRegistryId(e.target.value);
                // Trigger query with newly selected registry
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

          {/* Explicit Regulatory Outcome Simulator Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-[#2B1609]/70 text-[11px] mr-1">
              Simulate Outcome:
            </span>
            {(['AUTO', 'MATCH', 'MISMATCH', 'PENDING', 'UNAVAILABLE', 'MANUAL_REVIEW'] as const).map(
              (o) => {
                const isActive = requestedOutcome === o;
                return (
                  <button
                    key={o}
                    onClick={() => {
                      setRequestedOutcome(o);
                      handleRequeryRegistries(o === 'AUTO' ? undefined : o);
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4A1504] text-[#F5E6C8] shadow-xs'
                        : 'bg-[#FAF4E8] text-[#2B1609]/80 border border-[#D4AF37]/40 hover:bg-[#F5E6C8]'
                    }`}
                  >
                    {o}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {apiError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
            <span>Notice: {apiError} (Fallback sandbox simulation active)</span>
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
                    NeGD API Setu Connected
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
                  {sourceReceipt?.registry_name || 'Maharashtra e-Mahabhumi'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Document Type:</span>
                <span className="font-medium text-[#2B1609]">Land Title Deed (7/12 & Khatauni)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Authoritative Deed:</span>
                <span className="font-mono font-bold text-[#2B1609]">
                  {sourceReceipt?.authoritative_record?.deed_number || 'DEED-PUN-2019-9821'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">Registered Owner:</span>
                <span className="font-medium text-[#2B1609] truncate max-w-[190px]">
                  {sourceReceipt?.authoritative_record?.registered_owner ||
                    (currentOutcome === 'PENDING'
                      ? 'Consent Awaited'
                      : currentOutcome === 'UNAVAILABLE'
                      ? 'Registry Down'
                      : 'M/s Industrial Agro Farms Pvt Ltd')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#2B1609]/70">API Latency:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {sourceReceipt?.api_latency_ms || 184} ms
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
              OAuth: {oauthTokenState.accessToken.substring(0, 18)}...
            </span>
            <span className="text-emerald-700 font-bold">NeGD Sandbox</span>
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
                  pkiData.digestMatch
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {pkiData.digestMatch ? 'VALID DSC' : 'DIGEST CORRUPT'}
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
                <span className="font-semibold text-emerald-700">
                  {pkiData.ocspStatus} (Good)
                </span>
              </div>
            </div>

            {/* Cryptographic Alteration Callout */}
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                pkiData.postSigningAlterationDetected
                  ? 'bg-red-50 border-red-300 text-red-950'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2">
                {pkiData.postSigningAlterationDetected ? (
                  <Unlock className="w-4 h-4 text-red-600" />
                ) : (
                  <Lock className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-bold text-[11px]">
                  {pkiData.postSigningAlterationDetected
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
            Root CA: Controller of Certifying Authorities (CCA India)
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
                  qrData.hmacSignatureValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-red-100 text-red-800 border border-red-300'
                }`}
              >
                {qrData.hmacSignatureValid ? 'HMAC VALID' : 'HMAC FAKE'}
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
                  {qrData.qrPayloadUrl}
                </p>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span>Domain Trust:</span>
                  <span
                    className={`font-bold ${
                      qrData.trustedDomain ? 'text-emerald-700' : 'text-red-700'
                    }`}
                  >
                    {qrData.trustedDomain ? 'Official AICTE Domain' : 'Untrusted / Spoofed Domain'}
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
            Public Key: keys.aicte-india.org/master-root-2024.pub
          </div>
        </div>
      </div>

      {/* Returned Cryptographic Source Verification Receipt Card */}
      {sourceReceipt && (
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
              <p className="text-[11px] text-[#4A1504] truncate font-semibold" title={sourceReceipt.raw_payload_digest}>
                {sourceReceipt.raw_payload_digest}
              </p>
              <span className="text-[9px] text-emerald-700 block">Verified Deterministic Canonical Hash</span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2B1609]/60 block font-sans">
                NeGD Setu HMAC-SHA256 Signature
              </span>
              <p className="text-[11px] text-emerald-800 truncate font-semibold" title={sourceReceipt.hmac_signature}>
                {sourceReceipt.hmac_signature}
              </p>
              <span className="text-[9px] text-[#2B1609]/60 block">Signed via Master Gov Secret</span>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#2B1609]/60 block font-sans">
                Layer 6 Merkle Leaf Hash
              </span>
              <p className="text-[11px] text-[#4A1504] truncate font-semibold" title={sourceReceipt.merkle_leaf_hash}>
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
                    DigiLocker Developer Sandbox (NeGD)
                  </h3>
                  <span className="text-xs text-[#2B1609]/70 font-semibold">
                    National e-Governance Division • API Setu OAuth 2.0
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
                Demonstrates AICTE's integration with the official DigiLocker Sandbox gateway. In accordance
                with the Problem Statement, documents are fetched exclusively with cryptographic citizen/trustee
                consent token.
              </p>

              <div className="p-3.5 bg-white/80 rounded-2xl border border-[#D4AF37]/50 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Client ID:</span>
                  <span className="font-bold text-[#4A1504]">AICTE_SETU_SANDBOX_2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Redirect URI:</span>
                  <span className="truncate max-w-[240px]">http://localhost:5173/oauth/callback</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Consent Artifact:</span>
                  <span className="font-bold text-emerald-800">{oauthTokenState.consentArtifactId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Signatory Aadhaar (Last 4):</span>
                  <span className="font-bold">XXXX-XXXX-{oauthTokenState.citizenAadhaarLast4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#2B1609]/60 font-sans">Current Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {oauthTokenState.status}
                  </span>
                </div>
              </div>

              {/* Handshake Sequence Preview */}
              <div className="p-3 bg-[#FAF4E8] rounded-xl border border-[#D4AF37]/40 space-y-1.5 text-[11px]">
                <span className="font-cinzel font-bold text-[#4A1504] block">
                  OAuth 2.0 Handshake Pipeline
                </span>
                <ol className="list-decimal pl-4 space-y-1 text-[#2B1609]/80 font-mono text-[10px]">
                  <li>Initiate: /api/v1/verification/digilocker/oauth/authorize</li>
                  <li>Consent: Citizen biometric / OTP auth on MeriPehchaan Sandbox</li>
                  <li>Token Exchange: /api/v1/verification/digilocker/oauth/token</li>
                  <li>Authoritative Pull: Fetches Bhulekh 7/12 & Khasra XML via API Setu</li>
                  <li>Seal: HMAC-SHA256 digest & Merkle Leaf Node appended to Audit Ledger</li>
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
                onClick={handleSimulateOAuthConsent}
                disabled={isOAuthAuthenticating}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4A1504] hover:bg-[#2B1609] text-[#F5E6C8] rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isOAuthAuthenticating ? 'animate-spin' : ''}`} />
                <span>
                  {isOAuthAuthenticating ? 'Exchanging OAuth Tokens...' : 'Grant Consent & Re-Exchange Token'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type DigiLockerOutcome =
  | 'MATCH'
  | 'MISMATCH'
  | 'PENDING'
  | 'UNAVAILABLE'
  | 'MANUAL_REVIEW';

export interface AuthoritativeRecordData {
  deed_number: string;
  survey_number: string;
  registered_owner: string;
  authoritative_acreage?: number;
  registration_date: string;
  encumbrance_status: string;
  zoning_classification: string;
  issuing_authority: string;
  state: string;
  registry_source_url: string;
}

export interface DiscrepancyItem {
  field: string;
  claimed: string | number;
  authoritative: string | number;
  delta: string | number;
  violation: string;
  severity: 'CRITICAL' | 'MAJOR' | 'WARNING';
}

export interface DigiLockerSourceReceipt {
  receipt_id?: string | null;
  outcome: DigiLockerOutcome;
  status_title: string;
  status_description: string;
  registry_code: string;
  registry_name: string;
  authoritative_record?: AuthoritativeRecordData | null;
  claimed_record: {
    institution_id?: string;
    institution_name?: string;
    deed_number?: string;
    survey_number?: string;
    claimed_acreage?: number;
    document_type?: string;
  };
  discrepancy_details?: string | null;
  discrepancies: DiscrepancyItem[];
  oauth_consent_token?: string | null;
  oauth_consent_timestamp?: string | null;
  api_latency_ms?: number | null;
  raw_payload_digest?: string | null;
  hmac_signature?: string | null;
  merkle_leaf_hash?: string | null;
  timestamp?: string | null;
  verification_mode: string;
}

export interface RegistryOption {
  id: string;
  name: string;
  jurisdiction: string;
  state: string;
  category: string;
  endpoint: string;
  sandbox_active: boolean;
  description: string;
}

export interface DigiLockerOAuthTokenState {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  consentArtifactId: string;
  consentTimestamp: string;
  citizenAadhaarLast4: string;
  status: string;
}

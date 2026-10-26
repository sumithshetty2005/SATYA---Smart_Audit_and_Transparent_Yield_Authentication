export interface ProblemStatement {
  id: string;
  title: string;
  domain: string; // 'AI/ML' | 'Smart Education' | 'Cybersecurity' | 'Green Tech' | 'Robotics' | 'Heritage Tech'
  category: string; // 'Hardware' | 'Software' | 'Hybrid'
  sector: string; // 'Government' | 'Industry' | 'Academic'
  urgency: 'Critical' | 'High' | 'Medium';
  difficulty: 'Advanced' | 'Intermediate' | 'Expert';
  grant_amount: string;
  grant_amount_num: number;
  sponsor: string;
  sponsor_logo: string;
  summary: string;
  description: string;
  tech_stack: string[];
  evaluation_criteria: Record<string, number>;
  deliverables: string[];
  days_left: number;
  submissions_count: number;
  simulation_type: 'neural_grid' | 'satellite_radar' | 'quantum_security' | 'green_grid' | 'drone_telemetry' | 'manuscript_ocr';
}

export interface TicketItem {
  ticket_id: string;
  title: string;
  organization_name: string;
  organization_type: string;
  domain: string;
  category: string;
  grant_amount_lakhs: number;
  urgency: string;
  status: string;
  submitted_at: string;
  verification_hash?: string;
  compliance_precheck?: {
    status: string;
    aph_clause: string;
    confidence: number;
  };
}

export interface PlatformStats {
  total_active_statements: number;
  total_grants_allocated_crores: number;
  partner_institutions: number;
  active_submissions: number;
  verification_clearance_rate: string;
  active_tickets_in_queue: number;
}

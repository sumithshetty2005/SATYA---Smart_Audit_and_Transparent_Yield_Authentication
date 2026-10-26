import React from 'react';
import { AlertTriangle, CheckCircle2, FileSearch, Info, ShieldAlert } from 'lucide-react';

export interface PrototypeObservation {
  id: string;
  title: string;
  status: string;
  pages: number[];
  detail: string;
}

export interface PrototypePacketReviewData {
  success: boolean;
  prototype_mode: boolean;
  packet_recognized: boolean;
  file_name: string;
  page_count: number;
  case_id: string | null;
  review_status: string;
  summary: string;
  observations: PrototypeObservation[];
  source_checks?: Record<string, string>;
  rules_assessment?: string;
  checks_performed?: string[];
}

interface Props {
  review: PrototypePacketReviewData;
  onReset: () => void;
}

const statusLabel: Record<string, string> = {
  REVIEW: 'Review difference',
  INCOMPLETE_EVIDENCE: 'Evidence incomplete',
  DATE_EXPIRED_SOURCE_UNVERIFIED: 'Date expired · unverified',
  NOT_VERIFIED: 'Not verified',
  NOT_ASSESSED: 'Not assessed',
  NOT_AVAILABLE: 'Unavailable',
  ADVISORY_ONLY: 'Advisory only',
};

const statusClass: Record<string, string> = {
  REVIEW: 'border-amber-300 bg-amber-50 text-amber-900',
  INCOMPLETE_EVIDENCE: 'border-amber-300 bg-amber-50 text-amber-900',
  DATE_EXPIRED_SOURCE_UNVERIFIED: 'border-rose-300 bg-rose-50 text-rose-900',
  NOT_VERIFIED: 'border-orange-300 bg-orange-50 text-orange-900',
  NOT_ASSESSED: 'border-slate-300 bg-slate-100 text-slate-700',
  NOT_AVAILABLE: 'border-slate-300 bg-slate-100 text-slate-700',
  ADVISORY_ONLY: 'border-blue-300 bg-blue-50 text-blue-900',
};

export const PrototypePacketReview: React.FC<Props> = ({ review, onReset }) => {
  const reviewItems = review.observations.filter((item) => ['REVIEW', 'INCOMPLETE_EVIDENCE', 'DATE_EXPIRED_SOURCE_UNVERIFIED'].includes(item.status)).length;
  const unavailableItems = review.observations.filter((item) => ['NOT_VERIFIED', 'NOT_ASSESSED', 'NOT_AVAILABLE'].includes(item.status)).length;

  return (
    <section className="space-y-5" aria-labelledby="prototype-review-title">
      <div className="rounded-3xl border-2 border-[#D4AF37]/55 bg-[#FFFCF4]/95 shadow-xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#4A1504] via-[#D4AF37] to-[#4A1504]" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-[#F5E6C8]/70 px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#704315] uppercase">
                <FileSearch className="h-3.5 w-3.5" /> Synthetic prototype review
              </div>
              <h2 id="prototype-review-title" className="font-cinzel text-2xl md:text-3xl font-bold text-[#4A1504]">
                {review.packet_recognized ? 'Evidence gaps and differences to review' : 'No fixture findings generated'}
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-[#2B1609]/75">{review.summary}</p>
              <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#64441F]">
                <span className="rounded-md border border-[#D4AF37]/40 bg-white px-2.5 py-1">{review.file_name}</span>
                <span className="rounded-md border border-[#D4AF37]/40 bg-white px-2.5 py-1">{review.page_count} pages inventoried</span>
                {review.case_id && <span className="rounded-md border border-[#D4AF37]/40 bg-white px-2.5 py-1">{review.case_id}</span>}
              </div>
            </div>
            <button type="button" onClick={onReset} className="shrink-0 rounded-xl border border-[#D4AF37]/50 bg-white px-4 py-2 text-xs font-bold text-[#4A1504] hover:bg-[#F5E6C8]">Review another file</button>
          </div>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4"><div className="flex items-center gap-2 text-amber-900"><AlertTriangle className="h-4 w-4" /><span className="text-[10px] font-bold tracking-wider uppercase">Items for review</span></div><p className="mt-2 text-2xl font-bold text-amber-950">{reviewItems}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-700"><ShieldAlert className="h-4 w-4" /><span className="text-[10px] font-bold tracking-wider uppercase">Unavailable checks</span></div><p className="mt-2 text-2xl font-bold text-slate-800">{unavailableItems}</p></div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4"><div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-bold tracking-wider uppercase">Issuer verifications</span></div><p className="mt-2 text-2xl font-bold text-emerald-900">0</p></div>
          </div>

          {review.observations.length > 0 && (
            <div className="mt-6 grid lg:grid-cols-2 gap-3">
              {review.observations.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#D4AF37]/30 bg-white/85 p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm text-[#4A1504]">{item.title}</h3>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass[item.status] ?? 'border-slate-300 bg-slate-100 text-slate-700'}`}>
                      {statusLabel[item.status] ?? item.status.replaceAll('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#2B1609]/75">{item.detail}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-[#8B672A]"><Info className="h-3.5 w-3.5" /> Evidence pages: {item.pages.join(', ')}</div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#4A1504]/15 bg-[#4A1504] p-4 md:p-5 text-[#FFF8E7]">
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#F3D778]">Prototype boundary</p>
            <p className="mt-2 text-xs leading-relaxed text-[#FFF8E7]/85">This demo inventories the uploaded PDF and recognizes one known synthetic test packet. Its observations are fixture-defined, advisory, and linked to packet pages. It does not run a live AICTE rule decision, DigiLocker or registry lookup, payment check, digital-signature verification, scaled CAD measurement, or location verification.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

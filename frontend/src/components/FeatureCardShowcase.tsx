import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Eye, FileText, Fingerprint, Network, ShieldCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stages = [
  { title: 'Read the document', tag: '01 · DOCUMENT INTAKE', text: 'Extract structured fields and layout signals from institutional applications and their supporting records.', icon: FileText, cue: 'APPLICATION → EVIDENCE' },
  { title: 'Inspect for alterations', tag: '02 · VISUAL FORENSICS', text: 'Surface image inconsistencies and suspicious edits for a reviewer to examine alongside the source page.', icon: Fingerprint, cue: 'IMAGE → FORENSIC SIGNALS' },
  { title: 'Check the source', tag: '03 · SOURCE REVIEW', text: 'Review available signatures, QR references, and provenance signals. Unavailable issuer connections stay clearly marked.', icon: Database, cue: 'CLAIM → SOURCE RECORD' },
  { title: 'Map the applicable rules', tag: '04 · APH RULE MAPPING', text: 'Connect extracted application facts to relevant Approval Process Handbook requirements and citations.', icon: Network, cue: 'EVIDENCE → APH CLAUSE' },
  { title: 'Review infrastructure', tag: '05 · FACILITY EVIDENCE', text: 'Bring spatial and visual evidence into view to help officials assess facilities and declared resources.', icon: Eye, cue: 'PLAN → REVIEW SIGNAL' },
  { title: 'Prepare a traceable report', tag: '06 · REVIEW SUMMARY', text: 'Gather findings, evidence references, and follow-up actions into one clear review trail for human decision-making.', icon: ShieldCheck, cue: 'FINDINGS → OFFICIAL REVIEW' },
];

export function FeatureCardShowcase() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const deck = cardsRef.current;
    const cards = deck ? Array.from(deck.querySelectorAll<HTMLElement>('[data-feature-card]')) : [];
    const progressDots = progressRef.current ? Array.from(progressRef.current.querySelectorAll<HTMLElement>('[data-feature-dot]')) : [];
    if (!stage || cards.length !== stages.length) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compact = window.matchMedia('(max-width: 767px)').matches;
    if (reduceMotion || compact) {
      if (deck) {
        deck.style.position = 'relative';
        deck.style.inset = 'auto';
        deck.style.height = 'auto';
        deck.style.transform = 'none';
        deck.style.display = 'grid';
        deck.style.gap = '1rem';
      }
      cards.forEach((card) => {
        card.style.position = 'relative';
        card.style.left = 'auto';
        card.style.top = 'auto';
        card.style.width = '100%';
        card.style.height = 'auto';
        card.style.minHeight = '330px';
        card.style.transform = 'none';
        card.style.opacity = '1';
        card.style.visibility = 'visible';
      });
      return;
    }

    const context = gsap.context(() => {
      const cardOffset = () => Math.min(stage.clientWidth * 0.37, 390);
      const updateProgress = (active: number) => {
        if (counterRef.current) counterRef.current.textContent = `${String(active + 1).padStart(2, '0')} / ${String(stages.length).padStart(2, '0')}`;
        progressDots.forEach((dot, index) => gsap.to(dot, { width: index === active ? 32 : 12, backgroundColor: index === active ? '#D4AF37' : 'rgba(251,244,230,.3)', duration: 0.25, overwrite: true }));
      };
      const setDeck = (active: number) => {
        cards.forEach((card, index) => {
          const distance = index - active;
          const visible = Math.abs(distance) <= 2;
          gsap.set(card, {
            x: distance * cardOffset(),
            y: Math.abs(distance) * 12,
            rotation: distance * 7,
            scale: 1 - Math.min(Math.abs(distance), 3) * 0.085,
            opacity: visible ? 1 - Math.abs(distance) * 0.18 : 0,
            zIndex: 10 - Math.abs(distance),
            visibility: visible ? 'visible' : 'hidden',
          });
        });
        updateProgress(active);
      };

      setDeck(0);
      const timeline = gsap.timeline({
        defaults: { duration: 1, ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top+=110',
          end: `+=${stages.length * Math.max(window.innerHeight * 0.62, 430)}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      stages.slice(1).forEach((_, step) => {
        const active = step + 1;
        timeline.add(() => {
          updateProgress(active);
        });
        timeline.to(cards, {
          x: (index) => (index - active) * cardOffset(),
          y: (index) => Math.abs(index - active) * 12,
          rotation: (index) => (index - active) * 7,
          scale: (index) => 1 - Math.min(Math.abs(index - active), 3) * 0.085,
          opacity: (index) => Math.abs(index - active) <= 2 ? 1 - Math.abs(index - active) * 0.18 : 0,
          onStart: () => {
            cards.forEach((card, index) => {
              const visible = Math.abs(index - active) <= 2;
              gsap.set(card, { zIndex: 10 - Math.abs(index - active), visibility: visible ? 'visible' : 'hidden' });
            });
          },
          onReverseComplete: () => {
            cards.forEach((card, index) => {
              const previous = active - 1;
              const visible = Math.abs(index - previous) <= 2;
              gsap.set(card, { zIndex: 10 - Math.abs(index - previous), visibility: visible ? 'visible' : 'hidden' });
            });
            updateProgress(active - 1);
          },
        });
      });
    }, stage);

    return () => context.revert();
  }, []);

  return (
    <div
      ref={stageRef}
      className="satya-feature-stage relative min-h-[590px] overflow-hidden border border-[#D4AF37]/45 bg-[#2B1609] px-4 py-7 text-[#FBF4E6] shadow-[0_24px_60px_rgba(43,22,9,.2)] sm:px-8 md:h-[min(70vh,680px)] md:min-h-[560px] md:px-12 md:py-10"
      aria-label="SATYA review workflow feature cards"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,.18),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,.07)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative z-20 flex items-center justify-between border-b border-[#D4AF37]/30 pb-4">
        <div><p className="text-[9px] font-bold tracking-[0.24em] text-[#D4AF37]">THE SATYA REVIEW PATH</p><p className="mt-1 text-xs text-[#FBF4E6]/70">Scroll to follow a filing through each review stage</p></div>
        <span ref={counterRef} className="font-mono text-xs tracking-widest text-[#F3D77B]">01 / 06</span>
      </div>

      <div ref={cardsRef} className="satya-feature-deck relative z-10 mx-auto mt-6 h-[430px] w-full md:mt-0 md:absolute md:inset-x-0 md:top-1/2 md:h-[390px] md:-translate-y-1/2">
        {stages.map((item, index) => {
          const Icon = item.icon;
          return (
            <article
              key={item.tag}
              data-feature-card
              className="satya-feature-deck-card absolute left-1/2 top-1/2 flex h-[400px] w-[min(100%,520px)] -translate-x-1/2 -translate-y-1/2 flex-col justify-between overflow-hidden border border-[#D4AF37]/60 bg-[#F8F1E5] p-5 text-[#2B1609] shadow-[0_22px_55px_rgba(0,0,0,.35)] sm:p-8 md:h-[360px] md:p-9"
              style={{ visibility: index < 3 ? 'visible' : 'hidden' }}
            >
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#C59B27]/25 shadow-[0_0_0_22px_rgba(197,155,39,.05),0_0_0_44px_rgba(197,155,39,.04)]" aria-hidden="true" />
              <div className="relative flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center bg-[#4A1504] text-[#D4AF37]"><Icon className="h-6 w-6" strokeWidth={1.7} /></span>
                <span className="font-cinzel text-5xl font-bold leading-none text-[#D4AF37]/70">{String(index + 1).padStart(2, '0')}.</span>
              </div>
              <div className="relative max-w-sm">
                <p className="text-[9px] font-bold tracking-[0.22em] text-[#9A752E]">{item.tag}</p>
                <h3 className="mt-3 font-cinzel text-2xl font-bold leading-tight text-[#4A1504] sm:text-3xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#2B1609]/75">{item.text}</p>
              </div>
              <div className="relative flex items-center justify-between border-t border-[#C59B27]/30 pt-3 font-mono text-[9px] tracking-[0.12em] text-[#76551D]">
                <span>SATYA · EVIDENCE-LED REVIEW</span><span>{item.cue}</span>
              </div>
            </article>
          );
        })}
      </div>
      <div ref={progressRef} className="relative z-20 mt-3 flex justify-center gap-1.5 md:absolute md:bottom-5 md:left-0 md:right-0 md:mt-0" aria-hidden="true">
        {stages.map((item, index) => <span key={item.tag} data-feature-dot className={`h-1 rounded-full ${index === 0 ? 'w-8 bg-[#D4AF37]' : 'w-3 bg-[#FBF4E6]/30'}`} />)}
      </div>
    </div>
  );
}

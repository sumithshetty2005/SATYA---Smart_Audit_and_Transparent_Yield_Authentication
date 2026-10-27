import React, { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  alpha: number;
};

const phrases = ['DOCUMENT', 'EVIDENCE', 'APH REVIEW'];
const PARTICLE_COUNT = 760;
const PHRASE_DURATION = 4600;
const BURST_DURATION = 850;

export const AuditSignalAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offscreen = document.createElement('canvas');
    const maskContext = offscreen.getContext('2d', { willReadFrequently: true });
    if (!maskContext) return;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let startedAt = 0;
    let activeStage = '';
    let pointerX = -1000;
    let pointerY = -1000;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
      size: 0.7 + Math.random() * 1.4,
      alpha: 0.42 + Math.random() * 0.58,
    }));

    const setTargets = (stage: string) => {
      activeStage = stage;
      if (stage === 'burst') {
        particles.forEach((particle) => {
          particle.tx = Math.random() * width;
          particle.ty = Math.random() * height;
        });
        return;
      }

      maskContext.clearRect(0, 0, width, height);
      const phrase = phrases[Number(stage)];
      const fontSize = Math.min(width / (phrase.length * 0.66), height * 0.48, 78);
      maskContext.font = `700 ${fontSize}px Georgia, 'Times New Roman', serif`;
      maskContext.textAlign = 'center';
      maskContext.textBaseline = 'middle';
      maskContext.fillStyle = '#fff';
      maskContext.fillText(phrase, width / 2, height / 2, width * 0.88);

      const pixels = maskContext.getImageData(0, 0, width, height).data;
      const points: Array<[number, number]> = [];
      const stride = Math.max(3, Math.floor(Math.min(width, height) / 82));
      for (let y = 0; y < height; y += stride) {
        for (let x = 0; x < width; x += stride) {
          if (pixels[(y * width + x) * 4 + 3] > 100) points.push([x, y]);
        }
      }

      particles.forEach((particle, index) => {
        const point = points[(index * 7) % points.length] ?? [width / 2, height / 2];
        particle.tx = point[0] + (Math.random() - 0.5) * stride * 0.7;
        particle.ty = point[1] + (Math.random() - 0.5) * stride * 0.7;
      });
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(bounds.width * dpr));
      height = Math.max(1, Math.round(bounds.height * dpr));
      canvas.width = width;
      canvas.height = height;
      offscreen.width = width;
      offscreen.height = height;
      particles.forEach((particle) => {
        particle.x = width / 2 + (Math.random() - 0.5) * width * 0.6;
        particle.y = height / 2 + (Math.random() - 0.5) * height * 0.5;
      });
      activeStage = '';
      setTargets('0');
    };

    const draw = (now: number) => {
      if (!startedAt) startedAt = now;
      const elapsed = reducedMotion ? 0 : now - startedAt;
      const cycleDuration = PHRASE_DURATION + BURST_DURATION;
      const cyclePosition = elapsed % cycleDuration;
      const phraseIndex = reducedMotion ? 0 : Math.floor(elapsed / cycleDuration) % phrases.length;
      const stage = !reducedMotion && cyclePosition >= PHRASE_DURATION ? 'burst' : String(phraseIndex);
      if (stage !== activeStage) setTargets(stage);

      context.clearRect(0, 0, width, height);
      context.fillStyle = '#1B100C';
      context.fillRect(0, 0, width, height);

      const pointerScale = Math.min(window.devicePixelRatio || 1, 2);
      particles.forEach((particle) => {
        const dx = particle.tx - particle.x;
        const dy = particle.ty - particle.y;
        particle.vx = (particle.vx + dx * 0.026) * 0.82;
        particle.vy = (particle.vy + dy * 0.026) * 0.82;

        const px = pointerX * pointerScale;
        const py = pointerY * pointerScale;
        const awayX = particle.x - px;
        const awayY = particle.y - py;
        const distance = Math.hypot(awayX, awayY);
        if (distance < 85 * pointerScale && distance > 0) {
          const force = (1 - distance / (85 * pointerScale)) * 1.8;
          particle.vx += (awayX / distance) * force;
          particle.vy += (awayY / distance) * force;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;
        const shimmer = 0.76 + Math.sin(now * 0.002 + particle.x * 0.02) * 0.24;
        context.beginPath();
        context.fillStyle = `rgba(225, 190, 111, ${particle.alpha * shimmer})`;
        context.arc(particle.x, particle.y, particle.size * pointerScale, 0, Math.PI * 2);
        context.fill();
      });

      if (!reducedMotion) frameId = window.requestAnimationFrame(draw);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
    };
    const clearPointer = () => { pointerX = -1000; pointerY = -1000; };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerleave', clearPointer);
    resize();
    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', clearPointer);
    };
  }, []);

  return (
    <section aria-labelledby="signal-story-title" className="overflow-hidden rounded-2xl border border-[#D4AF37]/45 bg-[#1B100C] shadow-xl">
      <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
        <div className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">A transparent review journey</p>
          <h2 id="signal-story-title" className="mt-2 font-cinzel text-2xl font-bold leading-tight text-[#FAF4E8] sm:text-3xl">
            From a claim to a traceable review.
          </h2>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-[#F5E6C8]/75 sm:text-sm">
            SATYA connects extracted document details with visual checks and relevant handbook rules, so reviewers can see what supports each finding.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-bold tracking-[0.12em] text-[#F5E6C8]/80">
            {['DOCUMENT', 'EVIDENCE', 'APH REVIEW'].map((step, index) => (
              <React.Fragment key={step}>
                <span className="rounded-full border border-[#D4AF37]/35 px-3 py-1.5">{step}</span>
                {index < 2 && <span aria-hidden="true" className="self-center text-[#D4AF37]">→</span>}
              </React.Fragment>
            ))}
          </div>
          <a href="/audit.html" className="mt-6 inline-flex w-fit items-center gap-2 border-b border-[#D4AF37]/60 pb-1 text-xs font-semibold text-[#F3D778] transition-colors hover:text-white">
            Explore the audit workspace <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="relative min-h-[210px] border-t border-[#D4AF37]/20 lg:min-h-[270px] lg:border-l lg:border-t-0">
          <canvas
            ref={canvasRef}
            aria-label="Animated particles form the words Document, Evidence, and APH Review"
            className="absolute inset-0 h-full w-full touch-pan-y"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center px-4 text-center">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#F3D778] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
              Each signal adds context. A person makes the decision.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

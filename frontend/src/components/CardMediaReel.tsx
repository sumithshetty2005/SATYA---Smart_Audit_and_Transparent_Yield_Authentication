import React, { useEffect, useRef } from 'react';

interface CardMediaReelProps {
  simulationType: 'neural_grid' | 'satellite_radar' | 'quantum_security' | 'green_grid' | 'drone_telemetry' | 'manuscript_ocr';
  isHovered: boolean;
}

export const CardMediaReel: React.FC<CardMediaReelProps> = ({ simulationType, isHovered }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += isHovered ? 0.05 : 0.015;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#2B1609');
      bgGrad.addColorStop(1, '#4A1504');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (simulationType === 'manuscript_ocr') {
        // Ancient Palm-Leaf Manuscript OCR Scanner Simulation
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        // Manuscript horizontal lines
        for (let y = 20; y < h; y += 18) {
          ctx.beginPath();
          ctx.moveTo(15, y);
          ctx.lineTo(w - 15, y);
          ctx.stroke();
        }

        // Ancient Brahmi / Devanagari glyph representations
        const glyphs = ['अ', 'क', 'ग', 'च', 'त', 'प', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', '०', '१', '२', '३', '४'];
        ctx.font = '12px "Rozha One", serif';
        ctx.fillStyle = '#D4AF37';
        for (let i = 0; i < 18; i++) {
          const gx = 25 + (i % 6) * 42;
          const gy = 32 + Math.floor(i / 6) * 36;
          ctx.fillText(glyphs[(i + Math.floor(t)) % glyphs.length], gx, gy);
        }

        // Moving Laser Scan Line
        const scanY = ((t * 40) % (h + 30)) - 15;
        const scanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        scanGrad.addColorStop(0, 'rgba(212, 175, 55, 0)');
        scanGrad.addColorStop(0.5, 'rgba(255, 230, 140, 0.85)');
        scanGrad.addColorStop(1, 'rgba(212, 175, 55, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(10, scanY - 6, w - 20, 12);

        // Bounding boxes
        if (isHovered) {
          ctx.strokeStyle = '#38EF7D';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(30, 20, 50, 24);
          ctx.strokeRect(120, 56, 60, 24);
          ctx.fillStyle = '#38EF7D';
          ctx.font = '9px monospace';
          ctx.fillText('OCR 99.4%', 32, 16);
        }
      } else if (simulationType === 'drone_telemetry') {
        // Autonomous Drone Swarm & Terrain Telemetry
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
        ctx.lineWidth = 1;
        // Grid wireframe
        for (let x = 0; x < w; x += 25) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Swarm Drones
        const drones = [
          { x: w * 0.3 + Math.sin(t) * 25, y: h * 0.4 + Math.cos(t * 0.8) * 15, id: 'UAV-01' },
          { x: w * 0.7 + Math.cos(t * 0.9) * 20, y: h * 0.35 + Math.sin(t) * 12, id: 'UAV-02' },
          { x: w * 0.5 + Math.sin(t * 1.2) * 18, y: h * 0.7 + Math.cos(t * 0.7) * 15, id: 'UAV-03' },
        ];

        // Ad-hoc mesh links
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(drones[0].x, drones[0].y);
        ctx.lineTo(drones[1].x, drones[1].y);
        ctx.lineTo(drones[2].x, drones[2].y);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Render drones
        drones.forEach((d) => {
          // Thermal radar cone
          const coneGrad = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 35);
          coneGrad.addColorStop(0, 'rgba(255, 99, 71, 0.4)');
          coneGrad.addColorStop(1, 'rgba(255, 99, 71, 0)');
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 35, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFF3B0';
          ctx.beginPath();
          ctx.arc(d.x, d.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#D4AF37';
          ctx.font = '8px monospace';
          ctx.fillText(d.id, d.x + 6, d.y - 4);
        });
      } else if (simulationType === 'quantum_security') {
        // Post-Quantum Lattice & Zero-Knowledge Verification
        const cols = 7;
        const rows = 4;
        const dx = w / (cols + 1);
        const dy = h / (rows + 1);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = dx * (c + 1);
            const py = dy * (r + 1);
            const pulse = Math.sin(t * 2 + r * 1.5 + c * 0.8);

            ctx.strokeStyle = `rgba(212, 175, 55, ${0.2 + (pulse + 1) * 0.25})`;
            ctx.strokeRect(px - 10, py - 10, 20, 20);

            if (isHovered && (r + c) % 3 === 0) {
              ctx.fillStyle = '#38EF7D';
              ctx.font = '8px monospace';
              ctx.fillText('zk-OK', px - 8, py + 3);
            }
          }
        }

        // Dilithium signature hash stream
        ctx.fillStyle = '#D4AF37';
        ctx.font = '9px monospace';
        const hex = '0x8F9B2C4E1A90F...ML-DSA-65';
        ctx.fillText(hex, 15, h - 12);
      } else if (simulationType === 'satellite_radar') {
        // SAR Soil Moisture Sweep
        const cx = w / 2;
        const cy = h / 2;

        // Concentric radar ranges
        for (let r = 20; r <= 60; r += 20) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Rotating radar line
        const angle = t * 1.5;
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 75, cy + Math.sin(angle) * 75);
        ctx.stroke();

        // Target hits
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(cx + 35, cy - 20, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF3B0';
        ctx.font = '8px monospace';
        ctx.fillText('Moisture 28%', cx + 42, cy - 18);
      } else if (simulationType === 'neural_grid') {
        // Neuro-Symbolic Agent Network
        const layers = [3, 4, 3];
        const layerX = [w * 0.2, w * 0.5, w * 0.8];

        for (let l = 0; l < layers.length - 1; l++) {
          const count1 = layers[l];
          const count2 = layers[l + 1];
          for (let i = 0; i < count1; i++) {
            const y1 = (h / (count1 + 1)) * (i + 1);
            for (let j = 0; j < count2; j++) {
              const y2 = (h / (count2 + 1)) * (j + 1);
              const signal = Math.sin(t * 3 + i + j);
              ctx.strokeStyle = `rgba(212, 175, 55, ${signal > 0.3 ? 0.8 : 0.15})`;
              ctx.lineWidth = signal > 0.3 ? 1.5 : 0.8;
              ctx.beginPath();
              ctx.moveTo(layerX[l], y1);
              ctx.lineTo(layerX[l + 1], y2);
              ctx.stroke();
            }
          }
        }

        layers.forEach((cnt, lIdx) => {
          for (let i = 0; i < cnt; i++) {
            const y = (h / (cnt + 1)) * (i + 1);
            ctx.fillStyle = '#4A1504';
            ctx.strokeStyle = '#D4AF37';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(layerX[lIdx], y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        });
      } else {
        // Green Grid Micro-Controller
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.fillStyle = '#81C784';
        ctx.font = '10px monospace';
        ctx.fillText('⚡ SMART MICROGRID', 30, 36);
        ctx.fillText(`PV: ${(24 + Math.sin(t) * 3).toFixed(1)} kW`, 30, 60);
        ctx.fillText(`BAT: 89% [RL AUTO]`, 30, 80);
        ctx.fillText(`FREQ: 50.02 Hz`, 30, 100);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [simulationType, isHovered]);

  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#D4AF37]/40 shadow-inner group-hover:border-[#D4AF37] transition-all">
      <canvas ref={canvasRef} width={340} height={128} className="w-full h-full object-cover" />
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/50 text-[9px] font-mono font-bold text-[#FFF3B0] flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${isHovered ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
        <span>{isHovered ? 'LIVE SIMULATION' : 'REAL-WORLD REEL'}</span>
      </div>
    </div>
  );
};

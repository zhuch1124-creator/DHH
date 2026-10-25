import React, { useEffect, useRef } from 'react';
import { CandlelightSettings } from '../types/dunhuang';

interface CandlelightOverlayProps {
  settings: CandlelightSettings;
  width?: number;
  height?: number;
  isCaveExploring?: boolean; // True for S01-S03, where reality is darker
  onPositionChange?: (pos: { x: number; y: number }) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
}

export const CandlelightOverlay: React.FC<CandlelightOverlayProps> = ({
  settings,
  isCaveExploring = false,
  onPositionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 300, y: 200 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 300, y: 200 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Initialize dust motes inside the beam
  useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 36; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 450,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.3, // gently drifting upward like warm air
        size: 0.8 + Math.random() * 2.0,
        alpha: 0.2 + Math.random() * 0.5,
        baseAlpha: 0.2 + Math.random() * 0.5,
      });
    }
    particlesRef.current = particles;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!settings.enabled || settings.mode !== 'cursor') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    targetPosRef.current = { x, y };
    onPositionChange?.({ x, y });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      timeRef.current += 0.03;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, w, h);

      if (!settings.enabled) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Smooth lag interpolation for natural lantern sway
      const t = timeRef.current;
      const target = targetPosRef.current;
      const cur = currentPosRef.current;

      if (settings.mode === 'ambient') {
        // Natural gentle cave patrol sway
        target.x = w * 0.5 + Math.sin(t * 0.4) * (w * 0.28);
        target.y = h * 0.5 + Math.cos(t * 0.6) * (h * 0.22);
      } else if (settings.mode === 'spotlight') {
        target.x = w * 0.5;
        target.y = h * 0.5;
      }

      cur.x += (target.x - cur.x) * 0.12;
      cur.y += (target.y - cur.y) * 0.12;

      // Calculate dynamic candle flicker
      let flicker = 1.0;
      if (settings.flickerSpeed === 'flickering') {
        flicker = 1.0 + Math.sin(t * 12) * 0.08 + Math.sin(t * 23) * 0.05 + (Math.random() - 0.5) * 0.04;
      } else if (settings.flickerSpeed === 'natural') {
        flicker = 1.0 + Math.sin(t * 4) * 0.05 + Math.sin(t * 7.5) * 0.03;
      } else if (settings.flickerSpeed === 'soft') {
        flicker = 1.0 + Math.sin(t * 1.8) * 0.02;
      }

      const radius = settings.radius * flicker;
      const intensity = settings.intensity;

      // In S01-S03, outer darkness is slightly heavier for cave atmosphere;
      // In S05-S08, outer shadow is soft and museum-calibrated
      const outerDarkness = isCaveExploring ? 0.72 : 0.55;

      // Draw overall cave shadow mask
      ctx.save();
      ctx.fillStyle = `rgba(18, 14, 12, ${outerDarkness})`;
      ctx.fillRect(0, 0, w, h);

      // Cut out illuminated warm circle using 'destination-out' and 'source-over' blending
      ctx.globalCompositeOperation = 'destination-out';

      const cutGrad = ctx.createRadialGradient(
        cur.x, cur.y, radius * 0.08,
        cur.x, cur.y, radius
      );
      cutGrad.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1.0, intensity * 1.3)})`);
      cutGrad.addColorStop(0.35, `rgba(0, 0, 0, ${intensity * 0.95})`);
      cutGrad.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.5})`);
      cutGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = cutGrad;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // In dual lantern mode, cut out second trailing light
      if (settings.mode === 'dual') {
        const x2 = cur.x + Math.sin(t * 0.9) * 160;
        const y2 = cur.y + Math.cos(t * 0.7) * 90;
        const cutGrad2 = ctx.createRadialGradient(x2, y2, radius * 0.05, x2, y2, radius * 0.75);
        cutGrad2.addColorStop(0, `rgba(0, 0, 0, ${intensity * 0.8})`);
        cutGrad2.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.4})`);
        cutGrad2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cutGrad2;
        ctx.beginPath();
        ctx.arc(x2, y2, radius * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Overlay warm tallow amber glow onto the illuminated patch
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const warmGrad = ctx.createRadialGradient(
        cur.x, cur.y, 0,
        cur.x, cur.y, radius * 1.15
      );

      if (settings.colorTemperature === 'clay_gold') {
        warmGrad.addColorStop(0, `rgba(255, 215, 140, ${0.45 * intensity})`);
        warmGrad.addColorStop(0.3, `rgba(220, 140, 50, ${0.22 * intensity})`);
        warmGrad.addColorStop(0.7, `rgba(160, 80, 25, ${0.08 * intensity})`);
      } else if (settings.colorTemperature === 'tallow_white') {
        warmGrad.addColorStop(0, `rgba(255, 248, 220, ${0.4 * intensity})`);
        warmGrad.addColorStop(0.3, `rgba(230, 190, 120, ${0.18 * intensity})`);
        warmGrad.addColorStop(0.7, `rgba(140, 95, 45, ${0.05 * intensity})`);
      } else {
        // warm_amber (default)
        warmGrad.addColorStop(0, `rgba(255, 225, 160, ${0.48 * intensity})`);
        warmGrad.addColorStop(0.28, `rgba(235, 150, 45, ${0.25 * intensity})`);
        warmGrad.addColorStop(0.65, `rgba(180, 75, 20, ${0.09 * intensity})`);
      }
      warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = warmGrad;
      ctx.beginPath();
      ctx.arc(cur.x, cur.y, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Render floating golden dust particles inside illuminated beam
      if (settings.dustMotes) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        particlesRef.current.forEach((p) => {
          // move
          p.x += p.vx + Math.sin(t + p.y * 0.01) * 0.15;
          p.y += p.vy;
          if (p.y < 0) p.y = h;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;

          // distance to flame
          const dx = p.x - cur.x;
          const dy = p.y - cur.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius) {
            const proximity = 1.0 - dist / radius;
            const alpha = p.baseAlpha * proximity * intensity * flicker;
            ctx.fillStyle = `rgba(255, 225, 160, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
      }

      // If revealTexture is enabled, draw subtle mineral pigment flecks near candle center
      if (settings.revealTexture) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const numFlecks = 12;
        for (let i = 0; i < numFlecks; i++) {
          const angle = (i / numFlecks) * Math.PI * 2 + t * 0.2;
          const r = (radius * 0.2) + Math.sin(t * 2 + i) * (radius * 0.35);
          const fx = cur.x + Math.cos(angle) * r;
          const fy = cur.y + Math.sin(angle) * r;
          const fleckAlpha = 0.15 + Math.sin(t * 3 + i) * 0.1;
          ctx.fillStyle = `rgba(255, 230, 180, ${fleckAlpha * intensity})`;
          ctx.beginPath();
          ctx.arc(fx, fy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw subtle warm flame core indicator
      if (settings.mode === 'cursor') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        // Tiny amber flame core
        const coreGrad = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, 14);
        coreGrad.addColorStop(0, 'rgba(255, 255, 230, 0.9)');
        coreGrad.addColorStop(0.3, 'rgba(255, 190, 80, 0.7)');
        coreGrad.addColorStop(1, 'rgba(220, 80, 20, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    // Resize canvas to match display size
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          canvas.width = width;
          canvas.height = height;
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [settings, isCaveExploring]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className={`absolute inset-0 z-20 overflow-hidden select-none ${
        settings.enabled ? 'cursor-crosshair' : 'pointer-events-none'
      }`}
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};

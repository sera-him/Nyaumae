import { useEffect, useRef } from 'react';
import { useMotionActivity } from '@/hooks/useMotionActivity';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  text?: string;
  life: number;
}

interface ParticleFieldProps {
  type: 'symbols' | 'dream' | 'stars' | 'math' | 'rising';
  density?: number;
  className?: string;
  markLoop?: boolean;
}

const COLORS: Record<string, string[]> = {
  symbols: ['#8B5CF6', '#00E5CC', '#F472B6', '#A78BFA', '#5EEAD4'],
  dream: ['#F9A8D4', '#F472B6', '#FDA4AF', '#FB7185', '#E879F9'],
  stars: ['#FFFFFF', '#E0D5F0', '#C4B5FD', '#A78BFA'],
  math: ['#F59E0B', '#FBBF24', '#FFFFFF', '#8B5CF6'],
  rising: ['#8B5CF6', '#00E5CC', '#F472B6'],
};

const SYMBOLS = [
  '∫', '∑', '∞', '∆', '∂', 'π', '√', '≈', '∴', '∵',
  'λ', 'ω', 'θ', 'α', 'β', 'γ', 'φ', 'ψ', 'ρ', 'σ',
  '3', '1', '4', '1', '5', '9', '2', '6', '5', '3',
  '⌊', '⌋', '⌈', '⌉', '×', '÷', '±', '∓', '≤', '≥',
];

const MATH_SYMBOLS = ['0', '1', '∞', '∑', '∫', 'π', 'e', '√', 'ln', 'dx', 'dy', '∆', '∀', '∃', '∈', '⊂'];

export default function ParticleField({ type, density = 30, className = '', markLoop = true }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const destroyedRef = useRef(false);
  const { ref: containerRef, isMotionActive, motionProfile } = useMotionActivity<HTMLDivElement>(
    '160px 0px',
    { cost: 'high', priority: 10 },
  );

  useEffect(() => {
    if (!isMotionActive) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    destroyedRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, motionProfile.pixelRatioCap);
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      if (destroyedRef.current) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        cssW = rect.width;
        cssH = rect.height;
        canvas.width = cssW * dpr;
        canvas.height = cssH * dpr;
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const colors = COLORS[type];
    const boost = motionProfile.mobile ? 0.85 : 1;
    const particleCount = Math.max(6, Math.round(density * motionProfile.particleScale));

    const createParticleNow = (isReset = false): Particle => {
      return createParticle(type, cssW, cssH, colors, boost, isReset);
    };

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticleNow());
    }

    const animate = () => {
      if (destroyedRef.current) return;
      ctx.clearRect(0, 0, cssW, cssH);

      for (const p of particles) {
        p.life++;

        if (type === 'rising') {
          p.y -= p.vy;
          if (p.y < -20) {
            Object.assign(p, createParticleNow(true));
            p.y = cssH + 20;
          }
        } else if (type === 'dream') {
          p.y -= p.vy;
          p.x += Math.sin(p.life * 0.02) * 0.3;
          if (p.y < -30) {
            Object.assign(p, createParticleNow(true));
            p.y = cssH + 30;
          }
        } else if (type === 'symbols') {
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.life * 0.01) * 0.2;
          if (p.y > cssH + 30) {
            Object.assign(p, createParticleNow(true));
            p.y = -30;
          }
        } else if (type === 'math') {
          p.y -= p.vy;
          p.x += Math.sin(p.life * 0.015) * 0.2;
          if (p.y < -40) {
            Object.assign(p, createParticleNow(true));
            p.y = cssH + 40;
          }
        } else if (type === 'stars') {
          p.opacity = (0.1 + Math.abs(Math.sin(p.life * 0.05 + p.x)) * 0.3) * boost;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = cssW + 10;
          if (p.x > cssW + 10) p.x = -10;
          if (p.y < -10) p.y = cssH + 10;
          if (p.y > cssH + 10) p.y = -10;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity));
        if (p.text) {
          ctx.font = `${p.size}px monospace`;
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      destroyedRef.current = true;
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [type, density, isMotionActive, motionProfile.mobile, motionProfile.particleScale, motionProfile.pixelRatioCap]);

  return (
    <div
      ref={containerRef}
      className="motion-atmosphere-surface relative w-full h-full"
      data-motion-kind="ambient"
      data-motion-loop={markLoop ? true : undefined}
      data-motion-running={isMotionActive ? 'true' : 'false'}
      data-motion-static={motionProfile.quality === 'static' || motionProfile.reducedMotion ? 'true' : 'false'}
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        style={{ opacity: type === 'stars' ? 0.7 : 0.35 }}
      />
    </div>
  );
}

function createParticle(
  type: string,
  w: number,
  h: number,
  colors: string[],
  boost = 1.0,
  isReset = false
): Particle {
  const color = colors[Math.floor(Math.random() * colors.length)];

  if (type === 'symbols') {
    return {
      x: Math.random() * w,
      y: isReset ? -20 : (-20 - Math.random() * 200),
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.3 + Math.random() * 0.5,
      size: (12 + Math.random() * 14) * boost,
      opacity: (0.2 + Math.random() * 0.3) * boost,
      color,
      text: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      life: Math.floor(Math.random() * 100),
    };
  }

  if (type === 'dream') {
    return {
      x: Math.random() * w,
      y: isReset ? h + 20 : (h + 20 + Math.random() * 100),
      vx: 0,
      vy: 0.2 + Math.random() * 0.4,
      size: (2 + Math.random() * 4) * boost,
      opacity: (0.25 + Math.random() * 0.35) * boost,
      color,
      life: Math.floor(Math.random() * 100),
    };
  }

  if (type === 'stars') {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      size: (1 + Math.random() * 2.5) * boost,
      opacity: (0.15 + Math.random() * 0.4) * boost,
      color,
      life: Math.floor(Math.random() * 200),
    };
  }

  if (type === 'math') {
    return {
      x: Math.random() * w,
      y: isReset ? h + 30 : (h + 30 + Math.random() * 150),
      vx: 0,
      vy: 0.15 + Math.random() * 0.35,
      size: (10 + Math.random() * 12) * boost,
      opacity: (0.2 + Math.random() * 0.3) * boost,
      color,
      text: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      life: Math.floor(Math.random() * 100),
    };
  }

  return {
    x: Math.random() * w,
    y: isReset ? h + 10 : (h + 10 + Math.random() * 50),
    vx: 0,
    vy: 0.1 + Math.random() * 0.3,
    size: (1 + Math.random() * 2) * boost,
    opacity: (0.15 + Math.random() * 0.25) * boost,
    color,
    life: Math.floor(Math.random() * 100),
  };
}

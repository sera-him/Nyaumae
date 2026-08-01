import { useEffect, useRef, useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useOverload } from '@/contexts/OverloadContext';
import { getRandomOverloadColor } from '@/lib/semanticHighlight';
import { useMotionActivity } from '@/hooks/useMotionActivity';

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = '' }: GlitchTextProps) {
  const { active } = useOverload();
  const [display, setDisplay] = useState(text);
  const [colorClass, setColorClass] = useState('');
  const intervalRef = useRef<number>(0);
  const colorIntervalRef = useRef<number>(0);
  const { ref: motionRef, isMotionActive } = useMotionActivity<HTMLSpanElement>();

  useEffect(() => {
    if (!active || !isMotionActive) {
      setDisplay(text);
      setColorClass('');
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (colorIntervalRef.current) clearInterval(colorIntervalRef.current);
      return;
    }

    // Random color cycling every 300ms
    colorIntervalRef.current = window.setInterval(() => {
      setColorClass(getRandomOverloadColor());
    }, 300);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?ΦΩ∆∞';
    let counter = 0;

    intervalRef.current = window.setInterval(() => {
      counter++;
      if (counter % 6 === 0) {
        const glitched = text.split('').map((c) => {
          if (c === ' ' || c === '、' || c === '。') return c;
          if (Math.random() < 0.3) return chars[Math.floor(Math.random() * chars.length)];
          return c;
        }).join('');
        setDisplay(glitched);
      } else if (counter % 3 === 0) {
        setDisplay(text);
      }
    }, 80);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(colorIntervalRef.current);
    };
  }, [text, active, isMotionActive]);

  return (
    <span ref={motionRef} className={`inline-block transition-opacity ${active ? `font-bold ${colorClass}` : ''} ${className}`}>
      {display}
    </span>
  );
}

// Overload Canvas Effect
export function OverloadCanvas() {
  const { active } = useOverload();
  const { ref: canvasRef, isMotionActive } = useMotionActivity<HTMLCanvasElement>();
  const animRef = useRef<number>(0);
  const destroyedRef = useRef(false);

  useEffect(() => {
    if (!active || !isMotionActive) return;
    destroyedRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (destroyedRef.current) return;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const words = [
      '信息', '过载', '系统', '崩溃', '数据', '噪音', 'ERROR',
      'overflow', 'glitch', 'noise', 'signal', 'lost',
      'Φ', 'Ω', '∆', '∞', '404', 'NULL',
      '警告', '断裂', '重置', '融合', '侵入', '泄漏',
      'WARING', 'SYSTEM', 'FAIL', 'BROKEN', 'HELP',
      '❖', '✦', '✧', '✶', '✷', '⚠', '✘',
    ];

    const fragments: { x: number; y: number; text: string; vx: number; vy: number; size: number; opacity: number }[] = [];

    let frame = 0;
    const animate = () => {
      if (destroyedRef.current) return;
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Scanline effect
      if (frame % 2 === 0) {
        ctx.fillStyle = 'rgba(139, 92, 246, 0.06)';
        for (let y = 0; y < canvas.height; y += 3) {
          if (Math.random() < 0.5) ctx.fillRect(0, y, canvas.width, 1);
        }
      }

      // Random flash bars
      if (Math.random() < 0.08) {
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '0, 229, 204' : '139, 92, 246'}, ${0.15 + Math.random() * 0.2})`;
        ctx.fillRect(0, Math.random() * canvas.height, canvas.width, 2 + Math.random() * 8);
      }

      // Spawn - 10x more: 150 max vs original 15
      if (fragments.length < 150) {
        const fromLeft = Math.random() > 0.5;
        fragments.push({
          x: fromLeft ? -100 : canvas.width + 100,
          y: Math.random() * canvas.height,
          text: words[Math.floor(Math.random() * words.length)],
          vx: fromLeft ? 3 + Math.random() * 8 : -(3 + Math.random() * 8),
          vy: (Math.random() - 0.5) * 3,
          size: 14 + Math.random() * 22,
          opacity: 0.5 + Math.random() * 0.4,
        });
      }

      // Draw
      for (let i = fragments.length - 1; i >= 0; i--) {
        const f = fragments[i];
        f.x += f.vx;
        f.y += f.vy;

        if (f.x < -150 || f.x > canvas.width + 150 || f.y < -50 || f.y > canvas.height + 50) {
          fragments.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = f.opacity;
        ctx.font = `bold ${f.size}px monospace`;
        ctx.fillStyle = frame % 6 < 3 ? '#00E5CC' : '#8B5CF6';
        ctx.fillText(f.text, f.x, f.y);
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      destroyedRef.current = true;
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, canvasRef, isMotionActive]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// Overload Toggle Button
export function OverloadToggle() {
  const { active, toggle } = useOverload();
  const { playTrack, stopTrack } = useMusic();

  const handleToggle = () => {
    const next = !active;
    if (next) {
      playTrack('/audio/overload.mp3');
    } else {
      stopTrack();
    }
    toggle();
  };

  return (
    <button
      onClick={handleToggle}
      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all duration-300 ${
        active
          ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]'
          : 'bg-nc-bg-tertiary border-nc-violet/20 text-nc-text hover:border-nc-violet/40'
      }`}
    >
      {active ? '⚠ 感官过载激活 ⚠' : '激活感官过载'}
    </button>
  );
}

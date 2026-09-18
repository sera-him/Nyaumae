import { useEffect, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';


interface ReadingProgressProps {
  resetKey: string;
}

export default function ReadingProgress({ resetKey }: ReadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const root = document.documentElement;
      const range = Math.max(1, root.scrollHeight - window.innerHeight);
      setProgress(Math.min(1, Math.max(0, window.scrollY / range)));
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    const resizeObserver = 'ResizeObserver' in window
      ? new ResizeObserver(scheduleUpdate)
      : null;
    resizeObserver?.observe(document.documentElement);

    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [resetKey]);

  const percentage = Math.round(progress * 100);

  return (
    <div
      className="story-reading-progress"
      role="progressbar"
      aria-label={L("本章阅读进度")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}

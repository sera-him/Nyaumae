import { useState, useEffect, useRef, useCallback } from 'react';
import { cn, p } from '@/lib/utils';
import { imageHostMap } from '@/lib/imageHostMap';
import { useMotionActivity } from '@/hooks/useMotionActivity';

interface RotatingImageProps {
  localImages: string[];
  alt: string;
  interval?: number;
  className?: string;
  containerClassName?: string;
  remoteFirst?: boolean;
}

export default function RotatingImage({
  localImages,
  alt,
  interval = 3000,
  className = '',
  containerClassName = '',
  remoteFirst = true,
}: RotatingImageProps) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const { ref: containerRef, isMotionActive } = useMotionActivity<HTMLDivElement>();

  const failedArr = failed;

  useEffect(() => {
    if (!isMotionActive || localImages.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % localImages.length);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [localImages.length, interval, isMotionActive]);

  const handleLoad = useCallback((i: number) => {
    setLoaded((prev) => { const n = new Set(prev); n.add(i); return n; });
  }, []);

  const handleError = useCallback((i: number) => {
    setFailed((prev) => { const n = new Set(prev); n.add(i); return n; });
    setLoaded((prev) => { const n = new Set(prev); n.add(i); return n; });
  }, []);

  if (localImages.length === 0) return null;

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', containerClassName)} data-motion-loop>
      {localImages.map((src, i) => {
        const imgSrc = !remoteFirst || failedArr.has(i)
          ? p(src)
          : (imageHostMap[src] ?? p(src));
        const isVisible = i === current && loaded.has(i);
        return (
          <img
            key={`${i}-${failedArr.has(i) ? 'local' : 'cdn'}`}
            src={imgSrc}
            alt={i === 0 ? alt : `${alt} (${i + 1})`}
            onLoad={() => handleLoad(i)}
            onError={() => handleError(i)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            } ${className}`}
          />
        );
      })}
      {!loaded.has(current) && (
        <div className="absolute inset-0 bg-nc-bg-tertiary animate-pulse" />
      )}
    </div>
  );
}

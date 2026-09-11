import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { imageHostMap } from '@/lib/imageHostMap';
import { useMotionActivity } from '@/hooks/useMotionActivity';
import ResponsiveImage, { CARD_IMAGE_WIDTHS } from '@/components/ResponsiveImage';

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

  const next = (current + 1) % localImages.length;
  const visibleIndexes = current === next ? [current] : [current, next];

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', containerClassName)} data-motion-loop>
      {visibleIndexes.map((i) => {
        const src = localImages[i];
        const fallbackSrc = remoteFirst && !failedArr.has(i) ? imageHostMap[src] : undefined;
        const isVisible = i === current && loaded.has(i);
        return (
          <ResponsiveImage
            key={`${i}-${failedArr.has(i) ? 'local' : 'cdn'}`}
            src={src}
            fallbackSrc={fallbackSrc}
            widths={CARD_IMAGE_WIDTHS}
            sizes="(max-width: 640px) calc(100vw - 32px), 440px"
            pictureClassName="absolute inset-0"
            alt={i === 0 ? alt : `${alt} (${i + 1})`}
            onLoad={() => handleLoad(i)}
            onError={() => handleError(i)}
            loading={isMotionActive ? 'eager' : 'lazy'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            } ${className}`}
          />
        );
      })}
      {/* Once the card is near the viewport, warm the whole image set so
          rotation never shows a skeleton while the next frame loads. */}
      {isMotionActive && localImages.map((src, i) => {
        if (visibleIndexes.includes(i) || loaded.has(i)) return null;
        return (
          <div key={`warm-${i}`} aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0">
            <ResponsiveImage
              src={src}
              fallbackSrc={remoteFirst && !failedArr.has(i) ? imageHostMap[src] : undefined}
              widths={CARD_IMAGE_WIDTHS}
              sizes="(max-width: 640px) calc(100vw - 32px), 440px"
              loading="eager"
              alt=""
              onLoad={() => handleLoad(i)}
              onError={() => handleError(i)}
            />
          </div>
        );
      })}
      {!loaded.has(current) && (
        <div className="absolute inset-0 bg-nc-bg-tertiary animate-pulse" />
      )}
    </div>
  );
}

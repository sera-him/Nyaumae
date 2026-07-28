import { useState, useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { cn, p } from '../lib/utils';
import { imageHostMap } from '../lib/imageHostMap';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  localSrc: string;
  aspectRatio?: string;
  skeletonClassName?: string;
  containerClassName?: string;
}

const fallbackCache = new Set<string>();

export default function SmartImage({
  localSrc,
  aspectRatio,
  skeletonClassName = 'bg-nc-bg-tertiary',
  containerClassName = '',
  className: imgClassName = '',
  style,
  onLoad,
  onError,
  loading = 'lazy',
  ...imgProps
}: SmartImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [useFallback, setUseFallback] = useState(fallbackCache.has(localSrc));
  const mountedRef = useRef(true);

  const remoteUrl = imageHostMap[localSrc] ?? null;
  const src = (!useFallback && remoteUrl) ? remoteUrl : p(localSrc);

  useEffect(() => {
    setUseFallback(fallbackCache.has(localSrc));
    setState('loading');
  }, [localSrc]);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;
    setState('loaded');
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;
    if (!useFallback && remoteUrl) {
      fallbackCache.add(localSrc);
      setUseFallback(true);
      setState('loading');
    } else {
      setState('error');
      onError?.(e);
    }
  };

  return (
    <div
      className={cn('relative overflow-hidden', containerClassName)}
      style={{ ...(aspectRatio ? { aspectRatio } : {}), ...style }}
    >
      {state === 'loading' && (
        <div className={`absolute inset-0 z-10 overflow-hidden ${skeletonClassName} animate-pulse`}>
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-nc-violet/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-nc-bg-secondary text-nc-text-muted">
          <ImageOff className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs opacity-50">图片加载失败</span>
        </div>
      )}
      <img
        {...imgProps}
        key={src}
        src={src}
        loading={loading}
        className={`w-full h-full transition-opacity duration-500 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

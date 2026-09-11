import { useState, useEffect, useRef } from 'react';
import { ImageOff, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { imageHostMap } from '../lib/imageHostMap';
import ResponsiveImage, { CARD_IMAGE_WIDTHS, DEFAULT_BACKUP_SRC } from './ResponsiveImage';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  localSrc: string;
  aspectRatio?: string;
  skeletonClassName?: string;
  containerClassName?: string;
  responsiveWidths?: readonly number[];
  backupSrc?: string | null;
}

export default function SmartImage({
  localSrc,
  aspectRatio,
  skeletonClassName = 'bg-nc-bg-tertiary',
  containerClassName = '',
  responsiveWidths = CARD_IMAGE_WIDTHS,
  backupSrc = DEFAULT_BACKUP_SRC,
  className: imgClassName = '',
  style,
  onLoad,
  onError,
  loading = 'lazy',
  ...imgProps
}: SmartImageProps) {
  const [imageState, setImageState] = useState<{ src: string; status: 'loading' | 'loaded' | 'error'; attempt: number }>(() => ({
    src: localSrc,
    status: 'loading',
    attempt: 0,
  }));
  const mountedRef = useRef(true);

  const remoteUrl = imageHostMap[localSrc] ?? undefined;
  const current = imageState.src === localSrc ? imageState : { src: localSrc, status: 'loading' as const, attempt: 0 };
  const state = current.status;

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;
    setImageState((value) => ({ ...value, src: localSrc, status: 'loaded' }));
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!mountedRef.current) return;
    setImageState((value) => ({ ...value, src: localSrc, status: 'error' }));
    onError?.(e);
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
          <span className="text-xs opacity-70">图片和备用资源均加载失败</span>
          <button
            type="button"
            onClick={() => setImageState((value) => ({ src: localSrc, status: 'loading', attempt: value.attempt + 1 }))}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-nc-text hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />重试
          </button>
        </div>
      )}
      <ResponsiveImage
        {...imgProps}
        key={`${localSrc}:${current.attempt}`}
        src={localSrc}
        fallbackSrc={remoteUrl}
        backupSrc={backupSrc}
        widths={responsiveWidths}
        loading={loading}
        className={`w-full h-full transition-opacity duration-500 ${state === 'loaded' ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

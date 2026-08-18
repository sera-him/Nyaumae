import { useState } from 'react';
import { ImageOff, RotateCcw } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
  skeletonClassName?: string;
  containerClassName?: string;
  fallbackSrc?: string | null;
}

interface ImageStatus {
  src: string | undefined;
  loaded: boolean;
  error: boolean;
  fallback: boolean;
  attempt: number;
}

export default function LazyImage({
  aspectRatio,
  skeletonClassName = 'bg-nc-bg-tertiary',
  containerClassName = '',
  className: imgClassName = '',
  style,
  src,
  onLoad,
  onError,
  loading = 'lazy',
  fallbackSrc = '/hero-bg.jpg',
  ...imgProps
}: LazyImageProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() => ({ src, loaded: false, error: false, fallback: false, attempt: 0 }));
  const status = imageStatus.src === src ? imageStatus : { src, loaded: false, error: false, fallback: false, attempt: 0 };
  const { loaded, error } = status;
  const effectiveSrc = status.fallback && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={{ ...(aspectRatio ? { aspectRatio } : {}), ...style }}
    >
      {!loaded && !error && (
        <div className={`absolute inset-0 z-10 overflow-hidden ${skeletonClassName} animate-pulse`}>
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-nc-violet/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-nc-bg-secondary text-nc-text-muted">
          <ImageOff className="w-8 h-8 mb-2 opacity-50" />
          <span className="text-xs opacity-70">图片和备用资源均加载失败</span>
          <button
            type="button"
            onClick={() => setImageStatus((value) => ({ src, loaded: false, error: false, fallback: false, attempt: value.attempt + 1 }))}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-nc-text hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />重试
          </button>
        </div>
      )}
      <img
        {...imgProps}
        key={`${effectiveSrc}:${status.attempt}`}
        src={effectiveSrc}
        loading={loading}
        className={`w-full h-full transition-opacity duration-500 ${loaded && !error ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        onLoad={(e) => {
          setImageStatus((value) => ({ ...value, src, loaded: true, error: false }));
          onLoad?.(e);
        }}
        onError={(e) => {
          if (!status.fallback && fallbackSrc && fallbackSrc !== src) {
            setImageStatus((value) => ({ ...value, src, loaded: false, error: false, fallback: true }));
          } else {
            setImageStatus((value) => ({ ...value, src, loaded: true, error: true }));
            onError?.(e);
          }
        }}
      />
    </div>
  );
}

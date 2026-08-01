import { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: string;
  skeletonClassName?: string;
  containerClassName?: string;
}

interface ImageStatus {
  src: string | undefined;
  loaded: boolean;
  error: boolean;
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
  ...imgProps
}: LazyImageProps) {
  const [imageStatus, setImageStatus] = useState<ImageStatus>(() => ({ src, loaded: false, error: false }));
  const status = imageStatus.src === src ? imageStatus : { src, loaded: false, error: false };
  const { loaded, error } = status;

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
          <span className="text-xs opacity-50">图片加载失败</span>
        </div>
      )}
      <img
        {...imgProps}
        src={src}
        loading={loading}
        className={`w-full h-full transition-opacity duration-500 ${loaded && !error ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
        onLoad={(e) => {
          setImageStatus({ src, loaded: true, error: false });
          onLoad?.(e);
        }}
        onError={(e) => {
          setImageStatus({ src, loaded: true, error: true });
          onError?.(e);
        }}
      />
    </div>
  );
}

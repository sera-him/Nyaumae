import { useState } from 'react';
import { p } from '@/lib/utils';

export const THUMBNAIL_IMAGE_WIDTHS = [160, 320] as const;
export const CARD_IMAGE_WIDTHS = [320, 640] as const;
export const DETAIL_IMAGE_WIDTHS = [320, 640, 960] as const;
export const READER_IMAGE_WIDTHS = [320, 640, 960, 1280] as const;
export const PORTAL_IMAGE_WIDTHS = [240, 640, 960, 1280] as const;

type ImageFormat = 'avif' | 'webp';

interface ResponsiveImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'srcSet'> {
  src: string;
  fallbackSrc?: string;
  backupSrc?: string | null;
  widths?: readonly number[];
  pictureClassName?: string;
}

function isLocalRaster(src: string): boolean {
  return /^\/.+\.(?:png|jpe?g)$/i.test(src.split(/[?#]/, 1)[0]);
}

function responsiveImageUrl(src: string, width: number, format: ImageFormat): string {
  const clean = src.split(/[?#]/, 1)[0];
  const extensionIndex = clean.lastIndexOf('.');
  const stem = extensionIndex >= 0 ? clean.slice(0, extensionIndex) : clean;
  return p(`/optimized${stem}-${width}.${format}`);
}

function responsiveImageSrcSet(
  src: string,
  widths: readonly number[],
  format: ImageFormat,
): string {
  return widths.map((width) => `${responsiveImageUrl(src, width, format)} ${width}w`).join(', ');
}

export default function ResponsiveImage({
  src,
  fallbackSrc,
  backupSrc = '/hero-bg.jpg',
  widths = CARD_IMAGE_WIDTHS,
  sizes = '(max-width: 640px) 100vw, 640px',
  pictureClassName,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...imgProps
}: ResponsiveImageProps) {
  const [fallbackState, setFallbackState] = useState<{
    src: string;
    stage: 'optimized' | 'original' | 'backup' | 'error';
    attempt: number;
  }>({ src, stage: 'optimized', attempt: 0 });
  const stage = fallbackState.src === src ? fallbackState.stage : 'optimized';
  const localRaster = isLocalRaster(src);
  const localOriginal = localRaster ? p(src) : src;
  const fallback = fallbackSrc ?? localOriginal;
  const imageSrc = stage === 'backup' && backupSrc
    ? backupSrc
    : stage === 'original'
      ? localOriginal
      : fallback;

  if (stage === 'error') {
    return (
      <picture className={pictureClassName}>
        <button
          type="button"
          onClick={() => setFallbackState((state) => ({ src, stage: 'optimized', attempt: state.attempt + 1 }))}
          className={`flex h-full min-h-20 w-full items-center justify-center bg-nc-bg-secondary px-3 py-4 text-center text-xs text-nc-text-muted ${imgProps.className ?? ''}`}
          aria-label={`${typeof imgProps.alt === 'string' && imgProps.alt ? imgProps.alt : '图片'}加载失败，点击重试`}
        >
          图片加载失败 · 点击重试
        </button>
      </picture>
    );
  }

  return (
    <picture className={pictureClassName}>
      {localRaster && stage === 'optimized' && (
        <>
          <source
            type="image/avif"
            srcSet={responsiveImageSrcSet(src, widths, 'avif')}
            sizes={sizes}
          />
          <source
            type="image/webp"
            srcSet={responsiveImageSrcSet(src, widths, 'webp')}
            sizes={sizes}
          />
        </>
      )}
      <img
        {...imgProps}
        key={`${imageSrc}:${fallbackState.attempt}`}
        src={imageSrc}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        onError={(event) => {
          if (localRaster && stage === 'optimized') {
            setFallbackState((state) => ({ src, stage: 'original', attempt: state.attempt }));
            return;
          }
          if (stage !== 'backup' && backupSrc && imageSrc !== backupSrc) {
            setFallbackState((state) => ({ src, stage: 'backup', attempt: state.attempt }));
            return;
          }
          setFallbackState((state) => ({ src, stage: 'error', attempt: state.attempt }));
          onError?.(event);
        }}
      />
    </picture>
  );
}

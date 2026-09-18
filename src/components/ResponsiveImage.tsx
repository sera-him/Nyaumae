import { useSyncExternalStore, useState } from 'react';
import { L } from '@/lib/translations/manual';

import { p } from '@/lib/utils';
import imageVariants from '@/lib/generated/imageVariants.json';
import { getShowOriginalImages, subscribeShowOriginalImages } from '@/lib/imagePreference';

export const THUMBNAIL_IMAGE_WIDTHS = [160, 320] as const;
export const CARD_IMAGE_WIDTHS = [320, 640] as const;
export const DETAIL_IMAGE_WIDTHS = [320, 640, 960] as const;
export const READER_IMAGE_WIDTHS = [320, 640, 960, 1280] as const;
export const PORTAL_IMAGE_WIDTHS = [240, 640, 960, 1280] as const;

type ImageFormat = 'avif' | 'webp';

type ImageVariantManifest = Record<string, { sourceWidth: number; sourceHeight: number; widths: number[] }>;

const variantManifest = imageVariants as ImageVariantManifest;

/**
 * Last-resort fallback image. Originals with variants are pruned from the
 * deploy, so the backup must be an optimized file that always ships.
 * Must run after `variantManifest` is initialized (module eval order).
 */
function resolveDefaultBackupSrc(): string {
  const entry = variantManifest['/hero-bg.jpg'];
  if (entry && entry.widths.length > 0) {
    return p(`/optimized/hero-bg-${Math.max(...entry.widths)}.webp`);
  }
  return '/hero-bg.jpg';
}

export const DEFAULT_BACKUP_SRC = resolveDefaultBackupSrc();

/**
 * The generator only produces variants at or below each source's native width,
 * so the requested width list can advertise candidates that were never
 * generated. A browser that selects such a candidate gets a 404 and skips the
 * rest of the srcset, so clamp every request to the widths that really exist.
 */
function existingWidths(src: string, widths: readonly number[]): number[] | null {
  const entry = variantManifest[src.split(/[?#]/, 1)[0]];
  if (!entry || entry.widths.length === 0) return null;
  const available = widths.filter((width) => entry.widths.includes(width));
  return available.length > 0 ? available : [Math.max(...entry.widths)];
}

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
  backupSrc = DEFAULT_BACKUP_SRC,
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
  const showOriginalImages = useSyncExternalStore(subscribeShowOriginalImages, getShowOriginalImages);
  const localRaster = isLocalRaster(src);
  const localOriginal = localRaster ? p(src) : src;
  const fallback = fallbackSrc ?? localOriginal;
  // Only trust the variant pipeline when the manifest knows this exact file.
  // The "show original" preference switches the pipeline off entirely so the
  // untouched source file is rendered.
  const manifestWidths = localRaster ? existingWidths(src, widths) : null;
  const hasOptimizedSources = localRaster && stage === 'optimized' && manifestWidths !== null && !showOriginalImages;
  // The picture sources win in supporting browsers; this src is what renders
  // when they don't (or before hydration), so it must also point at a file
  // that exists rather than a pruned original.
  const optimizedFallbackSrc = manifestWidths && manifestWidths.length > 0
    ? responsiveImageUrl(src, Math.max(...manifestWidths), 'webp')
    : null;
  const imageSrc = showOriginalImages
    ? localOriginal
    : stage === 'backup' && backupSrc
      ? backupSrc
      : stage === 'original'
        ? localOriginal
        : hasOptimizedSources && optimizedFallbackSrc
          ? p(optimizedFallbackSrc)
          : fallback;

  if (stage === 'error') {
    return (
      <picture className={pictureClassName}>
        <button
          type="button"
          onClick={() => setFallbackState((state) => ({ src, stage: 'optimized', attempt: state.attempt + 1 }))}
          className={`flex h-full min-h-20 w-full items-center justify-center bg-nc-bg-secondary px-3 py-4 text-center text-xs text-nc-text-muted ${imgProps.className ?? ''}`}
          aria-label={L(`${typeof imgProps.alt === 'string' && imgProps.alt ? imgProps.alt : '图片'}加载失败，点击重试`)}
        >
          {L("图片加载失败 · 点击重试\n        ")}</button>
      </picture>
    );
  }

  return (
    <picture className={pictureClassName}>
      {hasOptimizedSources && manifestWidths && (
        <>
          <source
            type="image/avif"
            srcSet={responsiveImageSrcSet(src, manifestWidths, 'avif')}
            sizes={sizes}
          />
          <source
            type="image/webp"
            srcSet={responsiveImageSrcSet(src, manifestWidths, 'webp')}
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
          if (showOriginalImages) {
            if (stage !== 'backup' && backupSrc && imageSrc !== backupSrc) {
              setFallbackState((state) => ({ src, stage: 'backup', attempt: state.attempt }));
              return;
            }
            setFallbackState((state) => ({ src, stage: 'error', attempt: state.attempt }));
            onError?.(event);
            return;
          }
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

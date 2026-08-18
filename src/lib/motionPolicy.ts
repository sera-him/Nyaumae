export type MotionQuality = 'full' | 'lite' | 'static';

export interface MotionProfile {
  quality: MotionQuality;
  reducedMotion: boolean;
  mobile: boolean;
  lowSpec: boolean;
  particleScale: number;
  pixelRatioCap: number;
}

interface NavigatorConnection extends EventTarget {
  effectiveType?: string;
  saveData?: boolean;
}

interface MotionNavigator extends Navigator {
  connection?: NavigatorConnection;
  deviceMemory?: number;
}

export const MOTION_PROFILE_EVENT = 'motionprofilechange';

export function getMotionConnection(): NavigatorConnection | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as MotionNavigator).connection ?? null;
}

export function getMotionProfile(): MotionProfile {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      quality: 'full',
      reducedMotion: false,
      mobile: false,
      lowSpec: false,
      particleScale: 1,
      pixelRatioCap: 2,
    };
  }

  const motionNavigator = navigator as MotionNavigator;
  const connection = getMotionConnection();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  const constrainedNetwork = connection?.saveData === true
    || connection?.effectiveType === 'slow-2g'
    || connection?.effectiveType === '2g';
  const lowSpec = (motionNavigator.hardwareConcurrency ?? 8) < 4
    || (motionNavigator.deviceMemory !== undefined && motionNavigator.deviceMemory < 4)
    || constrainedNetwork;
  const quality: MotionQuality = lowSpec ? 'static' : mobile ? 'lite' : 'full';

  return {
    quality,
    reducedMotion,
    mobile,
    lowSpec,
    particleScale: quality === 'full' ? 1 : quality === 'lite' ? 0.45 : 0,
    pixelRatioCap: quality === 'full' ? 2 : quality === 'lite' ? 1.25 : 1,
  };
}

export function applyMotionProfile(profile = getMotionProfile()): MotionProfile {
  if (typeof document === 'undefined') return profile;
  const root = document.documentElement;
  root.dataset.motionQuality = profile.quality;
  root.dataset.motionDevice = profile.mobile ? 'mobile' : 'desktop';
  root.dataset.motionReduced = profile.reducedMotion ? 'true' : 'false';
  // Preserve the existing selector while the rest of the site migrates to the
  // more descriptive motion-quality contract.
  root.dataset.auroraLowSpec = profile.lowSpec ? 'true' : 'false';
  return profile;
}

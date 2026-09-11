import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Howl } from 'howler';

// howler is ~30KB gzipped but music is opt-in (muted by default), so load it
// lazily on first unmute instead of shipping it in the initial bundle.
let howlerLoader: Promise<typeof import('howler').Howl> | null = null;
function loadHowler() {
  howlerLoader ||= import('howler').then((m) => m.Howl);
  return howlerLoader;
}

interface MusicContextType {
  isPlaying: boolean;
  isMuted: boolean;
  toggleMusic: () => void;
  currentTrack: string | null;
  playTrack: (track: string) => void;
  stopTrack: () => void;
}

const MusicContext = createContext<MusicContextType>({
  isPlaying: false,
  isMuted: true,
  toggleMusic: () => {},
  currentTrack: null,
  playTrack: () => {},
  stopTrack: () => {},
});

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const howlRef = useRef<Howl | null>(null);
  const pendingRef = useRef<string | null>(null);
  const lockRef = useRef(false);
  const userActivatedRef = useRef(false);
  const timerRef = useRef<number>(0);

  // Safe unload with lock
  const safeUnload = useCallback(() => {
    if (lockRef.current) return false;
    lockRef.current = true;
    try {
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
        howlRef.current = null;
      }
    } catch {
      // ignore errors during cleanup
    }
    lockRef.current = false;
    return true;
  }, []);

  const stopTrack = useCallback(() => {
    setCurrentTrack(null);
    pendingRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
  }, []);

  const playTrack = useCallback((track: string) => {
    // Debounce: ignore if same track requested within 500ms
    if (pendingRef.current === track) return;
    pendingRef.current = track;

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Delay by 100ms to batch rapid calls
    timerRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      setCurrentTrack(track);
      timerRef.current = 0;
    }, 100);
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMuted((prev) => {
      if (prev) userActivatedRef.current = true;
      return !prev;
    });
  }, []);

  // Keep the requested track without allocating an HTML5 audio object while muted.
  useEffect(() => {
    let active = true;
    const markStopped = () => {
      if (active) setIsPlaying(false);
    };

    safeUnload();
    queueMicrotask(markStopped);

    if (isMuted || !currentTrack || !userActivatedRef.current) {
      return () => {
        active = false;
      };
    }

    let cancelled = false;
    loadHowler()
      .then((HowlCtor) => {
        if (cancelled || !active) return;
        try {
          const howl = new HowlCtor({
            src: [currentTrack],
            loop: true,
            volume: 0.35,
            html5: true,
            onplay: () => {
              if (active) setIsPlaying(true);
            },
            onpause: markStopped,
            onstop: markStopped,
            onend: markStopped,
            onloaderror: markStopped,
          });
          howlRef.current = howl;
          howl.play();
        } catch {
          queueMicrotask(markStopped);
        }
      })
      .catch(() => {
        queueMicrotask(markStopped);
      });

    return () => {
      active = false;
      cancelled = true;
    };
  }, [currentTrack, isMuted, safeUnload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      safeUnload();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [safeUnload]);

  return (
    <MusicContext.Provider
      value={{ isPlaying, isMuted, toggleMusic, currentTrack, playTrack, stopTrack }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}

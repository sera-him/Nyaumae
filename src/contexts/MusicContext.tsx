import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Howl } from 'howler';

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
    safeUnload();
    setCurrentTrack(null);
    pendingRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = 0;
    }
  }, [safeUnload]);

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

      // Don't recreate if same track is already loaded
      if (currentTrack === track && howlRef.current) {
        if (!isMuted && !howlRef.current.playing()) {
          howlRef.current.play();
        }
        return;
      }

      safeUnload();

      try {
        const howl = new Howl({
          src: [track],
          loop: true,
          volume: 0.35,
          html5: true,
        });
        howlRef.current = howl;
        if (!isMuted) {
          howl.play();
        }
        setCurrentTrack(track);
      } catch {
        // ignore initialization errors
      }
    }, 100);
  }, [isMuted, currentTrack, safeUnload]);

  const toggleMusic = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        if (howlRef.current) {
          if (next) {
            howlRef.current.pause();
          } else {
            howlRef.current.play();
          }
        }
      } catch {
        // ignore
      }
      return next;
    });
    setIsPlaying((prev) => !prev);
  }, []);

  // Handle mute state changes
  useEffect(() => {
    try {
      if (howlRef.current) {
        if (isMuted) {
          howlRef.current.pause();
        } else {
          howlRef.current.play();
        }
      }
    } catch {
      // ignore
    }
  }, [isMuted]);

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

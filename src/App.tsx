import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useLocation } from 'react-router';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';
import { MusicProvider } from '@/contexts/MusicContext';
import { OverloadProvider } from '@/contexts/OverloadContext';
import SearchModal from '@/components/SearchModal';
import AppRoutes from '@/routes';
import { resolveSiteTheme } from '@/lib/visualTheme';

const SCROLL_STORAGE_KEY = 'kimi:scrollPositions';

interface ScrollPosition {
  scrollX: number;
  scrollY: number;
}

function getScrollPositions(): Record<string, ScrollPosition> {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveScrollPosition(key: string, pos: ScrollPosition): void {
  try {
    const all = getScrollPositions();
    all[key] = pos;
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(all));
  } catch { /* sessionStorage may be full */ }
}

function getSavedScrollPosition(key: string): ScrollPosition | null {
  const all = getScrollPositions();
  return all[key] ?? null;
}

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const siteTheme = resolveSiteTheme(location.pathname);
  const immersive = location.pathname === '/neural-clash';

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* service worker */ });
    }
  }, []);

  useEffect(() => {
    // Keep the selected tab discoverable after a route change on narrow screens.
    // Scrolling the tab strip itself avoids moving the document viewport.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      document.querySelectorAll<HTMLElement>('.aurora-tabs .aurora-tab-active, .aurora-tabs [aria-selected="true"]').forEach((tab) => {
        const strip = tab.parentElement;
        if (!strip || strip.scrollWidth <= strip.clientWidth) return;
        const left = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
        strip.scrollTo({
          left: Math.max(0, Math.min(left, strip.scrollWidth - strip.clientWidth)),
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      });
    });
  }, [location.pathname]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handlePopState = () => {
      const saved = getSavedScrollPosition(location.key);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(saved.scrollX, saved.scrollY);
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [location.key]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveScrollPosition(location.key, { scrollX: window.scrollX, scrollY: window.scrollY });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.key]);

  useEffect(() => {
    const handleScroll = () => {
      saveScrollPosition(location.key, { scrollX: window.scrollX, scrollY: window.scrollY });
    };
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.key]);

  useEffect(() => {
    const isPop = window.history.state?.idx != null;
    if (!isPop) {
      const saved = getSavedScrollPosition(location.key);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(saved.scrollX, saved.scrollY);
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, [location.key]);

  return (
    <MotionConfig reducedMotion="user">
      <MusicProvider>
        <OverloadProvider>
          <div
            className="aurora-app-shell site-theme-shell min-h-screen bg-nc-bg text-nc-text antialiased selection:bg-nc-violet/30 selection:text-nc-text"
            data-site-theme={siteTheme}
          >
            <div className="aurora-app-atmosphere" aria-hidden="true" />
            {!immersive && <Navigation onSearchClick={handleSearchOpen} />}
            <main className="aurora-site-main relative z-[1]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AppRoutes />
                </motion.div>
              </AnimatePresence>
            </main>
            {!immersive && <Footer />}
            {!immersive && <div className="aurora-search-host">
              <SearchModal isOpen={searchOpen} onClose={handleSearchClose} />
            </div>}
          </div>
        </OverloadProvider>
      </MusicProvider>
    </MotionConfig>
  );
}

export default App;

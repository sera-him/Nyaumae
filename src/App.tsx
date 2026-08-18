import { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { useLocation, useNavigationType } from 'react-router';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';
import { MusicProvider } from '@/contexts/MusicContext';
import { OverloadProvider } from '@/contexts/OverloadContext';
import SearchModal from '@/components/SearchModal';
import SiteMotionController from '@/components/SiteMotionController';
import RouteMetadata from '@/components/RouteMetadata';
import ResilienceNotices from '@/components/ResilienceNotices';
import AppRoutes from '@/routes';
import { resolveSiteTheme } from '@/lib/visualTheme';
import { loadSearchData } from '@/lib/searchDataLoader';
import { preloadRoute, scheduleRouteHierarchyPreload } from '@/lib/routePreload';
import { recordLastViewed } from '@/lib/lastViewed';
import { finishPageView, startPageView, type ActivePageView } from '@/lib/analytics';
import { SearchSessionProvider } from '@/contexts/SearchSessionContext';
import { readJsonStorage, writeJsonStorage } from '@/lib/browserStorage';

const SCROLL_STORAGE_KEY = 'kimi:scrollPositions';

interface ScrollPosition {
  scrollX: number;
  scrollY: number;
}

function getScrollPositions(): Record<string, ScrollPosition> {
  return readJsonStorage<Record<string, ScrollPosition>>(SCROLL_STORAGE_KEY, {}, { area: 'session' }).value;
}

function saveScrollPosition(key: string, pos: ScrollPosition): void {
  const all = getScrollPositions();
  all[key] = pos;
  const keys = Object.keys(all);
  if (keys.length > 100) {
    keys.slice(0, keys.length - 100).forEach((staleKey) => delete all[staleKey]);
  }
  writeJsonStorage(SCROLL_STORAGE_KEY, all, 'session');
}

function getSavedScrollPosition(key: string): ScrollPosition | null {
  const all = getScrollPositions();
  return all[key] ?? null;
}

function App() {
  const [searchOpen, setSearchOpen] = useState(false);
  const activePageViewRef = useRef<ActivePageView | null>(null);
  const location = useLocation();
  const navigationType = useNavigationType();
  const siteTheme = resolveSiteTheme(location.pathname);
  const routeScrollKey = `route:${location.pathname}${location.search}`;
  const historyScrollKey = `history:${location.key}`;
  const immersive = location.pathname === '/neural-clash';
  const isThemedChatRoute = ['/chat/ocean', '/chat/sweetdream', '/chat/aurora'].includes(location.pathname);

  const handleSearchIntent = useCallback(() => {
    void loadSearchData().catch(() => {
      // Opening the search remains the user-visible retry path.
    });
  }, []);
  const handleSearchOpen = useCallback(() => {
    handleSearchIntent();
    setSearchOpen(true);
  }, [handleSearchIntent]);
  const handleSearchClose = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
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
    recordLastViewed(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const view = startPageView(location.pathname);
    activePageViewRef.current = view;

    const finishActiveView = () => {
      if (activePageViewRef.current !== view) return;
      finishPageView(view);
      activePageViewRef.current = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        finishActiveView();
      } else if (!activePageViewRef.current) {
        activePageViewRef.current = startPageView(location.pathname);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', finishActiveView);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', finishActiveView);
      finishActiveView();
    };
  }, [location.pathname]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        handleSearchOpen();
      }
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, [handleSearchOpen]);

  useEffect(() => {
    // The playground list is intentionally metadata-only. Search data (which
    // also contains game rules and puzzle text) can wait for an explicit
    // search gesture or for a non-game route's idle window.
    const tailTasks = location.pathname.startsWith('/playground')
      ? []
      : [loadSearchData];
    return scheduleRouteHierarchyPreload(location.pathname, tailTasks);
  }, [location.pathname]);

  useEffect(() => {
    const preloadLinkTarget = (event: Event) => {
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href?.startsWith('#/')) return;
      void preloadRoute(href.slice(1)).catch(() => {
        // Navigation itself owns user-visible loading and recovery.
      });
    };

    document.addEventListener('pointerover', preloadLinkTarget, { passive: true });
    document.addEventListener('focusin', preloadLinkTarget);
    return () => {
      document.removeEventListener('pointerover', preloadLinkTarget);
      document.removeEventListener('focusin', preloadLinkTarget);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const position = { scrollX: window.scrollX, scrollY: window.scrollY };
      saveScrollPosition(historyScrollKey, position);
      saveScrollPosition(routeScrollKey, position);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [historyScrollKey, routeScrollKey]);

  useEffect(() => {
    const handleScroll = () => {
      const position = { scrollX: window.scrollX, scrollY: window.scrollY };
      saveScrollPosition(historyScrollKey, position);
      saveScrollPosition(routeScrollKey, position);
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
  }, [historyScrollKey, routeScrollKey]);

  useLayoutEffect(() => {
    const saved = navigationType === 'POP'
      ? getSavedScrollPosition(historyScrollKey) ?? getSavedScrollPosition(routeScrollKey)
      : null;
    const frame = requestAnimationFrame(() => {
      if (saved) {
        window.scrollTo(saved.scrollX, saved.scrollY);
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [historyScrollKey, navigationType, routeScrollKey]);

  return (
    <MotionConfig reducedMotion="user">
      <SiteMotionController />
      <RouteMetadata />
      <MusicProvider>
        <SearchSessionProvider>
          <OverloadProvider>
          <div
            className="aurora-app-shell site-theme-shell min-h-screen bg-nc-bg text-nc-text antialiased selection:bg-nc-violet/30 selection:text-nc-text"
            data-site-theme={siteTheme}
          >
            <div className="aurora-app-atmosphere" data-motion-loop data-motion-kind="ambient" aria-hidden="true" />
            {!immersive && <Navigation onSearchClick={handleSearchOpen} onSearchIntent={handleSearchIntent} />}
            <main className={`aurora-site-main relative z-[1]${isThemedChatRoute ? ' aurora-site-main--chat' : ''}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <AppRoutes />
              </motion.div>
            </main>
            {!immersive && !isThemedChatRoute && <Footer />}
            {!immersive && <div className="aurora-search-host">
              <SearchModal isOpen={searchOpen} onClose={handleSearchClose} />
            </div>}
            <ResilienceNotices />
          </div>
          </OverloadProvider>
        </SearchSessionProvider>
      </MusicProvider>
    </MotionConfig>
  );
}

export default App;

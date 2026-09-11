import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BookOpen, ExternalLink, Gamepad2, Globe2, Menu, Music2,
  MessageCircleMore, Search, Sigma, Sparkles, Users, UserRound, VolumeX, X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useMusic } from '@/contexts/MusicContext';
import { isNavigationExcluded, NAVIGATION_GROUPS } from '@/lib/routeManifest';

interface NavigationProps {
  onSearchClick: () => void;
  onSearchIntent: () => void;
}

interface PrimaryItem {
  label: string;
  to: string;
  icon: React.ElementType;
  paths?: string[];
  /** Directory-panel description, surfaced as a tooltip/accessible name. */
  description?: string;
}

const groupIconMap: Record<(typeof NAVIGATION_GROUPS)[number]['id'], React.ElementType> = {
  stories: BookOpen,
  characters: Users,
  world: Globe2,
  miia: Sparkles,
  math: Sigma,
  playground: Gamepad2,
  ai: MessageCircleMore,
  other: Search,
};

const navigationGroups = NAVIGATION_GROUPS
  .map((group) => ({
    ...group,
    items: group.items.filter((item) => !isNavigationExcluded(item.to)),
  }))
  .filter((group) => !isNavigationExcluded(group.root) && group.items.length > 0);

const primaryItems: PrimaryItem[] = navigationGroups.map((group) => ({
  label: group.label,
  to: group.root,
  icon: groupIconMap[group.id],
  paths: [group.root, ...group.items.map((item) => item.to)],
  description: group.description,
}));

const navigationGroupCount = navigationGroups.length;
// Keep the restored directory label exactly as it appeared before the redesign.
const directoryEntryCount = 32;

function routeIsActive(pathname: string, to: string, paths?: string[]) {
  const candidates = paths ?? [to.split('?')[0].split('#')[0]];
  return candidates.some((path) => path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`));
}

export default function Navigation({ onSearchClick, onSearchIntent }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(['miia']));
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isPlaying, isMuted, toggleMusic } = useMusic();
  const musicOn = isPlaying && !isMuted;
  const prefersReducedMotion = useReducedMotion();
  const activeArea = useMemo(() => primaryItems.find((item) => routeIsActive(location.pathname, item.to, item.paths))?.label ?? '主页', [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    const closeFrame = window.requestAnimationFrame(() => {
      if (menuOpen) closeMenu();
    });
    return () => window.cancelAnimationFrame(closeFrame);
    // The route effect intentionally only reacts to navigation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanelRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    const focusFrame = window.requestAnimationFrame(() => focusable()[0]?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { window.cancelAnimationFrame(focusFrame); document.removeEventListener('keydown', onKeyDown); };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const toggleGroup = (id: string) => setExpandedGroups((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <>
      <motion.nav initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: .3, ease: [0.22, 1, 0.36, 1] }} className={`aurora-nav aurora-site-navigation ${scrolled || menuOpen ? 'aurora-nav-scrolled' : ''} ${menuOpen ? 'aurora-nav-open' : ''}`} aria-label="全站导航" data-active-area={activeArea} data-motion-loop data-motion-kind="ambient">
        <div className="aurora-nav-inner">
          <Link to="/" className="aurora-brand" aria-label="Neural Connection 主页"><span className="aurora-brand-mark"><BookOpen /></span><span className="aurora-brand-copy"><strong>NEURAL CONNECTION</strong><small>ACTIVE SPACE / {activeArea}</small></span></Link>
          <div className="aurora-primary-links" aria-label={`${navigationGroupCount}个空间导航`}>
            {primaryItems.map(({ label, to, icon: Icon, paths, description }) => { const isActive = routeIsActive(location.pathname, to, paths); return <Link key={to} to={to} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined} title={description ? `${label} · ${description}` : undefined} aria-label={description ? `${label}：${description}` : undefined}><Icon /><span>{label}</span>{isActive && <motion.span className="aurora-nav-active-indicator" layoutId="aurora-nav-active-indicator" transition={{ type: 'spring', stiffness: 420, damping: 34 }} aria-hidden="true" />}</Link>; })}
          </div>
          <div className="aurora-nav-actions">
            <button type="button" onClick={onSearchClick} onPointerEnter={onSearchIntent} onFocus={onSearchIntent} className="aurora-nav-search" data-motion-ripple="true" aria-label="搜索全站"><Search /><span>搜索</span><kbd>/</kbd></button>
            <Link to="/settings/ai" className="aurora-icon-button" aria-label="设置" title="设置"><UserRound /></Link>
            <button ref={menuButtonRef} type="button" onClick={() => setMenuOpen((open) => !open)} className={`aurora-menu-button ${menuOpen ? 'is-active' : ''}`} data-motion-ripple="true" aria-label={menuOpen ? '关闭全站导航' : '打开全站导航'} aria-expanded={menuOpen} aria-controls="aurora-navigation-panel" aria-haspopup="dialog"><span>{menuOpen ? '关闭' : '导航'}</span>{menuOpen ? <X /> : <Menu />}</button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && <motion.div className="aurora-menu-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: .18 }} onClick={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
          <motion.div id="aurora-navigation-panel" ref={menuPanelRef} role="dialog" aria-modal="true" aria-label="全站内容目录" className="aurora-menu-shell" data-motion-loop data-motion-kind="ambient" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={prefersReducedMotion ? { duration: 0 } : { duration: .24, ease: [0.22, 1, 0.36, 1] }}>
            <div className="aurora-menu-heading"><div><span>NEURAL DIRECTORY / {directoryEntryCount} ENTRIES</span><h2>选择一条<span>神经路径</span></h2></div><p>从故事与角色出发，也可以直接前往世界观、游戏和更多内容。</p></div>
            <div className="aurora-menu-grid">
              {navigationGroups.map(({ id, label, caption, description, items }, groupIndex) => { const Icon = groupIconMap[id]; const expanded = expandedGroups.has(id); return <section key={id} className={`aurora-menu-group ${expanded ? 'is-expanded' : ''}`}><button type="button" className="aurora-menu-group-header" onClick={() => toggleGroup(id)} aria-expanded={expanded}><span className="aurora-menu-index">{String(groupIndex + 1).padStart(2, '0')}</span><Icon /><span className="aurora-menu-group-copy"><strong>{label}</strong><small>{caption}</small><em>{description}</em></span><span className="aurora-menu-group-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span></button><div className="aurora-menu-links">{items.map((item) => { const isActive = routeIsActive(location.pathname, item.to); return <Link key={item.to} to={item.to} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined}><span>{item.label}</span><span aria-hidden="true">↗</span></Link>; })}</div></section>; })}
            </div>
            <div className="aurora-menu-system"><div><span>SITE CONTROL</span><strong>站点偏好</strong></div><div className="aurora-menu-system-links"><button type="button" onClick={toggleMusic}>{musicOn ? <Music2 /> : <VolumeX />}<span>{musicOn ? '关闭声音' : '打开声音'}</span></button></div></div>
            <div className="aurora-menu-footer"><a href="https://space.bilibili.com/396073700" target="_blank" rel="noopener noreferrer">nyaumæ <ExternalLink /></a></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>
    </>
  );
}

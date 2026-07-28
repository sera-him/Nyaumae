import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, Brain, ExternalLink, Gamepad2, Globe2, Menu, Music2,
  MessageCircleMore, Search, Settings2, Sigma, Sparkles, Users, VolumeX, X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useMusic } from '@/contexts/MusicContext';

interface NavigationProps { onSearchClick: () => void; }

const primaryItems = [
  { label: '世界', to: '/world', icon: Globe2 },
  { label: '角色档案', to: '/characters', icon: Users },
  { label: '故事章节', to: '/stories', icon: BookOpen },
  { label: '咪呀的空间', to: '/miia', icon: Sparkles },
  { label: '数学模型', to: '/math', icon: Sigma },
  { label: '游戏', to: '/playground', icon: Gamepad2 },
  { label: '星海对话', to: '/chat', icon: MessageCircleMore },
  { label: 'AI 设置', to: '/settings/ai', icon: Settings2 },
];

interface NavItem { label: string; to: string; }
interface NavGroup { label: string; caption: string; icon: React.ElementType; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    label: '世界', caption: 'WORLD', icon: Globe2,
    items: [
      { label: '世界概览', to: '/world/overview' },
      { label: 'QET 选拔', to: '/world/qet' },
      { label: '编年史', to: '/world/timeline' },
      { label: '组织机构', to: '/world/organizations' },
      { label: '世界设定', to: '/world/settings' },
      { label: '词典与诗歌', to: '/world/dictionary' },
      { label: '未来线', to: '/world/prime-focus' },
    ],
  },
  {
    label: '角色档案', caption: 'CHARACTERS', icon: Users,
    items: [
      { label: '全部', to: '/characters/all' },
      { label: 'M/I/A 家族', to: '/characters/mia-family' },
      { label: '哲华系', to: '/characters/zhehua' },
      { label: '因派系', to: '/characters/yin' },
      { label: '德澜思拓', to: '/characters/delansi' },
      { label: '大人国篇', to: '/characters/grownup-country' },
      { label: '其他', to: '/characters/other' },
    ],
  },
  {
    label: '故事章节', caption: 'STORIES', icon: BookOpen,
    items: [
      { label: "MIA's World", to: '/stories/mia-world' },
      { label: '狐狸与企鹅', to: '/stories/fox-penguin' },
      { label: '镇海炼器宗门', to: '/stories/zhenhai-refining' },
      { label: 'AGI 应许之地', to: '/stories/agi-land' },
      { label: '大人国的小女孩', to: '/stories/little-girl-in-giant-country' },
    ],
  },
  {
    label: '咪呀的空间', caption: 'MIIA SPACE', icon: Sparkles,
    items: [
      { label: '咪呀的世界', to: '/miia/world' },
      { label: '数学笔记', to: '/miia/math' },
      { label: '诗歌碎片', to: '/miia/poems' },
    ],
  },
  {
    label: '数学模型', caption: 'MATH MODELS', icon: Sigma,
    items: [
      { label: 'FSIII 排名', to: '/math/fsiii' },
      { label: 'PEMS-L FLA', to: '/math/fla' },
      { label: '身高体重模型', to: '/math/height-weight' },
    ],
  },
  {
    label: '游戏', caption: 'PLAYGROUND', icon: Gamepad2,
    items: [
      { label: '递归回响', to: '/playground/games/fractal-echo' },
      { label: '可玩游戏', to: '/playground/games' },
      { label: '规则说明', to: '/playground/rules' },
      { label: 'Scratch 小游戏', to: '/playground/scratch' },
    ],
  },
  {
    label: '星海对话', caption: 'DREAMY GPT', icon: MessageCircleMore,
    items: [
      { label: '星海甜梦舱', to: '/chat' },
      { label: '✦ 甜梦舱', to: '/sweetdream' },
    ],
  },
  {
    label: 'AI 设置', caption: 'AI CONTROL', icon: Settings2,
    items: [
      { label: 'BYOK 与模型连接', to: '/settings/ai' },
    ],
  },
];

const directoryEntryCount = navGroups.reduce((total, group) => total + group.items.length, 0);

function routeIsActive(pathname: string, to: string) {
  const path = to.split('?')[0];
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function Navigation({ onSearchClick }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const { isPlaying, isMuted, toggleMusic } = useMusic();
  const musicOn = isPlaying && !isMuted;
  const activeArea = useMemo(() => primaryItems.find((item) => routeIsActive(location.pathname, item.to))?.label ?? '主页', [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}
        className={`aurora-nav aurora-site-navigation ${scrolled || menuOpen ? 'aurora-nav-scrolled' : ''} ${menuOpen ? 'aurora-nav-open' : ''}`}
        aria-label="全站导航"
        data-active-area={activeArea}
      >
        <div className="aurora-nav-inner">
          <Link to="/" className="aurora-brand" aria-label="Neural Connection 主页">
            <span className="aurora-brand-mark"><Brain /></span>
            <span className="aurora-brand-copy"><strong>NEURAL CONNECTION</strong><small>{activeArea} / AURORA ATLAS</small></span>
          </Link>

          <div className="aurora-primary-links" aria-label="主要页面">
            {primaryItems.map(({ label, to, icon: Icon }) => {
              const isActive = routeIsActive(location.pathname, to);
              return (
                <Link key={to} to={to} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined}>
                  <Icon /><span>{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="aurora-nav-actions">
            <button type="button" onClick={onSearchClick} className="aurora-nav-search" aria-label="搜索全站">
              <Search /><span>搜索</span><kbd>Ctrl K</kbd>
            </button>
            <button type="button" onClick={toggleMusic} className={`aurora-icon-button ${musicOn ? 'is-active' : ''}`} aria-label={musicOn ? '关闭音乐' : '开启音乐'} title={musicOn ? '关闭音乐' : '开启音乐'}>
              {musicOn ? <Music2 /> : <VolumeX />}
            </button>
            <button type="button" onClick={() => setMenuOpen((open) => !open)} className={`aurora-menu-button ${menuOpen ? 'is-active' : ''}`} aria-label={menuOpen ? '关闭导航菜单' : '打开全部导航'} aria-expanded={menuOpen} aria-controls="aurora-navigation-panel">
              <span>{menuOpen ? '关闭' : '全部'}</span>{menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div id="aurora-navigation-panel" className="aurora-menu-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
            <motion.div className="aurora-menu-shell" initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }}>
              <div className="aurora-menu-heading">
                <div><span>NEURAL DIRECTORY / {directoryEntryCount} ENTRIES</span><h2>选择一条<span>神经路径</span></h2></div>
                <p>导航层级 = URL 层级。每一层都对应唯一的 URL 路径。</p>
              </div>
              <div className="aurora-menu-grid">
                {navGroups.map(({ label, caption, icon: Icon, items }, groupIndex) => (
                  <section key={label} className="aurora-menu-group">
                    <header><span className="aurora-menu-index">0{groupIndex + 1}</span><Icon /><div><h3>{label}</h3><small>{caption}</small></div></header>
                    <div className="aurora-menu-links">
                      {items.map((item) => {
                        const isActive = routeIsActive(location.pathname, item.to);
                        return (
                          <Link key={item.to} to={item.to} className={isActive ? 'is-active' : ''} aria-current={isActive ? 'page' : undefined}>
                            <span>{item.label}</span><span aria-hidden="true">↗</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <div className="aurora-menu-footer">
                <a href="https://space.bilibili.com/396073700" target="_blank" rel="noopener noreferrer">Nyaumæ <ExternalLink /></a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

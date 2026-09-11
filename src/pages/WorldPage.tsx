import { motion } from 'framer-motion';
import type { KeyboardEvent } from 'react';
import { useLocation, useNavigate, NavLink } from 'react-router';
import { Globe, Trophy, Clock, Building2, ArrowRight, Orbit, BookMarked, Sparkles, Ship } from 'lucide-react';
import WorldOverview from '@/sections/WorldOverview';
import QETSection from '@/sections/QETSection';
import Timeline from '@/sections/Timeline';
import Organizations from '@/sections/Organizations';
import WorldSettings from '@/sections/WorldSettings';
import Dictionary from '@/sections/Dictionary';
import PrimeFocus from '@/sections/PrimeFocus';
import PacificIslands from '@/sections/PacificIslands';
import { AuroraPage, AuroraPanel, AuroraStat } from '@/components/aurora';
import '@/styles/world-textures.css';

const tabs = [
  { key: 'overview', label: '概览', icon: Globe, component: WorldOverview },
  { key: 'qet', label: 'QET选拔', icon: Trophy, component: QETSection },
  { key: 'timeline', label: '编年史', icon: Clock, component: Timeline },
  { key: 'organizations', label: '组织机构', icon: Building2, component: Organizations },
  { key: 'settings', label: '世界设定', icon: Globe, component: WorldSettings },
  { key: 'dictionary', label: '词典与诗歌', icon: BookMarked, component: Dictionary },
  { key: 'pacific-islands', label: '西太平洋', icon: Ship, component: PacificIslands },
  { key: 'prime-focus', label: '未来线', icon: Sparkles, component: PrimeFocus },
];

/* Read tab from URL pathname: /world/qet -> 'qet' */
function getTabFromUrl(pathname: string): string {
  const match = pathname.match(/^\/world\/([^/]+)/);
  return match ? match[1] : 'overview';
}

export default function WorldPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabFromUrl = getTabFromUrl(location.pathname);
  const activeTab = tabFromUrl;

  const current = tabs.find((t) => t.key === activeTab) || tabs[0];
  const Component = current.component;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextKey = tabs[nextIndex].key;
    document.getElementById(`world-tab-${nextKey}`)?.focus();
    navigate(`/world/${nextKey}`);
  };

  return (
    <AuroraPage accent="world" className="aurora-content-page world-aurora-page">
      <div className="world-map-lines" aria-hidden="true" />
      <div className="world-grid-overlay" aria-hidden="true" />
      <div className="aurora-container aurora-content-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-content-hero"
        >
          <div className="aurora-content-copy">
            <p className="aurora-eyebrow">01 / WORLD ARCHIVE</p>
            <h1 className="aurora-title">世界</h1>
            <p className="aurora-lead">12 亿人口的平行数字宇宙。沿着时间、组织与选拔制度，进入这套持续生长的世界观。</p>
            <div className="aurora-hero-signal"><Orbit /><span>NEURAL WORLD SIGNAL</span><ArrowRight /></div>
          </div>
          <AuroraPanel className="aurora-hero-stats">
            <AuroraStat label="POPULATION" value="1.2B+" />
            <AuroraStat label="ARCHIVES" value={String(tabs.length).padStart(2, '0')} />
            <AuroraStat label="STATUS" value="ONLINE" />
          </AuroraPanel>
        </motion.div>

        <div className="aurora-tabs aurora-content-tabs" role="tablist" aria-label="世界观章节">
          {tabs.map((t, index) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.key}
                id={`world-tab-${t.key}`}
                to={`/world/${t.key}`}
                role="tab"
                aria-current={activeTab === t.key ? 'page' : undefined}
                aria-selected={activeTab === t.key}
                aria-controls={`world-panel-${t.key}`}
                tabIndex={activeTab === t.key ? 0 : -1}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={({ isActive }) => `aurora-tab inline-flex items-center gap-2 ${isActive ? 'aurora-tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </NavLink>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="aurora-legacy-content"
          id={`world-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`world-tab-${activeTab}`}
        >
          <Component />
        </motion.div>
      </div>
    </AuroraPage>
  );
}

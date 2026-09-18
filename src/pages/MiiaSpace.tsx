import { motion, AnimatePresence } from 'framer-motion';
import { L } from '@/lib/translations/manual';

import type { KeyboardEvent } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import { Heart, NotebookPen, Feather } from 'lucide-react';
import MiiaWorld from '@/sections/MiiaWorld';
import MiiaMathNotes from '@/sections/MiiaMathNotes';
import ExtraStories from '@/sections/ExtraStories';
import '@/styles/miia-themes.css';

const tabs = [
  { key: 'world', label: '咪呀的世界', icon: Heart, component: MiiaWorld },
  { key: 'math', label: '数学笔记', icon: NotebookPen, component: MiiaMathNotes },
  { key: 'poems', label: '诗歌碎片', icon: Feather, component: ExtraStories },
];

export default function MiiaSpace() {
  const { section = 'world' } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const activeTab = section;

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
    document.getElementById(`miia-tab-${nextKey}`)?.focus();
    navigate(`/miia/${nextKey}`);
  };

  return (
    <div className="aurora-ui aurora-generic-page miia-aurora-page" data-aurora-accent="miia">
      <div className="aurora-container aurora-generic-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-simple-hero"
        >
          <p className="aurora-eyebrow">04 / INNER SPACE</p>
          <h1 className="aurora-title">{L("咪呀的空间 ")}<span className="aurora-title-aside">mī yā</span></h1>
          <p className="aurora-lead">{L("内心独白 · 数学遐想 · 诗歌碎片")}</p>
        </motion.div>

        <div className="aurora-tabs mb-8" role="tablist" aria-label={L("咪呀空间章节")}>
          {tabs.map((t, index) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.key}
                id={`miia-tab-${t.key}`}
                to={`/miia/${t.key}`}
                role="tab"
                aria-current={activeTab === t.key ? 'page' : undefined}
                aria-selected={activeTab === t.key}
                aria-controls={`miia-panel-${t.key}`}
                tabIndex={activeTab === t.key ? 0 : -1}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={({ isActive }) => `aurora-tab miia-space-tab inline-flex items-center gap-2 ${isActive ? 'aurora-tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {L(t.label)}
              </NavLink>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div className="aurora-legacy-content miia-floating-island"
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            data-motion-loop
            id={`miia-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`miia-tab-${activeTab}`}
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

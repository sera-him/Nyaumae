import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useParams } from 'react-router';
import { Heart, NotebookPen, Feather } from 'lucide-react';
import MiiaWorld from '@/sections/MiiaWorld';
import MiiaMathNotes from '@/sections/MiiaMathNotes';
import ExtraStories from '@/sections/ExtraStories';

const tabs = [
  { key: 'world', label: '咪呀的世界', icon: Heart, component: MiiaWorld },
  { key: 'math', label: '数学笔记', icon: NotebookPen, component: MiiaMathNotes },
  { key: 'poems', label: '诗歌碎片', icon: Feather, component: ExtraStories },
];

export default function MiiaSpace() {
  const { section = 'world' } = useParams<{ section: string }>();
  const activeTab = section;

  const current = tabs.find((t) => t.key === activeTab) || tabs[0];
  const Component = current.component;

  return (
    <div className="aurora-ui aurora-generic-page miia-aurora-page" data-aurora-accent="miia">
      <div className="aurora-container aurora-generic-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-simple-hero"
        >
          <p className="aurora-eyebrow">04 / INNER SPACE</p>
          <h1 className="aurora-title">咪呀的空间 <span className="aurora-title-aside">mī yā</span></h1>
          <p className="aurora-lead">内心独白 · 数学遐想 · 诗歌碎片</p>
        </motion.div>

        <div className="aurora-tabs mb-8" role="tablist" aria-label="咪呀空间章节">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <NavLink
                key={t.key}
                to={`/miia/${t.key}`}
                role="tab"
                aria-current={activeTab === t.key ? 'page' : undefined}
                className={({ isActive }) => `aurora-tab inline-flex items-center gap-2 ${isActive ? 'aurora-tab-active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
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
          >
            <Component />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

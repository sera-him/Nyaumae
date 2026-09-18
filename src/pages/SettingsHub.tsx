import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';

import { useNavigate, useParams } from 'react-router';
import { BookMarked, Sparkles } from 'lucide-react';
import Dictionary from '@/sections/Dictionary';
import PrimeFocus from '@/sections/PrimeFocus';

const tabs = [
  { key: 'dictionary', label: '词典与诗歌', icon: BookMarked, component: Dictionary },
  { key: 'prime-focus', label: 'Prime Focus', icon: Sparkles, component: PrimeFocus },
];

export default function SettingsHub() {
  const navigate = useNavigate();
  const { section = 'dictionary' } = useParams<{ section: string }>();
  const activeTab = section;

  const current = tabs.find((t) => t.key === activeTab) || tabs[0];
  const Component = current.component;

  return (
    <div className="aurora-ui aurora-generic-page settings-aurora-page" data-aurora-accent="settings">
      <div className="aurora-container aurora-generic-inner">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aurora-simple-hero"
        >
          <p className="aurora-eyebrow">07 / KNOWLEDGE BASE</p>
          <h1 className="aurora-title">{L("设定集")}</h1>
          <p className="aurora-lead">{L("术语 · 诗歌 · 未来线")}</p>
        </motion.div>

        <div className="aurora-tabs mb-8" role="tablist" aria-label={L("设定集章节")}>
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => {
                  navigate(`/settings/${t.key}`, { replace: true });
                }}
                role="tab" aria-selected={activeTab === t.key} className="aurora-tab inline-flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <motion.div className="aurora-legacy-content"
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Component />
        </motion.div>
      </div>
    </div>
  );
}

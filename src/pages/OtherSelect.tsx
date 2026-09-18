import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import {
  ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, Search, ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router';
import './OtherSelect.css';

const OTHER_TOOLS = [
  {
    id: 'codex',
    name: '全站搜索',
    code: 'SITE SEARCH / 01',
    description: '统一搜索角色、章节、词典、设定、数学与游戏内容，让 AI 带着站内来源一起回答。',
    to: '/codex',
    icon: Search,
    preview: 'linear-gradient(145deg, #eafcff 0%, #d9f4ff 55%, #f2f0ff 100%)',
    accent: '#5fd4d6',
  },
  {
    id: 'nctb',
    name: 'NCTB 认知实验室',
    code: 'COGNITION LAB / 02',
    description: '十个维度、五十道题，一套可中断、可恢复、可解释的本地能力探索闭环。',
    to: '/nctb',
    icon: BrainCircuit,
    preview: 'linear-gradient(145deg, #f0edff 0%, #e6e0ff 55%, #fdf0ff 100%)',
    accent: '#a685ff',
  },
  {
    id: 'analytics',
    name: '数据统计',
    code: 'LOCAL OBSERVATORY / 03',
    description: '把走过的路、停留的时间和搜索过的线索，整理成本机观察报告，可存档与读档。',
    to: '/analytics',
    icon: BarChart3,
    preview: 'linear-gradient(145deg, #fff8e6 0%, #ffefd0 55%, #fff4e6 100%)',
    accent: '#ffc966',
  },
] as const;

const OTHER_TOOLS_EN: Record<string, { name: string; description: string }> = {
  codex: {
    name: 'Site Search',
    description: 'One search across characters, chapters, dictionary, lore, math and games — the AI answers with in-site sources.',
  },
  nctb: {
    name: 'NCTB Cognition Lab',
    description: 'Ten dimensions, fifty questions — an interruptible, resumable, explainable local ability-exploration loop.',
  },
  analytics: {
    name: 'Data Statistics',
    description: 'Turn the paths you walked, the time you stayed and the clues you searched into a local observatory report you can archive and restore.',
  },
};

export default function OtherSelect() {
  const _en = getLocale() === 'en';
  return (
    <div className="other-select-page aurora-ui">
      <div className="other-select-atmosphere" aria-hidden="true" />
      <div className="aurora-container other-select-inner">
        <header className="other-select-hero">
          <p className="aurora-eyebrow">{L("OTHER CONSOLE / 工具选择")}</p>
          <h1 className="aurora-title">{L("选择你的其他工具")}</h1>
          <p className="aurora-lead">{L("全站搜索、认知实验与本机数据统计，三个工具共用一个入口。")}</p>
        </header>

        <div className="other-select-grid">
          {OTHER_TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            const en = OTHER_TOOLS_EN[tool.id];
            const name = _en && en ? en.name : tool.name;
            const description = _en && en ? en.description : tool.description;
            return (
              <motion.article
                key={tool.id}
                className="other-select-card"
                style={{ '--card-accent': tool.accent } as React.CSSProperties}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, delay: .08 * index, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="other-select-preview" style={{ background: tool.preview }}>
                  <Icon className="other-select-preview-icon" aria-hidden="true" />
                  <span className="other-select-preview-label">{tool.code}</span>
                </div>
                <div className="other-select-body">
                  <h2><Icon />{name}</h2>
                  <p>{description}</p>
                  <Link to={tool.to}>
                    {L("进入")}{name}
                    <ArrowRight />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="other-select-workbench">
          <ShieldCheck />
          <div>
            <strong>{L("本机优先")}</strong>
            <span>{L("三个工具都只在本机完成：搜索索引随站点打包，测评可中断恢复，统计可以导出为存档。")}</span>
          </div>
          <Link to="/codex">
            {L("打开全站搜索")}<ArrowUpRight />
          </Link>
        </div>

        <footer className="other-select-foot">
          <Search /><span>{L("按 / 随时打开全站搜索")}</span><ShieldCheck /><span>{L("从顶部导航「其他」也可以随时回到这里")}</span>
        </footer>
      </div>
    </div>
  );
}

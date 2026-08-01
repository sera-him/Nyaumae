import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, BrainCircuit, Flower2, MessageCircleMore, Palette, Sparkles, Waves,
} from 'lucide-react';
import { Link } from 'react-router';
import './ChatSelect.css';

const CHAT_THEMES = [
  {
    id: 'ocean',
    name: '星海甜梦',
    code: 'OCEAN THEME',
    description: '浅色海洋梦境：云朵、行星与柔和渐变，像漂浮在星海里的一场甜梦。',
    to: '/chat/ocean',
    icon: Waves,
    preview: 'linear-gradient(145deg, #fff1f8 0%, #e9faff 55%, #f8efff 100%)',
    accent: '#8ce9ed',
  },
  {
    id: 'sweet',
    name: '甜梦小屋',
    code: 'SWEET THEME',
    description: '粉色甜心小屋：糖果泡泡、奶油云与软软的泡泡，泡芙陪你聊天。',
    to: '/sweetdream',
    icon: Flower2,
    preview: 'linear-gradient(145deg, #ffe4f1 0%, #fff6e9 55%, #ffe3f0 100%)',
    accent: '#ff9ec8',
  },
  {
    id: 'aurora',
    name: '极光星语',
    code: 'AURORA THEME',
    description: '深色极光夜空：极光帷幕、星光与暗夜玻璃，和全站极光外壳同频共振。',
    to: '/chat/aurora',
    icon: Sparkles,
    preview: 'linear-gradient(160deg, #070a1c 0%, #0c0e2c 55%, #1a1030 100%)',
    accent: '#a685ff',
  },
] as const;

export default function ChatSelect() {
  return (
    <main className="chat-select-page aurora-ui">
      <div className="aurora-container chat-select-inner">
        <header className="chat-select-hero">
          <p className="aurora-eyebrow">CHAT CONSOLE / 主题选择</p>
          <h1 className="aurora-title">选择你的聊天空间</h1>
          <p className="aurora-lead">三个主题，同一颗 AI 核心。对话、记忆与角色设置都会跟着你走。</p>
        </header>

        <div className="chat-select-grid">
          {CHAT_THEMES.map((theme, index) => {
            const Icon = theme.icon;
            return (
              <motion.article
                key={theme.id}
                className="chat-select-card"
                data-theme={theme.id}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .5, delay: .08 * index, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="chat-select-preview" style={{ background: theme.preview }}>
                  <span className="chat-select-preview-planet" style={{ background: theme.accent }} />
                  <span className="chat-select-preview-ring" style={{ borderColor: `${theme.accent}66` }} />
                  <span className="chat-select-preview-star" />
                  <span className="chat-select-preview-star" />
                  <span className="chat-select-preview-star" />
                </div>
                <div className="chat-select-body">
                  <span className="chat-select-code">{theme.code}</span>
                  <h2><Icon />{theme.name}</h2>
                  <p>{theme.description}</p>
                  <Link to={theme.to}>
                    进入{theme.name}
                    <ArrowRight />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="chat-select-workbench">
          <BrainCircuit />
          <div>
            <strong>对话工作台</strong>
            <span>记忆与正史管理、系统级对话调试，面向高级用户的完整控制台。</span>
          </div>
          <Link to="/settings/ai">
            打开工作台<ArrowUpRight />
          </Link>
        </div>

        <footer className="chat-select-foot">
          <MessageCircleMore /><span>主题仅影响视觉外观，不会重置对话</span><Palette /><span>随时可以在导航「星海对话」中切换</span>
        </footer>
      </div>
    </main>
  );
}

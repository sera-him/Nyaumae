import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import {
  ArrowRight, ArrowUpRight, BrainCircuit, Flower2, MessageCircleMore, Palette, Sparkles, Waves,
} from 'lucide-react';
import { Link } from 'react-router';
import ResponsiveImage, { DETAIL_IMAGE_WIDTHS } from '@/components/ResponsiveImage';
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
    image: '/chat-themes/ocean-dream.png',
    accent: '#8ce9ed',
  },
  {
    id: 'sweet',
    name: '甜梦小屋',
    code: 'SWEET THEME',
    description: '粉色甜心小屋：糖果泡泡、奶油云与软软的泡泡，泡芙陪你聊天。',
    to: '/chat/sweetdream',
    icon: Flower2,
    preview: 'linear-gradient(145deg, #ffe4f1 0%, #fff6e9 55%, #ffe3f0 100%)',
    image: '/chat-themes/sweet-dream.png',
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
    image: '/chat-themes/aurora-night.png',
    accent: '#a685ff',
  },
] as const;

const CHAT_THEMES_EN: Record<string, { name: string; description: string }> = {
  ocean: {
    name: 'Star Sea Sweet Dream',
    description: 'A light ocean dream: clouds, planets and soft gradients, like floating through a sweet dream in the star sea.',
  },
  sweet: {
    name: 'Sweet Dream Cottage',
    description: 'A pink sweetheart cottage: candy bubbles, cream clouds and soft pops — Puff chats with you.',
  },
  aurora: {
    name: 'Aurora Whisper',
    description: 'A dark aurora night sky: aurora curtains, starlight and night glass, in resonance with the site-wide aurora shell.',
  },
};

export default function ChatSelect() {
  const _en = getLocale() === 'en';
  return (
    <div className="chat-select-page aurora-ui">
      <div className="chat-select-atmosphere" aria-hidden="true" />
      <div className="aurora-container chat-select-inner">
        <header className="chat-select-hero">
          <p className="aurora-eyebrow">{L("CHAT CONSOLE / 主题选择")}</p>
          <h1 className="aurora-title">{L("选择你的聊天空间")}</h1>
          <p className="aurora-lead">{L("三个主题，同一颗 AI 核心。对话、记忆与角色设置都会跟着你走。")}</p>
        </header>

        <div className="chat-select-grid">
          {CHAT_THEMES.map((theme, index) => {
            const Icon = theme.icon;
            const en = CHAT_THEMES_EN[theme.id];
            const name = _en && en ? en.name : theme.name;
            const description = _en && en ? en.description : theme.description;
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
                  <ResponsiveImage
                    className="chat-select-preview-image"
                    src={theme.image}
                    alt=""
                    widths={DETAIL_IMAGE_WIDTHS}
                    sizes="(max-width: 720px) calc(100vw - 48px), 360px"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                  <span className="chat-select-preview-label">THEME PREVIEW</span>
                </div>
                <div className="chat-select-body">
                  <span className="chat-select-code">{theme.code}</span>
                  <h2><Icon />{name}</h2>
                  <p>{description}</p>
                  <Link to={theme.to}>
                    {L("进入")}{name}
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
            <strong>{L("AI 连接设置")}</strong>
            <span>{L("配置模型、运行方式与隐私选项，三个聊天主题会共享这些设置。")}</span>
          </div>
          <Link to="/settings/ai">
            {L("打开设置")}<ArrowUpRight />
          </Link>
        </div>

        <footer className="chat-select-foot">
          <MessageCircleMore /><span>{L("主题仅影响视觉外观，不会重置对话")}</span><Palette /><span>{L("随时可以在导航「星海对话」中切换")}</span>
        </footer>
      </div>
    </div>
  );
}

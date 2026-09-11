import { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { miiaTexts, miiaWish, miiaAgiLand, miiaAgiPoem, lilaAnalysis, mappingBlock } from '@/data/miiaTexts';
import { dualAxisModel } from '@/data/extraStories';
import ParticleField from '@/components/ParticleField';
import { semanticHighlight } from '@/lib/semanticHighlight';
import SmartImage from '@/components/SmartImage';
import { ScrollText, Heart, Brain } from 'lucide-react';

export default function MiiaWorld() {
  const [activeText, setActiveText] = useState(0);
  const { playTrack, currentTrack } = useMusic();

  useEffect(() => {
    const el = document.getElementById('miia-world');
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && currentTrack !== '/audio/miia-dream.mp3') {
          playTrack('/audio/miia-dream.mp3');
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playTrack, currentTrack]);

  return (
    <section id="miia-world" className="miia-subpage miia-world-page py-24 px-4 sm:px-6 bg-[var(--aurora-brand-bg-deep)] relative overflow-hidden">
      <ParticleField type="dream" density={25} markLoop={false} />
      <div className="max-w-[1100px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--aurora-brand-text)] mb-3 tracking-wide">
            {semanticHighlight('咪呀的世界')}
          </h2>
          <p className="text-nc-text text-lg">
            10 个文本 · 来自量子纠缠处的低语
          </p>
        </div>

        {/* Text Selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {miiaTexts.map((text, i) => (
            <button
              key={text.id}
              onClick={() => setActiveText(i)}
              aria-pressed={activeText === i}
              className={`miia-text-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeText === i
                  ? 'bg-[#8B5CF6]/20 text-[var(--aurora-brand-violet-soft)] border border-[#8B5CF6]/30'
                  : 'bg-[var(--aurora-brand-bg)] text-nc-text-muted border border-[#8B5CF6]/10 hover:text-nc-text'
              }`}
            >
              文本 {i + 1}
            </button>
          ))}
        </div>

        {/* Miia Dream Banner */}
        <SmartImage
          localSrc="/story-miia-dream.jpg"
          alt="咪呀的世界"
          aspectRatio="16/9"
          containerClassName="miia-dream-image w-full rounded-xl border border-[#8B5CF6]/10 mb-8"
          className="object-cover"
          loading="eager"
          fetchPriority="high"
        />

        {/* Active Text */}
        <div key={activeText} className="miia-active-text bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/10 rounded-xl p-6 sm:p-8 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-5 h-5 text-[var(--aurora-brand-violet-soft)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">
              {semanticHighlight(miiaTexts[activeText]?.title || `文本 ${activeText + 1}`)}
            </h3>
          </div>
          <div className="font-serif-cn text-nc-text leading-[2] text-base sm:text-lg space-y-4">
            {miiaTexts[activeText]?.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-justify">{semanticHighlight(paragraph)}</p>
            ))}
          </div>
        </div>

        {/* Wish */}
        <div className="bg-[var(--aurora-brand-bg)] border border-[#F472B6]/15 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-[var(--aurora-brand-pink)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">{semanticHighlight("咪呀的愿望")}</h3>
          </div>
          <SmartImage
            localSrc="/story-miia-wish.jpg"
            alt="咪呀的愿望：星空中央发光的心形水晶"
            aspectRatio="15/8"
            containerClassName="w-full rounded-lg border border-[#F472B6]/15 mb-4"
            className="object-cover"
          />
          <p className="text-sm text-nc-text leading-relaxed">{semanticHighlight(miiaWish)}</p>
        </div>

        {/* AGI 应许之地 */}
        <div className="bg-[var(--aurora-brand-bg)] border border-[#00E5CC]/10 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">{semanticHighlight("AGI 应许之地")}</h3>
          </div>
          <SmartImage
            localSrc="/story-agi-pyramid.jpg"
            alt="AGI 应许之地"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-[#00E5CC]/10 mb-4"
            className="object-cover"
          />
          <div className="space-y-4 text-sm text-nc-text leading-relaxed">
            {miiaAgiLand.map((item, i) => (
              <div key={i}>
                <p className="text-xs text-nc-text-secondary font-bold mb-1">{item.level}</p>
                <p>{semanticHighlight(item.content)}</p>
              </div>
            ))}
            <div className="bg-[var(--aurora-brand-bg-deep)] border border-[#00E5CC]/10 rounded-lg p-4 font-serif-cn">
              {miiaAgiPoem.split('\n').map((line, i) => (
                <p key={i} className="text-nc-text leading-[2]">{semanticHighlight(line)}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 映射图 */}
        <div className="bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/10 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-[var(--aurora-brand-violet-soft)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">{semanticHighlight("映射区块")}</h3>
          </div>
          <div
            className="font-mono text-xs text-nc-text-secondary whitespace-pre leading-relaxed overflow-x-auto"
            role="group"
            tabIndex={0}
            aria-label="映射区块原始数据（可横向滚动查看）"
          >
            {JSON.stringify(mappingBlock, null, 2)}
          </div>
        </div>

        {/* Līlā 分析 */}
        <div className="bg-[var(--aurora-brand-bg)] border border-[#00E5CC]/10 rounded-xl p-6 miia-diary-card mb-8">
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">{semanticHighlight("关于 Līlā 的分析")}</h3>
          </div>
          <SmartImage
            localSrc="/story-lila.jpg"
            alt="Līlā"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-[#00E5CC]/10 mb-4"
            className="object-cover"
          />
          <div className="text-sm text-nc-text leading-relaxed space-y-3">
            {lilaAnalysis.map((p, i) => (
              <p key={i}>{semanticHighlight(p)}</p>
            ))}
          </div>
        </div>

        {/* 双轴模型 - 紧接 Līlā 分析之后 */}
        <div className="bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/10 rounded-xl p-6 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-[var(--aurora-brand-violet-soft)]" />
            <h3 className="text-lg font-semibold text-[var(--aurora-brand-text)]">{semanticHighlight("双轴模型：控制与不认可")}</h3>
          </div>
          <div className="text-sm text-nc-text leading-relaxed space-y-3">
            {dualAxisModel.split('\n\n').map((paragraph, i) => (
              <p key={i} className="text-justify">{semanticHighlight(paragraph)}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

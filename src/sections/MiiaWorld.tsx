import { useState, useEffect } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { miiaTexts, miiaWish, miiaAgiLand, miiaAgiPoem, lilaAnalysis, mappingBlock } from '@/data/miiaTexts';
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
    <section id="miia-world" className="miia-subpage miia-world-page py-24 px-4 sm:px-6 bg-[#0D0614] relative overflow-hidden">
      <ParticleField type="dream" density={25} markLoop={false} />
      <div className="max-w-[1100px] mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-3 tracking-wide">
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
                  ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border border-[#8B5CF6]/30'
                  : 'bg-[#100A1A] text-nc-text-muted border border-[#8B5CF6]/10 hover:text-nc-text'
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
        />

        {/* Active Text */}
        <div key={activeText} className="miia-active-text bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 sm:p-8 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-5 h-5 text-[#A78BFA]" />
            <h3 className="text-lg font-semibold text-[#F0E6FF]">
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
        <div className="bg-[#100A1A] border border-[#F472B6]/15 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-[#F472B6]" />
            <h3 className="text-lg font-semibold text-[#F0E6FF]">{semanticHighlight("咪呀的愿望")}</h3>
          </div>
          <p className="text-sm text-nc-text leading-relaxed">{semanticHighlight(miiaWish)}</p>
        </div>

        {/* AGI 应许之地 */}
        <div className="bg-[#100A1A] border border-[#00E5CC]/10 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-5 h-5 text-[#00E5CC]" />
            <h3 className="text-lg font-semibold text-[#F0E6FF]">{semanticHighlight("AGI 应许之地")}</h3>
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
            <div className="bg-[#0D0614] border border-[#00E5CC]/10 rounded-lg p-4 font-serif-cn">
              {miiaAgiPoem.split('\n').map((line, i) => (
                <p key={i} className="text-nc-text leading-[2]">{semanticHighlight(line)}</p>
              ))}
            </div>
          </div>
        </div>

        {/* 映射图 */}
        <div className="bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 mb-8 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-[#A78BFA]" />
            <h3 className="text-lg font-semibold text-[#F0E6FF]">{semanticHighlight("映射区块")}</h3>
          </div>
          <div className="font-mono text-xs text-nc-text-secondary whitespace-pre leading-relaxed overflow-x-auto">
            {JSON.stringify(mappingBlock, null, 2)}
          </div>
        </div>

        {/* Līlā 分析 */}
        <div className="bg-[#100A1A] border border-[#00E5CC]/10 rounded-xl p-6 miia-diary-card">
          <div className="flex items-center gap-3 mb-4">
            <ScrollText className="w-5 h-5 text-[#00E5CC]" />
            <h3 className="text-lg font-semibold text-[#F0E6FF]">{semanticHighlight("关于 Līlā 的分析")}</h3>
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
      </div>
    </section>
  );
}

import {
  extraPoems, poems, chapterIndex, wishSection, correctOverdose, xishouStory,
  absurdNarrative, tinyWish, miiaStoryFragments,
} from '@/data/extraStories';
import {
  paradigmText, rtoText, yearDayFragment, numberFragments,
  f3wCodeLine, dreamPoem,
  badRabbitVersions, huaPoem,
  diminutiveText, rainyDay, sheepsFull,
} from '@/data/fragments';
import {
  Feather, BookOpen, Skull, Sparkles, Hash, Rabbit, CloudRain, Flower2, Baby,
  Code2, Sun, Cpu, Building2, Coins,
} from 'lucide-react';
import { semanticHighlight } from '@/lib/semanticHighlight';
import SmartImage from '@/components/SmartImage';
import React from 'react';

/**
 * Period 2 special coloring: color the Nth character of the Nth line.
 * Line 1 char 1: 应, Line 2 char 2: 常, Line 3 char 3: 伟,
 * Line 4 char 4: 没, Line 5 char 5: 有, Line 6 char 6: 家, Line 7 char 7: 人
 */
function colorizePeriod2(content: string): React.ReactNode[] {
  const lines = content.split('\n');
  const targetColors = [
    'text-cyan-400 font-bold',      // 应
    'text-sky-400 font-bold',       // 常
    'text-amber-400 font-bold',     // 伟
    'text-rose-400 font-bold',      // 没
    'text-violet-400 font-bold',    // 有
    'text-fuchsia-400 font-bold',   // 家
    'text-pink-400 font-bold',      // 人
  ];
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    const targetPos = lineIdx; // 0-indexed, so line 0 → pos 0 (char 1)
    const color = targetColors[lineIdx];
    const lineNodes: React.ReactNode[] = [];

    for (let i = 0; i < line.length; i++) {
      if (i === targetPos && color) {
        lineNodes.push(
          <span key={`${lineIdx}-${i}`} className={color}>{line[i]}</span>
        );
      } else {
        lineNodes.push(<span key={`${lineIdx}-${i}`}>{line[i]}</span>);
      }
    }

    result.push(<span key={lineIdx}>{lineNodes}</span>);
    if (lineIdx < lines.length - 1) {
      result.push(<br key={`br-${lineIdx}`} />);
    }
  });

  return result;
}

/** Rainbow color each Chinese character in a line */
function rainbowLine(text: string): React.ReactNode[] {
  if (!text) return [];
  const rainbow = [
    'text-red-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400',
    'text-lime-400', 'text-green-400', 'text-emerald-400', 'text-teal-400',
    'text-cyan-400', 'text-sky-400', 'text-blue-400', 'text-indigo-400',
    'text-violet-400', 'text-purple-400', 'text-fuchsia-400', 'text-pink-400',
    'text-rose-400',
  ];
  const parts: React.ReactNode[] = [];
  let colorIdx = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const color = rainbow[colorIdx % rainbow.length];
    if (/[\u4e00-\u9fff]/.test(ch)) {
      parts.push(<span key={i} className={`${color} font-semibold`}>{ch}</span>);
      colorIdx++;
    } else if (/\d/.test(ch)) {
      parts.push(<span key={i} className="text-nc-cyan font-mono font-bold text-lg">{ch}</span>);
    } else {
      parts.push(<span key={i} className="text-nc-text-secondary">{ch}</span>);
    }
  }
  return parts;
}

/** Alternate word highlighting for dream poem lines */
const DREAM_LINE_COLORS = [
  'text-cyan-400',
  'text-sky-400',
  'text-blue-400',
  'text-indigo-400',
  'text-violet-400',
  'text-fuchsia-400',
  'text-pink-400',
  'text-rose-400',
  'text-orange-400',
  'text-amber-400',
];

function coloredLine(text: string, lineIndex: number): React.ReactNode {
  const color = DREAM_LINE_COLORS[lineIndex % DREAM_LINE_COLORS.length];
  return <span className={`${color} font-semibold text-[1.1em]`}>{semanticHighlight(text)}</span>;
}

export default function ExtraStories() {
  return (
    <section id="extra-stories" className="miia-poems-section py-24 px-4 sm:px-6 relative">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-4 tracking-wide">{semanticHighlight("诗歌与碎片")}</h2>
          <p className="text-lg text-nc-text-secondary">
            Period 系列 · Corruption 0f Emotion · 更多叙事碎片
          </p>
        </div>

        {/* Newly added standalone stories */}
        <div className="miia-story-fragments mb-12">
          <div className="mb-5 flex items-center gap-2">
            <BookOpen className="h-5 w-5 shrink-0 text-nc-rose" />
            <h3 className="text-lg font-bold text-nc-rose">{semanticHighlight('新收录故事')}</h3>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {miiaStoryFragments.map((story, i) => (
              <article key={story.title} className="miia-story-fragment-card rounded-2xl border border-nc-rose/20 p-6 sm:p-7">
                <div className="mb-5 flex items-start justify-between gap-4 border-b border-nc-rose/15 pb-4">
                  <div>
                    <p className="mb-2 font-mono text-[10px] tracking-[0.18em] text-nc-rose/75 uppercase">STORY FRAGMENT / 0{i + 1}</p>
                    <h4 className="text-xl font-bold text-nc-text sm:text-2xl">{semanticHighlight(story.title)}</h4>
                  </div>
                  <span className="shrink-0 rounded-full border border-nc-rose/20 px-2.5 py-1 text-[10px] text-nc-text-muted">
                    {story.period}
                  </span>
                </div>
                <pre className="whitespace-pre-wrap font-serif-cn text-base leading-[2] text-nc-text-secondary sm:text-[17px]">
                  {semanticHighlight(story.content)}
                </pre>
              </article>
            ))}
          </div>
        </div>

        {/* Poems from Stories */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-nc-rose mb-4 flex items-center gap-2">
            <Feather className="w-5 h-5 shrink-0" />
            {semanticHighlight("故事诗歌")}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {poems.map((poem, i) => (
              <div
                key={i}
                className="bg-nc-bg border border-nc-violet/10 rounded-xl p-5 sm:p-6 hover:border-nc-rose/20 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Feather className="w-4 h-4 text-nc-text-secondary" />
                  <h4 className="text-lg font-semibold text-nc-text">{poem.title}</h4>
                </div>
                <pre className="font-serif-cn text-nc-text leading-[2] whitespace-pre-wrap text-base sm:text-lg">
                  {poem.content.split('\n').map((line, li) => (
                    <span key={li} className="block">{semanticHighlight(line)}</span>
                  ))}
                </pre>
              </div>
            ))}
          </div>
        </div>

        {/* Absurd prose deserves a wide reading column rather than a poem card. */}
        <div className="mb-10">
          <h3 className="text-lg font-bold text-nc-gold mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5 shrink-0" />
            {semanticHighlight("荒诞叙事")}
          </h3>
          <article className="relative overflow-hidden rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] via-nc-bg-secondary to-violet-500/[0.08] p-6 sm:p-9">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/10 blur-2xl" />
            <div className="relative">
              <p className="mb-2 font-mono text-xs tracking-[0.18em] text-amber-300/80 uppercase">
                {absurdNarrative.eyebrow}
              </p>
              <h4 className="mb-5 text-2xl sm:text-3xl font-bold text-nc-text">
                {semanticHighlight(absurdNarrative.title)}
              </h4>
              <p className="max-w-[920px] text-[15px] sm:text-base leading-[2] text-nc-text-secondary">
                {semanticHighlight(absurdNarrative.content)}
              </p>
            </div>
          </article>
        </div>

        {/* The deliberately mismatched scales are easier to scan as a wish list. */}
        <div className="mb-10 rounded-2xl border border-cyan-400/15 bg-nc-bg-secondary p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-nc-cyan" />
            <div>
              <p className="mb-1 text-xs font-mono tracking-[0.16em] text-nc-cyan/80">MINIMAL WISHLIST</p>
              <h3 className="text-xl sm:text-2xl font-bold text-nc-text">{semanticHighlight(tinyWish.title)}</h3>
            </div>
          </div>
          <p className="mb-6 max-w-[920px] text-base sm:text-lg leading-[1.9] text-nc-text">
            {semanticHighlight(tinyWish.content)}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tinyWish.metrics.map((metric, i) => {
              const icons = [Sparkles, Cpu, Building2, Coins];
              const Icon = icons[i];
              return (
                <div key={metric.label} className="rounded-xl border border-white/[0.06] bg-nc-bg/60 p-4">
                  <Icon className="mb-3 h-4 w-4 text-nc-violet" />
                  <p className="mb-1 text-xs text-nc-text-muted">{metric.label}</p>
                  <p className="text-sm sm:text-base font-semibold text-nc-text">{metric.value}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Number Fragments Row - 降临 */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-nc-cyan mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0" />
            {semanticHighlight("碎片：降临")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {numberFragments.slice(0, 8).map((frag, i) => (
              <div key={i} className={`bg-nc-bg-secondary border rounded-lg p-3 sm:p-4 text-center hover:scale-[1.02] transition-transform ${
                [
                  'border-pink-400/20',
                  'border-cyan-400/20',
                  'border-violet-400/20',
                  'border-amber-400/20',
                  'border-rose-400/20',
                  'border-sky-400/20',
                  'border-fuchsia-400/20',
                  'border-emerald-400/20',
                ][i % 8]
              }`}>
                <p className="text-sm text-nc-text leading-relaxed">{rainbowLine(frag)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {numberFragments.slice(8).map((frag, i) => (
              <div key={i} className={`bg-nc-bg-secondary border rounded-lg p-3 sm:p-4 text-center hover:scale-[1.02] transition-transform ${
                ['border-nc-gold/20', 'border-nc-cyan/20'][i % 2]
              }`}>
                <p className="text-sm font-mono text-nc-text leading-relaxed">{semanticHighlight(frag)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Year Day & TaskLens & 408 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
          <div className="bg-nc-bg-secondary border border-nc-gold/20 rounded-xl p-4 sm:p-6">
            <Hash className="w-4 h-4 text-nc-gold mb-3" />
            <pre className="font-mono text-sm text-nc-text-secondary whitespace-pre-wrap">{semanticHighlight(yearDayFragment)}</pre>
          </div>
          <div className="bg-nc-bg-secondary border border-nc-cyan/20 rounded-xl p-4 sm:p-6 text-center sm:text-left">
            <p className="font-mono text-base text-nc-cyan font-bold mb-2">TaskLens 2025</p>
            <p className="font-mono text-2xl text-nc-rose font-bold">Σ = 1314</p>
          </div>
          <div className="bg-nc-bg-secondary border border-nc-violet/20 rounded-xl p-4 sm:p-6 text-center sm:text-left">
            <p className="font-mono text-base text-nc-violet font-bold">{semanticHighlight(rtoText)}</p>
          </div>
        </div>

        {/* Paradigm */}
        <div className="bg-nc-bg-secondary border border-nc-rose/20 rounded-xl p-8 sm:p-10 mb-10">
          <SmartImage
            localSrc="/story-paradigm.jpg"
            alt="Paradigm"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-nc-violet/10 mb-6"
            className="object-cover"
          />
          <pre className="font-serif text-nc-text leading-[2.2] whitespace-pre-wrap text-center text-lg sm:text-xl">
            {semanticHighlight(paradigmText)}
          </pre>
        </div>

        {/* Period / Chapter Index */}
        <div className="bg-nc-bg-secondary border border-nc-violet/15 rounded-xl p-6 sm:p-8 mb-10">
          <h3 className="text-xl font-bold text-nc-text mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-nc-cyan" />
            章节索引
          </h3>
          {chapterIndex.map((period, pi) => (
            <div key={pi} className="mb-5">
              <p className="text-sm font-bold text-nc-rose mb-3 tracking-wider">{period.period}</p>
              {period.chaps.map((chap, ci) => (
                <div key={ci} className="mb-4 ml-4">
                  <p className="text-base font-semibold text-nc-text">{chap.name}</p>
                  {chap.subtitles.length > 0 && (
                    <div className="space-y-1.5 mt-2 ml-4">
                      {chap.subtitles.map((s, si) => (
                        <p key={si} className="text-sm text-nc-text-secondary">{semanticHighlight(s)}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          <pre className="text-base text-nc-text font-mono leading-relaxed whitespace-pre-wrap border-t border-nc-violet/10 pt-5 mt-5">
            {semanticHighlight(wishSection)}
          </pre>
        </div>

        {/* Extra Poems */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {extraPoems.filter(p => p.content).map((poem, i) => (
            <div
              key={i}
              className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6 hover:border-nc-violet/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-4">
                <Feather className="w-4 h-4 text-nc-rose shrink-0" />
                <h4 className="text-lg font-bold text-nc-text">{poem.title}</h4>
                {poem.period && <span className="text-xs text-nc-text-muted font-mono ml-auto">{poem.period}</span>}
              </div>
              {poem.image && (
                <SmartImage
                  localSrc={poem.image}
                  alt={poem.title}
                  aspectRatio="16/9"
                  containerClassName="w-full rounded-lg border border-nc-violet/10 mb-4"
                  className="object-cover"
                />
              )}
              <pre className="font-serif text-nc-text leading-[2.2] whitespace-pre-wrap text-base sm:text-lg">
                {poem.period === '13, 21, 41'
                  ? colorizePeriod2(poem.content)
                  : semanticHighlight(poem.content)}
              </pre>
            </div>
          ))}
        </div>

        {/* id().val.exp.redir()?dif:dis — standalone code fragment */}
        <div className="bg-[#0a0a12] border border-nc-violet/20 rounded-xl p-6 sm:p-8 mb-10">
          <h3 className="text-lg font-bold text-nc-violet mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 shrink-0" />
            {semanticHighlight("碎片：id().val.exp.redir()?dif:dis")}
          </h3>
          <SmartImage
            localSrc="/story-code-poem.jpg"
            alt="id().val.exp"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-nc-violet/10 mb-4"
            className="object-cover"
          />
          <div className="border-l-2 border-nc-cyan/30 pl-4">
            <p className="font-mono text-lg sm:text-xl text-nc-cyan/90 tracking-wider">{f3wCodeLine}</p>
          </div>
          {/* Dream poem follows the code fragment */}
          <div className="border-t border-nc-violet/10 pt-6 mt-6">
            <div className="space-y-2">
              {dreamPoem.slice(0, 5).map((line, i) => (
                <p key={i} className="text-base sm:text-lg font-serif leading-relaxed">
                  {coloredLine(line, i + 5)}
                </p>
              ))}
            </div>
            <div className="border-t border-nc-violet/10 pt-4 mt-4 space-y-2">
              <p className="text-base sm:text-lg font-serif leading-relaxed text-nc-text-muted">
                {semanticHighlight(dreamPoem[5])}
              </p>
              {dreamPoem.slice(6).map((line, i) => (
                <p key={i + 6} className="text-base sm:text-lg font-serif leading-relaxed">
                  {coloredLine(line, i + 10)}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Bad Rabbit - 3 versions */}
        <div className="bg-nc-bg-secondary border border-red-500/15 rounded-xl overflow-hidden mb-10">
          <div className="px-4 sm:px-6 py-4 border-b border-red-500/10 flex items-center gap-2">
            <Rabbit className="w-5 h-5 text-red-400 shrink-0" />
            <h3 className="text-xl font-bold text-nc-text">{semanticHighlight("坏兔子（三个版本）")}</h3>
          </div>
          <SmartImage
            localSrc="/story-bad-rabbit.jpg"
            alt="坏兔子"
            aspectRatio="16/9"
            containerClassName="w-full border-b border-red-500/10"
            className="object-cover"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-nc-violet/10">
            <div className="p-4 sm:p-6">
              <p className="text-xs text-nc-text-muted mb-3 font-bold tracking-wider">版本一</p>
              <p className="text-base text-nc-text leading-relaxed">{semanticHighlight(badRabbitVersions.version1)}</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-xs text-nc-text-muted mb-3 font-bold tracking-wider">版本二</p>
              <p className="text-base text-nc-text leading-relaxed">{semanticHighlight(badRabbitVersions.version2)}</p>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-xs text-nc-text-muted mb-3 font-bold tracking-wider">版本三（萌化）</p>
              <pre className="text-base text-nc-text leading-relaxed whitespace-pre-wrap">{semanticHighlight(badRabbitVersions.version3)}</pre>
            </div>
          </div>
        </div>

        {/* Short poems row - 3 columns after removing duplicate mimiAndMiiaPoem */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
          <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6">
            <Flower2 className="w-4 h-4 text-nc-rose mb-3" />
            <pre className="font-serif text-nc-text leading-[2.2] whitespace-pre-wrap text-base">{semanticHighlight(huaPoem)}</pre>
          </div>
          <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6">
            <Baby className="w-4 h-4 text-nc-gold mb-3" />
            <pre className="text-base text-nc-text leading-relaxed whitespace-pre-wrap">{semanticHighlight(diminutiveText)}</pre>
          </div>
          <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6">
            <CloudRain className="w-4 h-4 text-indigo-400 mb-3" />
            <p className="font-serif text-base text-nc-text leading-relaxed">{rainbowLine(rainyDay)}</p>
          </div>
        </div>

        {/* Sheep's Song */}
        <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-8 text-center mb-10">
          <SmartImage
            localSrc="/story-sheep-song.jpg"
            alt="绵羊之歌"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-nc-violet/10 mb-4"
            className="object-cover"
          />
          <pre className="font-mono text-sm text-nc-text-secondary leading-relaxed whitespace-pre-wrap">
            {semanticHighlight(sheepsFull)}
          </pre>
        </div>

        {/* Correct Overdose */}
        <div className="bg-nc-bg-secondary border border-red-500/15 rounded-xl p-8 sm:p-10 mb-10">
          <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <Skull className="w-5 h-5 shrink-0" />
            Correct Overdose ICU
          </h3>
          <SmartImage
            localSrc="/story-overdose-icu.jpg"
            alt="Correct Overdose ICU"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-red-500/10 mb-6"
            className="object-cover"
          />
          <div className="font-serif text-nc-text leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
            {semanticHighlight(correctOverdose)}
          </div>
        </div>

        {/* XiShou Story */}
        <div className="bg-nc-bg-secondary border border-nc-gold/15 rounded-xl p-8 sm:p-10 mb-10">
          <h3 className="text-xl font-bold text-nc-gold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0" />
            {semanticHighlight("夕兽与年兽")}
          </h3>
          <SmartImage
            localSrc="/story-xishou-nianshou.jpg"
            alt="夕兽与年兽"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg border border-nc-gold/10 mb-6"
            className="object-cover"
          />
          <p className="text-base sm:text-lg text-nc-text leading-relaxed">{semanticHighlight(xishouStory)}</p>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react';
import { useMusic } from '@/contexts/MusicContext';
import { useOverload } from '@/contexts/OverloadContext';
import {
  worldviewNotes, hypothesis, qetWritten, qetPractical,
  miyaCircle, muGuangPlan, xinyuanLog,
  fourDimensionTest, moralPrinciples, moralPrinciplesNote, lawValuesNote, nyaumaeismPrinciples,
} from '@/data/worldSettings';
import {
  p2rDefinition,
} from '@/data/fragments';
import { OverloadCanvas, OverloadToggle, GlitchText } from '@/components/OverloadEffects';
import CollapsibleCard from '@/components/CollapsibleCard';
import { semanticHighlight, cowCatHighlight } from '@/lib/semanticHighlight';
import { Settings, Cat, Scale, Sparkles, Zap, GraduationCap, HeartPulse, BookMarked } from 'lucide-react';
import SmartImage from '@/components/SmartImage';

/** 4D Test result color: gradient from top to bottom (index-based), not id-based */
const RESULT_COLORS = [
  'text-orange-400',   // 0  人人人人 — 橙
  'text-amber-400',    // 1  人人人喵 — 琥珀
  'text-yellow-400',   // 2  人人喵人 — 黄
  'text-lime-400',     // 3  人喵人人 — 黄绿
  'text-green-400',    // 4  喵人人人 — 绿
  'text-emerald-400',  // 5  人人喵喵 — 翠绿
  'text-teal-400',     // 6  人喵人喵 — 青绿
  'text-cyan-400',     // 7  人喵喵人 — 青
  'text-sky-400',      // 8  喵人人喵 — 天蓝
  'text-blue-400',     // 9  喵人喵人 — 蓝
  'text-indigo-400',   // 10 喵喵人人 — 靛蓝
  'text-violet-400',   // 11 人喵喵喵 — 紫罗兰
  'text-purple-400',   // 12 喵人喵喵 — 紫
  'text-fuchsia-400',  // 13 喵喵人喵 — 紫红
  'text-pink-400',     // 14 喵喵喵人 — 粉
  'text-rose-400',     // 15 喵喵喵喵 — 玫瑰红
];

/** Card background tints matching the text colors */
const RESULT_BG_COLORS = [
  'bg-orange-500/10 border-orange-500/20',
  'bg-amber-500/10 border-amber-500/20',
  'bg-yellow-500/10 border-yellow-500/20',
  'bg-lime-500/10 border-lime-500/20',
  'bg-green-500/10 border-green-500/20',
  'bg-emerald-500/10 border-emerald-500/20',
  'bg-teal-500/10 border-teal-500/20',
  'bg-cyan-500/10 border-cyan-500/20',
  'bg-sky-500/10 border-sky-500/20',
  'bg-blue-500/10 border-blue-500/20',
  'bg-indigo-500/10 border-indigo-500/20',
  'bg-violet-500/10 border-violet-500/20',
  'bg-purple-500/10 border-purple-500/20',
  'bg-fuchsia-500/10 border-fuchsia-500/20',
  'bg-pink-500/10 border-pink-500/20',
  'bg-rose-500/10 border-rose-500/20',
];

function get4dResultColor(index: number, total: number): string {
  // No.16 滚滚滚滚 — 特殊红色
  if (index === total - 1) return 'text-red-500 font-bold';
  return RESULT_COLORS[index] || 'text-nc-text';
}

function get4dResultBg(index: number, total: number): string {
  // No.16 滚滚滚滚 — 特殊红色背景
  if (index === total - 1) return 'bg-red-500/10 border-red-500/20';
  return RESULT_BG_COLORS[index] || 'bg-[#1A1025]';
}

// Music follows overload state (manual control only)
function OverloadMusicSync() {
  const { playTrack, stopTrack } = useMusic();
  const { active } = useOverload();
  const prevRef = useRef(false);

  useEffect(() => {
    if (active && !prevRef.current) {
      playTrack('/audio/overload.mp3');
    } else if (!active && prevRef.current) {
      stopTrack();
    }
    prevRef.current = active;
  }, [active, playTrack, stopTrack]);

  return null;
}

// ============================================================
// Four Dimension Test - Interactive Quiz (12 questions, hidden easter egg)
// ============================================================
type Answer = 0 | 1; // 0 = human, 1 = cat

// Shuffle array with Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function FourDimensionTestQuiz() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [resultIndex, setResultIndex] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<typeof fourDimensionTest.questions>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start quiz
  const startQuiz = () => {
    setShuffledQuestions(shuffle(fourDimensionTest.questions));
    setStarted(true);
    setCurrentQ(0);
    setAnswers([]);
    setResultIndex(null);
    setTimedOut(false);
    startTimeout();
  };

  // 30-second inactivity timeout → No.16
  const startTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      setResultIndex(16);
    }, 30000);
  };

  const handleAnswer = (val: 0 | 1) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);

    if (newAnswers.length >= 12) {
      // Calculate result: vote per dimension (majority rules)
      const dimVotes = [0, 0, 0, 0];
      newAnswers.forEach((a, i) => {
        const dim = shuffledQuestions[i].dim;
        dimVotes[dim] += a;
      });
      // 2+ cat votes (out of 3) = cat dimension
      const binary =
        (dimVotes[0] >= 2 ? 1 : 0) * 8 +
        (dimVotes[1] >= 2 ? 1 : 0) * 4 +
        (dimVotes[2] >= 2 ? 1 : 0) * 2 +
        (dimVotes[3] >= 2 ? 1 : 0);
      const idx = fourDimensionTest.results.findIndex((r) => r.id === `No.${binary}`);
      setResultIndex(idx >= 0 ? idx : 0);
    } else {
      setCurrentQ(currentQ + 1);
      startTimeout();
    }
  };

  const reset = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStarted(false);
    setCurrentQ(0);
    setAnswers([]);
    setResultIndex(null);
    setTimedOut(false);
    setShuffledQuestions([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Result display
  if (resultIndex !== null) {
    const r = fourDimensionTest.results[resultIndex];
    return (
      <div className="bg-[#1A1025] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6">
        <div className={`text-center p-6 rounded-lg ${get4dResultBg(resultIndex, fourDimensionTest.results.length)}`}>
          <p className="text-sm text-nc-text-secondary mb-2">{timedOut ? '……你人呢？' : '你的四维测试结果'}</p>
          <h4 className={`text-4xl font-bold font-mono mb-3 ${get4dResultColor(resultIndex, fourDimensionTest.results.length)}`}>
            {r.id}
          </h4>
          <p className="text-base text-nc-text leading-relaxed mb-4">{cowCatHighlight(r.desc)}</p>
          <button
            onClick={reset}
            className="px-5 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 rounded-lg text-sm text-[#A78BFA] transition-all"
          >
            再测一次
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  if (started && shuffledQuestions.length > 0) {
    const q = shuffledQuestions[currentQ];
    const dimName = fourDimensionTest.dimensions[q.dim].name;
    const dimQuestionsDone = answers.filter((_, i) => shuffledQuestions[i].dim === q.dim).length + 1;

    return (
      <div className="bg-[#1A1025] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6">
        {/* Progress bar: 12 segments */}
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentQ ? 'bg-[#8B5CF6]' : i === currentQ ? 'bg-[#8B5CF6]/60' : 'bg-[#8B5CF6]/10'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center mb-5">
          <p className="text-xs text-nc-text-muted">{currentQ + 1} / 12</p>
          <p className="text-xs text-[#00E5CC]/70">{dimName} ({dimQuestionsDone}/3)</p>
        </div>
        <h4 className="text-base text-nc-text mb-5 leading-relaxed">
          {cowCatHighlight(q.human + ' / ' + q.cat)}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer(0)}
            className="p-4 bg-[#8B5CF6]/5 hover:bg-orange-500/10 border border-[#8B5CF6]/10 hover:border-orange-500/30 rounded-lg text-nc-text transition-all text-left"
          >
            <span className="text-sm text-orange-400/80">🐮 {cowCatHighlight(q.human)}</span>
          </button>
          <button
            onClick={() => handleAnswer(1)}
            className="p-4 bg-[#8B5CF6]/5 hover:bg-cyan-500/10 border border-[#8B5CF6]/10 hover:border-cyan-500/30 rounded-lg text-nc-text transition-all text-left"
          >
            <span className="text-sm text-cyan-400/80">🐱 {cowCatHighlight(q.cat)}</span>
          </button>
        </div>
      </div>
    );
  }

  // Start screen (no easter egg hint!)
  return (
    <div className="bg-[#1A1025] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6 text-center">
      <p className="text-nc-text-secondary mb-4">12个问题，测出你的牛马/猫咪属性</p>
      <button
        onClick={startQuiz}
        className="px-8 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-lg font-medium transition-all inline-flex items-center gap-2"
      >
        <span>🐮</span>
        <span>开始测试</span>
        <span>🐱</span>
      </button>
    </div>
  );
}

export default function WorldSettings() {
  return (
    <section id="world-settings" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-3 tracking-wide">{semanticHighlight("世界观详述")}</h2>
          <p className="text-nc-text-secondary text-lg">
            假说 · QET · 映射障碍 · 四维测试 · 哲学原则
          </p>
        </div>

        {/* Notes — 简短，保持展开 */}
        <div id="setting-worldview" className="bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 mb-8 scroll-mt-[100px]">
          <h3 className="text-base font-semibold text-nc-text mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#8B5CF6]" />
            世界观说明
          </h3>
          {worldviewNotes.map((n, i) => (
            <p key={i} className="text-base text-nc-text-secondary leading-relaxed mb-2">{semanticHighlight(n)}</p>
          ))}
          <p className="text-base text-nc-text mt-3 font-medium">{semanticHighlight(hypothesis)}</p>
        </div>

        {/* Miya Circle, MuGuang, Xinyuan — 三张小卡片，简短，保持展开 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div id="setting-miya-circle" className="bg-[#100A1A] border border-[#F472B6]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[#F472B6] mb-2">{semanticHighlight("米雅朋友圈")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(miyaCircle)}</p>
          </div>
          <div id="setting-muguang" className="bg-[#100A1A] border border-[#00E5CC]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[#00E5CC] mb-2">{semanticHighlight("沐光计划")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(muGuangPlan)}</p>
          </div>
          <div id="setting-xinyuan" className="bg-[#100A1A] border border-[#8B5CF6]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[#8B5CF6] mb-2">{semanticHighlight("心渊日志")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(xinyuanLog)}</p>
          </div>
        </div>

        {/* 心界 VRlog 实景记录 */}
        <div className="mb-8 rounded-2xl border border-[#8B5CF6]/15 bg-[#100A1A] p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[#A78BFA]">
                Xinyuan VRlog / Field Notes
              </p>
              <h3 className="text-xl font-semibold text-[#F0E6FF]">
                {semanticHighlight("心界 · 海岛实景记录")}
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-nc-text-muted sm:text-right">
              林浅的私人镜头：驾驶玉桂狗主题座驾，穿过彩虹花田与巨型鸭鸭乐园。
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <figure className="group overflow-hidden rounded-xl border border-[#F472B6]/15 bg-[#0D0614]">
              <SmartImage
                localSrc="/xinjie-vr-rainbow-drive.png"
                alt="心界 VR 中，玉桂狗主题座驾停在彩虹与蓝色花田前"
                aspectRatio="1024/476"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[#F0E6FF]">彩虹花田</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-nc-text-muted">VRLOG 01</span>
              </figcaption>
            </figure>

            <figure className="group overflow-hidden rounded-xl border border-[#00E5CC]/15 bg-[#0D0614]">
              <SmartImage
                localSrc="/xinjie-vr-duck-island.png"
                alt="心界 VR 中，玉桂狗主题座驾停在巨型黄色鸭鸭乐园旁"
                aspectRatio="1024/476"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[#F0E6FF]">鸭鸭乐园</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-nc-text-muted">VRLOG 02</span>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* p₂r Definition — 折叠卡片 */}
        <CollapsibleCard
          id="setting-p2r"
          title={semanticHighlight("亲缘距离公式 p₂r")}
          summary={semanticHighlight("角色之间亲密度由公式 p₂r = Σ(互动强度 × 情感共鸣) / Σ(时间衰减) 计算，例：墨璇玥.iv 与咪呀 p₂r=1.498")}
          icon={<HeartPulse className="w-5 h-5 text-[#00E5CC]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/10"
        >
          <div className="p-6">
            <code className="font-mono text-lg text-[#00E5CC]">{p2rDefinition}</code>
            <p className="text-sm text-nc-text-secondary mt-2">
              {semanticHighlight("例：墨璇玥.iv 与咪呀 p₂r=1.498，与 Mia p₂r=0.970，与米娅 p₂r=0.970")}
            </p>
          </div>
        </CollapsibleCard>

        {/* QET Detailed Rules — 折叠卡片 */}
        <CollapsibleCard
          id="setting-qet"
          title={semanticHighlight("QET 详细规则")}
          summary={semanticHighlight("笔试 500 分 + 机试 500 分，最高 65536 人报考，笔试通过率 256/65536，机试通过率 16/256，含 ICPC 赛制 Penalty 规则")}
          icon={<GraduationCap className="w-5 h-5 text-[#F59E0B]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F59E0B]/15"
        >
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#8B5CF6]/10">
            <div className="p-5">
              <p className="text-xs font-mono text-[#F59E0B] mb-2">笔试 {qetWritten.score} 分</p>
              <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlight(qetWritten.rules)}</p>
            </div>
            <div className="p-5">
              <p className="text-xs font-mono text-[#F59E0B] mb-2">机试 {qetPractical.score} 分</p>
              <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlight(qetPractical.rules)}</p>
            </div>
          </div>
        </CollapsibleCard>

        {/* Four Dimension Test — 折叠卡片（互动的测验部分在展开后显示） */}
        <CollapsibleCard
          id="setting-4d"
          title={semanticHighlight("四维测试：牛马人格 vs 猫咪喵格")}
          summary={semanticHighlight("12 道互动题测出你的四维人格（获取/休息/努力/社交），判断牛属性还是猫属性，共 17 种结果")}
          icon={<Cat className="w-5 h-5 text-[#00E5CC]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {fourDimensionTest.dimensions.map((dim, i) => (
                <div key={i} className="border border-[#8B5CF6]/10 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[#00E5CC] mb-2">{semanticHighlight(dim.name)}</h4>
                  <p className="text-sm text-nc-text-secondary mb-1">
                    <span className="mr-1">🐮</span>
                    <span className="text-orange-400/80">{cowCatHighlight(dim.human)}</span>
                  </p>
                  <p className="text-sm text-nc-text-secondary">
                    <span className="mr-1">🐱</span>
                    <span className="text-cyan-400/80">{cowCatHighlight(dim.cat)}</span>
                  </p>
                </div>
              ))}
            </div>
            {/* Interactive Test */}
            <FourDimensionTestQuiz />

            <h4 className="text-sm font-semibold text-nc-text mb-3">{semanticHighlight("17 种结果")}</h4>
            {/* 4D Test Banner */}
            <div className="mb-6">
              <SmartImage
                localSrc="/4d-test-banner.jpg"
                alt="四维测试：牛马人格 vs 猫咪喵格"
                aspectRatio="16/9"
                containerClassName="w-full rounded-xl border border-[#8B5CF6]/20 shadow-lg"
                className="object-cover"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {fourDimensionTest.results.map((r, idx) => (
                <div key={r.id} className={`text-sm text-nc-text-secondary border rounded-md p-2.5 ${get4dResultBg(idx, fourDimensionTest.results.length)}`}>
                  <span className={`font-mono font-bold mr-1 ${get4dResultColor(idx, fourDimensionTest.results.length)}`}>{r.id}</span>
                  {cowCatHighlight(r.desc)}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* Moral Principles — 折叠卡片 */}
        <CollapsibleCard
          id="setting-moral"
          title={semanticHighlight("哲学原则")}
          summary={semanticHighlight("包括灾难性伤害原则、权利不可侵犯原则、道德普遍化、责任连带原则、自由化约原则等 6 条核心准则")}
          icon={<Scale className="w-5 h-5 text-[#8B5CF6]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-nc-text-muted italic border-l-2 border-nc-text-muted/20 pl-3">
              {moralPrinciplesNote}
            </p>
            <p className="text-xs text-nc-cyan italic border-l-2 border-nc-cyan/20 pl-3">
              {lawValuesNote}
            </p>
            {moralPrinciples.map((p) => (
              <div key={p.id} id={`setting-moral-${p.id}`} className="border-l-2 border-[#8B5CF6]/30 pl-4 scroll-mt-[100px]">
                <h4 className="text-base font-semibold text-nc-text mb-1">{p.id}. {semanticHighlight(p.title)}</h4>
                <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlight(p.content)}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* Nyaumaeism Principles */}
        <CollapsibleCard
          id="nyaumaeism"
          title={"Nyaumæism"}
          summary={"Nyaumæ 是一名 2 年级学生提出的哲学体系"}
          icon={<BookMarked className="w-4 h-4 text-[#00E5CC]" />}
          borderColor="border-[#00E5CC]/20"
          titleColor="text-[#00E5CC]"
          defaultExpanded={false}
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-[#00E5CC] italic border-l-2 border-[#00E5CC]/20 pl-3">
              Nyaumæ 是一名 2 年级学生。以下是这名学生提出的七条哲学原则。
            </p>
            {nyaumaeismPrinciples.map((p) => (
              <div key={p.id} className="border-l-2 border-[#00E5CC]/20 pl-4">
                <h4 className="text-base font-semibold text-nc-text mb-1">{p.id}. {p.title}</h4>
                <p className="text-sm text-nc-text-secondary leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* Sensory Overload Zone - auto-triggers on scroll */}
        <OverloadMusicSync />
        <section id="overload" className="relative bg-[#0A0510] border border-[#EF4444]/20 rounded-xl overflow-hidden mb-8">
          <OverloadCanvas />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[#EF4444]" />
                <h3 className="text-lg font-semibold text-nc-text">
                  <GlitchText text="Info Overload · 感官过载区域" />
                </h3>
              </div>
              <OverloadToggle />
            </div>

            <div className="space-y-4">
              <div className="bg-[#100A1A]/80 border border-[#EF4444]/10 rounded-lg p-4">
                <p className="text-base text-nc-text-secondary leading-relaxed">
                  <GlitchText text="这是一个信息过载的模拟区域。当你激活感官过载，系统将模拟一部分人在面对过度感官输入时的体验——视觉干扰、信息噪音、认知负荷超载。" />
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#100A1A]/80 border border-[#8B5CF6]/10 rounded-lg p-3">
                  <p className="text-xs text-[#8B5CF6] font-bold mb-1">视觉干扰</p>
                  <p className="text-sm text-nc-text-secondary">{'扫描线闪烁、随机条纹、画面扭曲'}</p>
                </div>
                <div className="bg-[#100A1A]/80 border border-[#00E5CC]/10 rounded-lg p-3">
                  <p className="text-xs text-[#00E5CC] font-bold mb-1">文字故障</p>
                  <p className="text-sm text-nc-text-secondary">{'字符错位、重影、随机替换'}</p>
                </div>
                <div className="bg-[#100A1A]/80 border border-[#EF4444]/10 rounded-lg p-3">
                  <p className="text-xs text-[#EF4444] font-bold mb-1">信息轰炸</p>
                  <p className="text-sm text-nc-text-secondary">{'碎片文字高速飞入飞出'}</p>
                </div>
              </div>
              <p className="text-[10px] text-nc-text-muted text-center mt-2">
                滚动进入此区域自动触发感官过载体验（含音频）
              </p>
            </div>
          </div>
        </section>
        <div className="bg-[#100A1A] border border-[#F472B6]/15 rounded-xl p-6 sm:p-8">
          <h3 className="text-base font-semibold text-[#F472B6] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            《复数域公主梦》
          </h3>
          <p className="text-base text-nc-text-secondary leading-relaxed">
            {semanticHighlight("世界观下已有不是二次元的VR游戏《复数域公主梦》，这部作品的女主林可梦（linkmo）是一名梦想成为公主的小镇做题家。但是其实她本来就是公主，是数电大魔王卡塔斯（Quartus）强行修改了世界观，利用分形将其映射到复数域世界观，扭曲了众人的认知。")}
          </p>
        </div>
      </div>
    </section>
  );
}

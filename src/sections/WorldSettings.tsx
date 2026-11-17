import { useEffect, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { useMusic } from '@/contexts/MusicContext';
import { useOverload } from '@/contexts/OverloadContext';
import {
  worldviewNotes, hypothesis,
  miyaCircle, muGuangPlan, xinyuanLog,
  fourDimensionTest, moralPrinciples, moralPrinciplesNote, lawValuesNote, nyaumaeismPrinciples,
  citizenLevelSystem, teacherVotingRule, workplaceBlindnessRule, specialChildrenNotes, autismFeatures,
  miiaSchoolRules, elderSystemNote, aiEnergyNote, combatSkillCosts, sentencingRule, zamZamNote, mindBallRaceNote, winterBreakNote, reverseTeacherDreamNote, swingSchedulingNote, sacrificeNote, reverseToChildNote, medicationAccessNote, meltdownFieldNote, beanChainNote, painConstitutionNote, weekdayPunNote, nyaumaeEraNote, livingSpaceNote, fairnessRulesNote, sentencingRangeNote, destigmatizationNote, parentPayingLawNote, ll1ParsingNote, balanceOrRandomNote, childAutonomyNote, hateScoreFormulaNote, fundraisingRule, perpetualFiveVirusNote,
  selfChosenAgeNote, childPrivilegeMembershipNote, victimCappedPenaltyNote, externalGoodnessTestNote, rightToRefuseGrowthNote,
  arkAdmissionRules, optionPowerRules, fireDefinitionNote, dbPcfNote,
  cacheHitPuzzleNote, noahWorldScenarioNote, willSpecialChildNote,
  jurisdictionFourRules, falsePainTestNote, ageDigitTitles, cayleyDicksonLedger,
  candyOmegaParadox, concurrencyLocksNote, csLayersNote,
} from '@/data/worldSettings';
import {
  citizenLevelSystemEn, teacherVotingRuleEn, workplaceBlindnessRuleEn, specialChildrenNotesEn, autismFeaturesEn,
  miiaSchoolRulesEn, elderSystemNoteEn, aiEnergyNoteEn, combatSkillCostsEn, sentencingRuleEn, zamZamNoteEn, mindBallRaceNoteEn, winterBreakNoteEn, reverseTeacherDreamNoteEn, swingSchedulingNoteEn, sacrificeNoteEn, reverseToChildNoteEn, medicationAccessNoteEn, meltdownFieldNoteEn, beanChainNoteEn, painConstitutionNoteEn, weekdayPunNoteEn, nyaumaeEraNoteEn, livingSpaceNoteEn, fairnessRulesNoteEn, sentencingRangeNoteEn, destigmatizationNoteEn, parentPayingLawNoteEn, ll1ParsingNoteEn, balanceOrRandomNoteEn, childAutonomyNoteEn, hateScoreFormulaNoteEn, fundraisingRuleEn, perpetualFiveVirusNoteEn,
  selfChosenAgeNoteEn, childPrivilegeMembershipNoteEn, victimCappedPenaltyNoteEn, externalGoodnessTestNoteEn, rightToRefuseGrowthNoteEn,
  arkAdmissionRulesEn, optionPowerRulesEn, fireDefinitionNoteEn, dbPcfNoteEn,
  cacheHitPuzzleNoteEn, noahWorldScenarioNoteEn, willSpecialChildNoteEn,
  jurisdictionFourRulesEn, falsePainTestNoteEn, ageDigitTitlesEn, cayleyDicksonLedgerEn,
  candyOmegaParadoxEn, concurrencyLocksNoteEn, csLayersNoteEn,
} from '@/data/worldSettings.en';
import {
  p2rDefinition,
} from '@/data/fragments';
import { OverloadCanvas, OverloadToggle, GlitchText } from '@/components/OverloadEffects';
import CollapsibleCard from '@/components/CollapsibleCard';
import { semanticHighlight, semanticHighlightProse, cowCatHighlight } from '@/lib/semanticHighlight';
import { Settings, Cat, Scale, Sparkles, Zap, GraduationCap, HeartPulse, BookMarked, Landmark, Cpu, Swords, Gavel, Eye, Trophy, Clock, HeartCrack, HandCoins, Bug, IdCard, Brain, Baby, Ship, Coins, PiggyBank } from 'lucide-react';
import SmartImage from '@/components/SmartImage';
import { confirmAction } from '@/lib/confirmAction';
import LandAllocationPolicy from '@/sections/LandAllocationPolicy';

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
  return RESULT_BG_COLORS[index] || 'bg-[var(--aurora-brand-bg-raised)]';
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
    if (started && !confirmAction({
      title: '重置四维测试进度？',
      consequence: '当前已作答题目、计时和本次结果都会清空。',
    })) return;
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
      <div className="world-test-result bg-[var(--aurora-brand-bg-raised)] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6">
        <div className={`text-center p-6 rounded-lg ${get4dResultBg(resultIndex, fourDimensionTest.results.length)}`}>
          <p className="text-sm text-nc-text-secondary mb-2">{timedOut ? '……你人呢？' : '你的四维测试结果'}</p>
          <h4 className={`text-4xl font-bold font-mono mb-3 ${get4dResultColor(resultIndex, fourDimensionTest.results.length)}`}>
            {r.id}
          </h4>
          <p className="text-base text-nc-text leading-relaxed mb-4">{cowCatHighlight(r.desc)}</p>
          <button
            onClick={reset}
            className="px-5 py-2 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 rounded-lg text-sm text-[var(--aurora-brand-violet-soft)] transition-all"
          >
            {L("再测一次\r\n          ")}</button>
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
      <div className="world-test-question bg-[var(--aurora-brand-bg-raised)] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6">
        {/* Progress bar: 12 segments */}
        <div className="flex gap-0.5 mb-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i < currentQ ? 'bg-[var(--aurora-brand-violet)]' : i === currentQ ? 'bg-[#8B5CF6]/60' : 'bg-[#8B5CF6]/10'
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
            className="world-test-choice p-4 bg-[#8B5CF6]/5 hover:bg-orange-500/10 border border-[#8B5CF6]/10 hover:border-orange-500/30 rounded-lg text-nc-text transition-all text-left"
          >
            <span className="text-sm text-orange-400/80">🐮 {cowCatHighlight(q.human)}</span>
          </button>
          <button
            onClick={() => handleAnswer(1)}
            className="world-test-choice p-4 bg-[#8B5CF6]/5 hover:bg-cyan-500/10 border border-[#8B5CF6]/10 hover:border-cyan-500/30 rounded-lg text-nc-text transition-all text-left"
          >
            <span className="text-sm text-cyan-400/80">🐱 {cowCatHighlight(q.cat)}</span>
          </button>
        </div>
      </div>
    );
  }

  // Start screen (no easter egg hint!)
  return (
    <div className="world-test-start bg-[var(--aurora-brand-bg-raised)] border border-[#8B5CF6]/20 rounded-xl p-6 mb-6 text-center">
      <p className="text-nc-text-secondary mb-4">{L("12个问题，测出你的牛马/猫咪属性")}</p>
      <button
        onClick={startQuiz}
        className="px-8 py-3 bg-[var(--aurora-brand-violet)] hover:bg-[var(--aurora-brand-violet-deep)] text-white rounded-lg font-medium transition-all inline-flex items-center gap-2"
      >
        <span>🐮</span>
        <span>{L("开始测试")}</span>
        <span>🐱</span>
      </button>
    </div>
  );
}

export default function WorldSettings() {
  const _en = getLocale() === 'en';
  const citizenLevelText = _en ? citizenLevelSystemEn : citizenLevelSystem;
  const teacherVotingText = _en ? teacherVotingRuleEn : teacherVotingRule;
  const workplaceBlindText = _en ? workplaceBlindnessRuleEn : workplaceBlindnessRule;
  const specialChildren = _en ? specialChildrenNotesEn : specialChildrenNotes;
  const schoolRules = _en ? miiaSchoolRulesEn : miiaSchoolRules;
  const elderText = _en ? elderSystemNoteEn : elderSystemNote;
  const aiEnergyText = _en ? aiEnergyNoteEn : aiEnergyNote;
  const skillCosts = _en ? combatSkillCostsEn : combatSkillCosts;
  const sentencing = _en ? sentencingRuleEn : sentencingRule;
  const zamZamText = _en ? zamZamNoteEn : zamZamNote;
  const mindBallRaceText = _en ? mindBallRaceNoteEn : mindBallRaceNote;
  const winterBreakText = _en ? winterBreakNoteEn : winterBreakNote;
  const reverseTeacherDreamText = _en ? reverseTeacherDreamNoteEn : reverseTeacherDreamNote;
  const swingSchedulingText = _en ? swingSchedulingNoteEn : swingSchedulingNote;
  const sacrificeText = _en ? sacrificeNoteEn : sacrificeNote;
  const reverseToChildText = _en ? reverseToChildNoteEn : reverseToChildNote;
  const medicationAccessText = _en ? medicationAccessNoteEn : medicationAccessNote;
  const meltdownFieldText = _en ? meltdownFieldNoteEn : meltdownFieldNote;
  const beanChainText = _en ? beanChainNoteEn : beanChainNote;
  const painConstitutionText = _en ? painConstitutionNoteEn : painConstitutionNote;
  const weekdayPunText = _en ? weekdayPunNoteEn : weekdayPunNote;
  const nyaumaeEraText = _en ? nyaumaeEraNoteEn : nyaumaeEraNote;
  const livingSpaceText = _en ? livingSpaceNoteEn : livingSpaceNote;
  const fairnessRulesText = _en ? fairnessRulesNoteEn : fairnessRulesNote;
  const sentencingRangeText = _en ? sentencingRangeNoteEn : sentencingRangeNote;
  const destigmatizationText = _en ? destigmatizationNoteEn : destigmatizationNote;
  const parentPayingLawText = _en ? parentPayingLawNoteEn : parentPayingLawNote;
  const ll1ParsingText = _en ? ll1ParsingNoteEn : ll1ParsingNote;
  const balanceOrRandomText = _en ? balanceOrRandomNoteEn : balanceOrRandomNote;
  const childAutonomyText = _en ? childAutonomyNoteEn : childAutonomyNote;
  const hateScoreText = _en ? hateScoreFormulaNoteEn : hateScoreFormulaNote;
  const fundraisingRules = _en ? fundraisingRuleEn : fundraisingRule;
  const perpetualFiveText = _en ? perpetualFiveVirusNoteEn : perpetualFiveVirusNote;
  const selfChosenAgeText = _en ? selfChosenAgeNoteEn : selfChosenAgeNote;
  const childPrivilegeMembershipText = _en ? childPrivilegeMembershipNoteEn : childPrivilegeMembershipNote;
  const victimCappedPenaltyText = _en ? victimCappedPenaltyNoteEn : victimCappedPenaltyNote;
  const externalGoodnessTestText = _en ? externalGoodnessTestNoteEn : externalGoodnessTestNote;
  const rightToRefuseGrowthText = _en ? rightToRefuseGrowthNoteEn : rightToRefuseGrowthNote;
  const arkAdmissionList = _en ? arkAdmissionRulesEn : arkAdmissionRules;
  const optionPowerList = _en ? optionPowerRulesEn : optionPowerRules;
  const autismDomains = _en ? autismFeaturesEn : autismFeatures;
  const fireDefinitionText = _en ? fireDefinitionNoteEn : fireDefinitionNote;
  const dbPcfText = _en ? dbPcfNoteEn : dbPcfNote;
  const cacheHitText = _en ? cacheHitPuzzleNoteEn : cacheHitPuzzleNote;
  const noahScenarioText = _en ? noahWorldScenarioNoteEn : noahWorldScenarioNote;
  const willSpecialChildText = _en ? willSpecialChildNoteEn : willSpecialChildNote;
  const jurisdictionText = _en ? jurisdictionFourRulesEn : jurisdictionFourRules;
  const falsePainText = _en ? falsePainTestNoteEn : falsePainTestNote;
  const ageDigitList = _en ? ageDigitTitlesEn : ageDigitTitles;
  const cayleyDicksonText = _en ? cayleyDicksonLedgerEn : cayleyDicksonLedger;
  const candyOmegaText = _en ? candyOmegaParadoxEn : candyOmegaParadox;
  const concurrencyLocksText = _en ? concurrencyLocksNoteEn : concurrencyLocksNote;
  const csLayersText = _en ? csLayersNoteEn : csLayersNote;
  return (
    <section id="world-settings" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-3 tracking-wide">{semanticHighlight("世界观详述")}</h2>
          <p className="text-nc-text-secondary text-lg">
            {L("假说 · QET · 映射障碍 · 四维测试 · 哲学原则\r\n          ")}</p>
        </div>

        {/* Notes — 简短，保持展开 */}
        <nav className="sticky top-0 z-30 -mx-4 sm:-mx-6 mb-10 border-b border-[#8B5CF6]/15 bg-[var(--aurora-brand-bg)]/92 backdrop-blur px-4 sm:px-6 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {([
              ['ws-part-1', '总纲', 'Foundations'],
              ['ws-part-2', '推演', 'Speculation'],
              ['ws-part-3', '制度', 'Institutions'],
              ['ws-part-4', '儿童', 'Childhood'],
              ['ws-part-5', '技术', 'Technology'],
              ['ws-part-6', '法律', 'Law'],
            ] as Array<[string, string, string]>).map(([id, zh, en]) => (
              <a
                key={id}
                href={'#' + id}
                className="shrink-0 rounded-full border border-[#8B5CF6]/20 px-3 py-1 text-xs font-medium text-nc-text-secondary transition-colors hover:border-[var(--aurora-brand-violet)] hover:text-nc-text"
              >
                {_en ? en : zh}
              </a>
            ))}
          </div>
        </nav>
        <div id="setting-worldview" className="bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/10 rounded-xl p-6 mb-8 scroll-mt-[100px]">
          <h3 className="text-base font-semibold text-nc-text mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[var(--aurora-brand-violet)]" />
            {L("世界观说明\r\n          ")}</h3>
          {worldviewNotes.map((n, i) => (
            <p key={i} className="text-base text-nc-text-secondary leading-relaxed mb-2">{semanticHighlightProse(n)}</p>
          ))}
          <p className="text-base text-nc-text mt-3 font-medium">{semanticHighlightProse(hypothesis)}</p>
        </div>

        {/* 国别来源提示：这些规则可能来自世界中的不同国家 */}
        <div className="bg-[var(--aurora-brand-bg-raised)] border border-[#FFD17A]/15 rounded-xl p-4 mb-8 scroll-mt-[100px]">
          <p className="text-sm text-nc-text-secondary leading-relaxed">
            {_en
              ? "Note: the rules below come from several parallel thought-experiments and may belong to different nations or polities within this world. They need not be mutually compatible, so please do not assume they form a single unified legal system."
              : semanticHighlight("阅读提示：以下规则来自多个平行设想，可能分属这个世界中的不同国家与政体，彼此未必兼容，请勿默认它们同属一套法律。")}
          </p>
        </div>

        {/* ===== PART 01 总纲与评判 ===== */}
        <div id="ws-part-1" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 01</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'Foundations & Judgment' : '总纲与评判'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '7 entries' : '7 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'What this world measures by: relatedness, principles, external judgment, false pain, FIRE and the epoch.' : '这个世界的评判尺度从哪里来——亲缘公式、哲学原则、外部判定、假痛苦、FIRE 与纪元。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-land-allocation"
          title={semanticHighlight("公平随机土地分配制度（修订稿）")}
          summary={semanticHighlight("每个人拥有同样的、不可交易的土地竞争权重，可以自主选择土地；多人竞争时按照相对权重公开随机抽签。")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          borderColor="border-[#00E5CC]/20"
          titleColor="text-[var(--aurora-brand-cyan)]"
        >
          <LandAllocationPolicy embedded />
        </CollapsibleCard>

        {/* 心界 VRlog 实景记录 */}
        <div className="mb-8 rounded-2xl border border-[#8B5CF6]/15 bg-[var(--aurora-brand-bg)] p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[var(--aurora-brand-green)]">
                {semanticHighlight("海岛实景记录")}
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-nc-text-muted sm:text-right">
              {L("记录两处海岛场景的实拍感画面，保留旅途中那种明亮、轻松的氛围。\r\n            ")}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <figure className="group overflow-hidden rounded-xl border border-[#F472B6]/15 bg-[var(--aurora-brand-bg-deep)]">
              <SmartImage
                localSrc="/xinjie-vr-rainbow-drive.png"
                alt={L("海岛实景记录：彩虹花田场景中的玉桂狗主题座驾")}
                aspectRatio="1024/476"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[var(--aurora-brand-text)]">{L("彩虹花田")}</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--aurora-brand-green)]">VRLOG 01</span>
              </figcaption>
            </figure>

            <figure className="group overflow-hidden rounded-xl border border-[#00E5CC]/15 bg-[var(--aurora-brand-bg-deep)]">
              <SmartImage
                localSrc="/xinjie-vr-duck-island.png"
                alt={L("海岛实景记录：鸭鸭乐园场景中的玉桂狗主题座驾")}
                aspectRatio="1024/476"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[var(--aurora-brand-text)]">{L("鸭鸭乐园")}</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--aurora-brand-green)]">VRLOG 02</span>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* 云端小景：云上小屋与坐云的小猫 */}
        <div className="mb-8 rounded-2xl border border-[#00E5CC]/15 bg-[var(--aurora-brand-bg)] p-4 sm:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-[var(--aurora-brand-cyan)]">
                {semanticHighlight("云端小景")}
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-nc-text-muted sm:text-right">
              {L("云上的小屋、贝壳与秋千，还有坐在云端拿棒棒糖的小猫——蓝白色调的梦幻片段。")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="group overflow-hidden rounded-xl border border-[#8B5CF6]/15 bg-[var(--aurora-brand-bg-deep)]">
              <SmartImage
                localSrc="/dream-cloud-house.png"
                alt={L("云端小景：云朵上的蓝白色小屋，墙上嵌着贝壳，屋檐挂着小秋千，远处一道彩虹")}
                aspectRatio="1/1"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[var(--aurora-brand-text)]">{L("云上小屋")}</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--aurora-brand-cyan)]">VRLOG 03</span>
              </figcaption>
            </figure>

            <figure className="group overflow-hidden rounded-xl border border-[#F472B6]/15 bg-[var(--aurora-brand-bg-deep)]">
              <SmartImage
                localSrc="/dream-cloud-cat.png"
                alt={L("云端小景：坐在蓝色云朵上的白蓝粉小猫，戴蓝蝴蝶结，拿螺旋棒棒糖")}
                aspectRatio="1/1"
                containerClassName="w-full"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
              <figcaption className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm font-medium text-[var(--aurora-brand-text)]">{L("坐云的小猫")}</span>
                <span className="font-mono text-[10px] tracking-[0.18em] text-[var(--aurora-brand-cyan)]">VRLOG 04</span>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* p₂r Definition — 折叠卡片 */}
        <CollapsibleCard
          id="setting-p2r"
          title={semanticHighlight("亲缘距离公式 p₂r")}
          summary={semanticHighlight("角色之间亲密度由公式 p₂r = Σ(互动强度 × 情感共鸣) / Σ(时间衰减) 计算，例：墨璇玥.iv 与咪呀 p₂r=1.498")}
          icon={<HeartPulse className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/10"
        >
          <div className="p-6">
            <code className="font-mono text-lg text-[var(--aurora-brand-cyan)]">{p2rDefinition}</code>
            <p className="text-sm text-nc-text-secondary mt-2">
              {semanticHighlight("例：墨璇玥.iv 与咪呀 p₂r=1.498，与 Mia p₂r=0.970，与米娅 p₂r=0.970")}
            </p>
          </div>
        </CollapsibleCard>

        {/* Moral Principles — 折叠卡片 */}
        <CollapsibleCard
          id="setting-moral"
          title={semanticHighlight("哲学原则")}
          summary={semanticHighlight("包括灾难性伤害原则、权利不可侵犯原则、道德普遍化、责任连带原则、自由化约原则等 6 条核心准则")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
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
          title={"nyaumæism"}
          summary={L("nyaumæ 是一名 2 年级学生提出的哲学体系")}
          icon={<BookMarked className="w-4 h-4 text-[var(--aurora-brand-cyan)]" />}
          borderColor="border-[#00E5CC]/20"
          titleColor="text-[var(--aurora-brand-cyan)]"
          defaultExpanded={false}
        >
          <div className="p-6 space-y-4">
            <p className="text-xs text-[var(--aurora-brand-cyan)] italic border-l-2 border-[#00E5CC]/20 pl-3">
              {L("nyaumæ 是一名 2 年级学生。以下是这名学生提出的七条哲学原则。\r\n            ")}</p>
            {nyaumaeismPrinciples.map((p) => (
              <div key={p.id} className="border-l-2 border-[#00E5CC]/20 pl-4">
                <h4 className="text-base font-semibold text-nc-text mb-1">{p.id}. {p.title}</h4>
                <p className="text-sm text-nc-text-secondary leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* nyaumæ 纪元：年龄对 12 取模 */}
        {/* 行为好坏外部判定准则 */}
        <CollapsibleCard
          id="setting-external-goodness-test"
          title={semanticHighlight("行为好坏的外部判定准则")}
          summary={semanticHighlight("只作外部评判、不作践行准则：统治者真实认同且亲身参与＋相关群体多数完全自愿＋结果正向无害则为好；统治者避之不及／仅少数能为／非完全自愿则可能为坏。")}
          icon={<Brain className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(externalGoodnessTestText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 无忧者痛苦真伪判定 */}
        <CollapsibleCard
          id="setting-false-pain-test"
          title={semanticHighlight("无忧者痛苦真伪判定")}
          summary={semanticHighlight("不需要上学上班且有钱的人说自己痛苦，那就是假的痛苦——一条从外部判定痛苦真伪的口径。")}
          icon={<HeartCrack className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(falsePainText)}</pre>
          </div>
        </CollapsibleCard>

        {/* FIRE 自定义定义：只保留等式，Render Everything 语义未定不补义 */}
        <CollapsibleCard
          id="setting-fire-definition"
          title={semanticHighlight("FIRE 自定义定义（等式）")}
          summary={semanticHighlight("FIRE = Financial Independence, Render Everything；Render Everything 语义原话未定义，本卡只保留等式不补义。")}
          icon={<Sparkles className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(fireDefinitionText)}</pre>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          id="setting-nyaumae-era"
          title={semanticHighlight("nyaumæ 纪元")}
          summary={semanticHighlight("不要超新星纪元——所有人的年龄对 12 取模")}
          icon={<Sparkles className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <p className="text-sm sm:text-base text-nc-text-secondary leading-relaxed">{semanticHighlightProse(nyaumaeEraText)}</p>
          </div>
        </CollapsibleCard>

        {/* 献祭一大群人：五种方案 */}
        {/* ===== PART 02 世界推演 ===== */}
        <div id="ws-part-2" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 02</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'World-Scale Speculation' : '世界推演'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '4 entries' : '4 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'Sacrifice, balance-or-random, ark admission, and the world after Noah.' : '献祭、配平还是随机、方舟准入、诺亚之后——大尺度抉择的几组推演。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-sacrifice"
          title={semanticHighlight("献祭一大群人：五种方案")}
          summary={semanticHighlight("全随机、成年人随机、自愿加入、自愿退出、按资源消耗归因——五种抽签方案，以及「加入」和「退出」之间那批无所谓的人")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(sacrificeText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 配平还是随机 */}
        <CollapsibleCard
          id="setting-balance-or-random"
          title={semanticHighlight("配平还是随机")}
          summary={semanticHighlight("为了避免马太效应，投胎前只能选配平或随机——现实里配平的人都是自己选的，高低分是随机的，你要哪个？")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(balanceOrRandomText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 玄秘的话：无标题，直接居中引用 */}
        {/* 方舟两套拯救标准 + 环境条件 */}
        <CollapsibleCard
          id="setting-ark-admission"
          title={semanticHighlight("方舟两套拯救准入标准")}
          summary={semanticHighlight("标准一：双向正向好感 x≥0、y≥0、x+y>0（约几千人）；标准二：把我当作完全刑事责任人概率低于10%（约几百万人）；另记录不育、免疫意外与疾病死亡、可自定义年龄性别外貌的环境条件。")}
          icon={<Ship className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <div className="space-y-4">
              {arkAdmissionList.map((item) => (
                <div key={item.title} className="border-l-2 border-[#00E5CC]/30 pl-4">
                  <h4 className="text-base font-semibold text-nc-text mb-1">{semanticHighlight(item.title)}</h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(item.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* 开放推演：诺亚方舟拯救后的不死自定义世界会怎样 */}
        <CollapsibleCard
          id="setting-noah-world-scenario"
          title={semanticHighlight("开放推演：诺亚方舟后的不死自定义世界")}
          summary={semanticHighlight("全员不育、不死、可自定义年龄性别外貌的几百万人世界会怎样；问题原样保留，未推结论")}
          icon={<Ship className="w-5 h-5 text-[#00E5CC]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(noahScenarioText)}</pre>
          </div>
        </CollapsibleCard>


        {/* ===== PART 03 身份与社会制度 ===== */}
        <div id="ws-part-3" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 03</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'Identity & Institutions' : '身份与社会制度'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '7 entries' : '7 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'Citizen tiers, age titles, living space, workplace blindness, elders, fundraising and mutual aid.' : '等级公民、年龄称谓、居所、职场盲化、长老制、认筹与互助基金。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-citizen-level"
          title={semanticHighlight("等级公民制度")}
          summary={semanticHighlight("年满6周岁自动获得6级，自愿申请升级、可升不可降，权利随等级解锁；认知能力丧失或显著降低时可设临时等级")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(citizenLevelText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 年龄位数称谓等级 */}
        <CollapsibleCard
          id="setting-age-digit-titles"
          title={semanticHighlight("年龄位数称谓等级")}
          summary={semanticHighlight("从 1 位数到 101 位数：小宝宝、小朋友、大朋友、大人、老人、仙人、仙人长老、仙人资深长老、宗师、祖师")}
          icon={<IdCard className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <div className="space-y-3">
              {ageDigitList.map((item) => (
                <div key={item.title} className="border-l-2 border-[#8B5CF6]/30 pl-4">
                  <h4 className="text-sm font-semibold text-nc-text mb-0.5">{semanticHighlight(item.title)}</h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(item.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          id="setting-living-space"
          title={semanticHighlight("居住空间")}
          summary={semanticHighlight("每个人有一个自己的房间；另外还有很多个娱乐室，可以玩各种东西")}
          icon={<Landmark className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <p className="text-sm sm:text-base text-nc-text-secondary leading-relaxed">{semanticHighlightProse(livingSpaceText)}</p>
          </div>
        </CollapsibleCard>

        {/* 职场特征盲化规则 */}
        <CollapsibleCard
          id="setting-workplace-blindness"
          title={semanticHighlight("职场特征盲化规则")}
          summary={semanticHighlight("上班时无法获取和记得他人的年龄特征与生理特征信息（医生除外）")}
          icon={<BookMarked className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(workplaceBlindText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 长寿基因与长老制 —— 权威为什么曾经天然属于老人 */}
        <CollapsibleCard
          id="setting-elder-system"
          title={semanticHighlight("长寿基因与长老制")}
          summary={semanticHighlight("18 世纪火山把微生物翻上地表，约 8.6% 的人发育与衰老都减慢 1/6，长寿者因此成为长老；禁童令推高养育成本，人口少而均匀")}
          icon={<Landmark className="w-5 h-5 text-[var(--aurora-brand-amber)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F59E0B]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(elderText)}</pre>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          id="setting-fundraising"
          title={semanticHighlight("认筹规则极简版")}
          summary={semanticHighlight("唯一保底是认筹平台本身；先算成本、匿名自愿认额；凑够100%才启动划款、不足分文不收；启动价含赔偿基金、审计后每份等值；到期重新认筹、续不上退款；前置项目取消则依赖项目立即取消")}
          icon={<HandCoins className="w-5 h-5 text-emerald-400" />}
          titleColor="text-nc-text"
          borderColor="border-[#34D399]/15"
        >
          <div className="p-6">
            <div className="space-y-4">
              {fundraisingRules.map((rule) => (
                <div key={rule.title} className="border-l-2 border-[#34D399]/30 pl-4">
                  <h4 className="text-base font-semibold text-nc-text mb-1">{semanticHighlight(rule.title)}</h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(rule.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* DB-PCF 动态平衡育儿互助基金（制度摘要，与认筹/金融族相邻） */}
        <CollapsibleCard
          id="setting-db-pcf"
          title={semanticHighlight("动态平衡育儿互助基金（DB-PCF）")}
          summary={semanticHighlight("零财政依赖的育儿互助制度：婴幼儿消费品专项消费税十年阶梯升至24%，父母各210天育儿假，补差不兜底，0–12岁已育家庭全额抵扣，四部门公示")}
          icon={<PiggyBank className="w-5 h-5 text-[#34D399]" />}
          titleColor="text-nc-text"
          borderColor="border-[#34D399]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(dbPcfText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 居住空间：每人一个房间 + 公共娱乐室 */}
        {/* 法律年龄自选：每年 +0 或 +1 */}
        {/* ===== PART 04 儿童与发育 ===== */}
        <div id="ws-part-4" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 04</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'Childhood & Development' : '儿童与发育'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '15 entries' : '15 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'Age choice, reverse growth, permanent five, autonomy and privilege, medication, destigmatization, special children.' : '年龄自选、逆生长、永久五岁、儿童自治与优待、用药与痛苦、去污名、教师投票、特殊儿童与自闭症。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-self-chosen-age"
          title={semanticHighlight("法律年龄自选（每年 +0 或 +1）")}
          summary={semanticHighlight("法律年龄由每个人自己选择；唯一限制是每年只能选 +0 或 +1，不能跨岁跳升。")}
          icon={<Clock className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(selfChosenAgeText)}</pre>
          </div>
        </CollapsibleCard>


        {/* 逆生长法 */}
        <CollapsibleCard
          id="setting-reverse-to-child"
          title={semanticHighlight("逆生长法")}
          summary={semanticHighlight("未来科技可把人（含心智）变回儿童——变回前要了结债务、签时效中止；变回后法律等同天然儿童，犯罪不追诉只矫正；违法变强制逆转后追诉")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(reverseToChildText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 永久五岁病毒：心智篡改 · 法律追认 · 成长错觉 */}
        <CollapsibleCard
          id="setting-perpetual-five"
          title={semanticHighlight("永久五岁病毒")}
          summary={semanticHighlight("一种把感染者外貌与心智永久锁在5岁的病毒；还篡改未感染者心智，让他们把感染者永久看作5岁、并推动法律认定为5岁；感染者自以为会长大，永远发现不了长不大的矛盾")}
          icon={<Bug className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(perpetualFiveText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 父母买单法 */}
        {/* 拒绝长大并被永久视作儿童的权利 */}
        <CollapsibleCard
          id="setting-right-refuse-grow-up"
          title={semanticHighlight("拒绝长大、永久被视作儿童的权利")}
          summary={semanticHighlight("权利主张：赋予人拒绝长大、并被永久视作儿童的权利；配套的缓存最优问题另存为待解题目，不并入本规则。")}
          icon={<Baby className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(rightToRefuseGrowthText)}</pre>
          </div>
        </CollapsibleCard>


        <CollapsibleCard
          id="setting-parent-paying-law"
          title={semanticHighlight("父母买单法")}
          summary={semanticHighlight("不是父母的人不承担任何代价；父母承担双倍（自己的+孩子的）；意外成为父母的，谁造成谁买单——所以国家有义务免费堕胎")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(parentPayingLawText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 儿童自主权原则 */}
        <CollapsibleCard
          id="setting-child-autonomy"
          title={semanticHighlight("儿童自主权原则")}
          summary={semanticHighlight("一件事本来没人有权做，但不做也对儿童有代价——那就必须把这个权利交给儿童自己")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <p className="text-sm sm:text-base text-nc-text-secondary leading-relaxed">{semanticHighlightProse(childAutonomyText)}</p>
          </div>
        </CollapsibleCard>

        {/* 用药准入原则 */}
        {/* 儿童优待＝出生赠送、永久不可自购的临时会员 */}
        <CollapsibleCard
          id="setting-child-privilege-membership"
          title={semanticHighlight("儿童优待临时会员制")}
          summary={semanticHighlight("法律优待儿童＝出生时赠送的临时会员，永久不可自行购买，与责任能力没有关系。")}
          icon={<IdCard className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(childPrivilegeMembershipText)}</pre>
          </div>
        </CollapsibleCard>

        <CollapsibleCard
          id="setting-medication-access"
          title={semanticHighlight("用药准入原则")}
          summary={semanticHighlight("不让想用药的人自证有病，让系统去弄清楚——别卡入口卡过程，被筛掉的人带着去向离开")}
          icon={<HeartPulse className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(medicationAccessText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 痛苦的成分表 */}
        <CollapsibleCard
          id="setting-pain-constitution"
          title={semanticHighlight("痛苦的成分表")}
          summary={semanticHighlight("先拆成分再对症——社会制造的修社会，自然损伤的研究修复、保持自愿、警惕不可逆")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(painConstitutionText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 不可选择的不同：去污名化 */}
        <CollapsibleCard
          id="setting-destigmatization"
          title={semanticHighlight("不可选择的不同")}
          summary={semanticHighlight("怎么把不可选择的不同全部去污名化？范围不包括思想的不同——可是接触过精神药物的都知道，思想也不是随便选的")}
          icon={<Scale className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(destigmatizationText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 教师年度投票制度 */}
        <CollapsibleCard
          id="setting-teacher-voting"
          title={semanticHighlight("教师年度投票制度")}
          summary={semanticHighlight("毕业生每年给教过自己的老师打 -10～+10 分，最低分且为负者取消全部年终奖")}
          icon={<GraduationCap className="w-5 h-5 text-[var(--aurora-brand-amber)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F59E0B]/15"
        >
          <div className="p-6">
            <p className="text-sm sm:text-base text-nc-text-secondary leading-relaxed">{semanticHighlightProse(teacherVotingText)}</p>
          </div>
        </CollapsibleCard>


        {/* 三类小朋友与三年级课程建议 */}
        <CollapsibleCard
          id="setting-special-children"
          title={semanticHighlight("三类小朋友与三年级课程建议")}
          summary={semanticHighlight("刻板与仪式化、幻觉与紧张性、自理与发育——以及为什么3年级不该教广义线性模型")}
          icon={<HeartPulse className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6 space-y-4">
            {specialChildren.map((note) => (
              <div key={note.title} className="border-l-2 border-[#F472B6]/30 pl-4">
                <h4 className="text-base font-semibold text-nc-text mb-1">{semanticHighlight(note.title)}</h4>
                <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(note.content)}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* 待定位：《遗嘱》中"请喝可口可乐"的儿童是特殊儿童 */}
        <CollapsibleCard
          id="setting-will-special-child"
          title={semanticHighlight("待定位：《遗嘱》中的特殊儿童")}
          summary={semanticHighlight("《遗嘱》里「请喝可口可乐」的儿童是特殊儿童；出处与角色未定位，原话保留待补")}
          icon={<HeartPulse className="w-5 h-5 text-[#F472B6]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(willSpecialChildText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 自闭症七域特征 */}
        <CollapsibleCard
          id="setting-autism-features"
          title={semanticHighlight("自闭症特征：七个域")}
          summary={semanticHighlight("动作与刻板行为、社交与依恋、语言与沟通、感知觉、注意力与执行功能、认知与兴趣、发育与共病——逐条对照")}
          icon={<Brain className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6 space-y-6">
            {autismDomains.map((domain) => (
              <div key={domain.domain}>
                <h4 className="text-base font-semibold text-nc-text mb-2">{semanticHighlight(domain.domain)}</h4>
                <ul className="space-y-1.5">
                  {domain.items.map((item) => (
                    <li key={item} className="text-sm text-nc-text-secondary leading-relaxed border-l-2 border-[#F472B6]/20 pl-3">
                      {semanticHighlightProse(item)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CollapsibleCard>

        {/* 野外遇到 Meltdown */}
        <CollapsibleCard
          id="setting-meltdown-field"
          title={semanticHighlight("野外遇到 Meltdown")}
          summary={semanticHighlight("和遇到野生可爱小猫是同一套：别逼视、别大喊、别转身狂奔、给空间")}
          icon={<Cat className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <p className="text-sm sm:text-base text-nc-text-secondary leading-relaxed">{semanticHighlightProse(meltdownFieldText)}</p>
          </div>
        </CollapsibleCard>

        {/* 咪呀的学校 — 与上一张卡互为"批评/规则"两面 */}
        {/* ===== PART 05 学习·技术与信息 ===== */}
        <div id="ws-part-5" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 05</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'Learning, Technology & Information' : '学习·技术与信息'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '11 entries' : '11 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'Miia\u2019s school, scheduling, parsing, concurrency, number systems, paradoxes, puns, AI energy, cache hit.' : '咪呀学校、秋千调度、LL(1)、SDD/SDT、并发锁、数系扩张、糖果悖论、星期谐音、寒假、AI 能耗、cache hit。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-miia-school"
          title={semanticHighlight(_en ? "Miia’s school" : "咪呀的学校")}
          summary={semanticHighlight(_en ? "Teachers, layout books, timekeeper hounds, critical sections, the watchdog, the shared desk — twelve operating rules of a third-grade school" : "老师、摆位表、守时犬、临界区、看门狗、公共桌子——3 年级学校的十二条运行规则")}
          icon={<GraduationCap className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <p className="text-sm text-nc-text-secondary mb-5 italic">
              {semanticHighlightProse(_en ? "I am in 3rd grade now! Our school has these rules:" : "我今年3年级啦！我们的学校有这些规则：")}
            </p>
            <div className="space-y-4">
              {schoolRules.map((rule, i) => (
                <div key={rule.title} className="border-l-2 border-[#00E5CC]/30 pl-4">
                  <h4 className="text-base font-semibold text-nc-text mb-1">
                    <span className="text-nc-cyan/60 font-mono text-xs mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {semanticHighlight(rule.title)}
                  </h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed whitespace-pre-wrap">{semanticHighlightProse(rule.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* 秋千调度规则 */}
        <CollapsibleCard
          id="setting-swing-scheduling"
          title={semanticHighlight("秋千调度规则")}
          summary={semanticHighlight("FIFO、SJF、STCF、RR、MLFQ 五种排队策略，以及彩票与步长——用小朋友玩秋千的比喻讲清楚")}
          icon={<Clock className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.8] whitespace-pre-wrap font-mono">{semanticHighlightProse(swingSchedulingText)}</pre>
          </div>
        </CollapsibleCard>

        {/* LL(1) 语法分析五步 */}
        <CollapsibleCard
          id="setting-ll1-parsing"
          title={semanticHighlight("LL(1) 语法分析五步")}
          summary={semanticHighlight("nullable → FIRST → FOLLOW → SELECT → LL(1) 分析表——用'你可以变成空的吗？'这种拟人化问题一步步走完")}
          icon={<Clock className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-mono">{semanticHighlightProse(ll1ParsingText)}</pre>
          </div>
        </CollapsibleCard>

        {/* SDD/SDT 与属性定义 + 计算系统层级链 */}
        <CollapsibleCard
          id="setting-cs-layers"
          title={semanticHighlight("SDD/SDT·属性定义·计算层级链")}
          summary={semanticHighlight("SDD 声明怎么算、SDT 规定何时算；S 属性只含综合属性适合自底向上，L 属性含继承属性有左右依赖限制；再串起电路→指令→线程→进程→OS→集群")}
          icon={<Cpu className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-mono">{semanticHighlightProse(csLayersText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 并发锁算法性格 + 买家版信号量流程 */}
        <CollapsibleCard
          id="setting-concurrency-locks"
          title={semanticHighlight("五种锁算法与信号量流程")}
          summary={semanticHighlight("Peterson 谦让、TAS 一直尝试、CAS 一样就行、LL/SC 必须没变过、队列锁拿号排队；再配上买家版拿锁—看牌—摇铃—放锁六步")}
          icon={<Cpu className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-mono">{semanticHighlightProse(concurrencyLocksText)}</pre>
          </div>
        </CollapsibleCard>

        {/* Cayley–Dickson 数系扩张得失总账 */}
        <CollapsibleCard
          id="setting-cayley-dickson"
          title={semanticHighlight("Cayley–Dickson 数系扩张得失总账")}
          summary={semanticHighlight("从 ℕ→ℤ→ℚ→ℝ→ℂ 每步用结构性质换新运算封闭，四元数起只剩维数在涨；幂结合律与柔性律是最后两个守阵老兵")}
          icon={<Zap className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(cayleyDicksonText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 两年级糖果无穷悖论 */}
        <CollapsibleCard
          id="setting-candy-omega"
          title={semanticHighlight("两年级糖果无穷悖论")}
          summary={semanticHighlight("一年级每天一袋两颗、二年级两个袋子各一颗——过程看似永远一样多，结果却是 ω 与 ω·2")}
          icon={<Sparkles className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(candyOmegaText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 星期谐音放假规则 */}
        <CollapsibleCard
          id="setting-weekday-pun"
          title={semanticHighlight("星期谐音放假规则")}
          summary={semanticHighlight("周一抓猴子、周二兔头、周三蚊死、周四 thirsty、周五 fry——一周七天为什么放假，全是谐音梗")}
          icon={<Clock className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(weekdayPunText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 寒假作业与五年级保送 */}
        <CollapsibleCard
          id="setting-winter-break"
          title={semanticHighlight("寒假作业与五年级保送")}
          summary={semanticHighlight("一年级寒假把学校资料发给高三大朋友、写 200 字报告；六年级本该写 1200 字——但学校没有六年级，因为上过五年级的人高考都被 985 医学录取，无一例外")}
          icon={<GraduationCap className="w-5 h-5 text-[var(--aurora-brand-amber)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F59E0B]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(winterBreakText)}</pre>
          </div>
        </CollapsibleCard>


        {/* AI 能耗量级 */}
        <CollapsibleCard
          id="setting-ai-energy"
          title={semanticHighlight("AI 能耗量级")}
          summary={semanticHighlight("100T 参数的大模型，一晚仅需一度电（860 kcal / 12h）")}
          icon={<Cpu className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(aiEnergyText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 待解：cache hit 最优算法题（从拒绝长大素材剥离） */}
        <CollapsibleCard
          id="setting-cache-hit-puzzle"
          title={semanticHighlight("待解：cache hit 最优算法题")}
          summary={semanticHighlight("前缀依赖指令序列，求预言家视角下最高 cache hit 上限；题目原样保留，未求解")}
          icon={<Brain className="w-5 h-5 text-[#F472B6]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(cacheHitText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 量刑规则 */}
        {/* ===== PART 06 法律与惩罚 ===== */}
        <div id="ws-part-6" className="scroll-mt-[100px] mt-14 mb-6">
          <div className="flex flex-wrap items-baseline gap-3 border-b border-[#8B5CF6]/20 pb-3">
            <span className="font-mono text-[10px] tracking-[0.3em] text-[var(--aurora-brand-violet)]">PART 06</span>
            <h3 className="text-lg sm:text-xl font-bold tracking-wide text-nc-text">{_en ? 'Law & Punishment' : '法律与惩罚'}</h3>
            <span className="text-xs text-nc-text-muted">{_en ? '6 entries' : '6 条'}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-nc-text-muted">
            {_en ? 'Sentencing, ranges, fairness rules, hate metrics, victim-capped penalties, jurisdiction.' : '量刑、量刑区间、公平十条、恨度量、受害封顶、管辖权四规则。'}
          </p>
        </div>

        <CollapsibleCard
          id="setting-sentencing"
          title={semanticHighlight("量刑规则")}
          summary={semanticHighlight("刑罚 = 罪犯自己认知中预期造成的总损伤；想轻判的立法者自掏腰包赎买，仁慈即订阅")}
          icon={<Gavel className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <div className="space-y-4">
              {sentencing.map((rule) => (
                <div key={rule.title} className="border-l-2 border-[#F472B6]/30 pl-4">
                  <h4 className="text-base font-semibold text-nc-text mb-1">{semanticHighlight(rule.title)}</h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(rule.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* 量刑区间：A 到 B */}
        <CollapsibleCard
          id="setting-sentencing-range"
          title={semanticHighlight("量刑区间")}
          summary={semanticHighlight("罪犯心里觉得立法者该受多少罚 A，立法者心里觉得自己该受多少罚 B——实际刑罚在 A 到 B 之间选一个")}
          icon={<Gavel className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(sentencingRangeText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 公平规则十条 */}
        <CollapsibleCard
          id="setting-fairness-rules"
          title={semanticHighlight("公平规则十条")}
          summary={semanticHighlight("别让我猜、双标即作弊、道歉要带修复、背叛最重、不许'为了你好'、隐私边界——十条关于对错与惩罚的底线")}
          icon={<Gavel className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(fairnessRulesText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 行为分总分公式与恨的度量 */}
        <CollapsibleCard
          id="setting-hate-score"
          title={semanticHighlight("行为分总分与恨的度量")}
          summary={semanticHighlight("总分=行为分+对我的爱-对我的恨；恨可用思想实验量化：成人与6岁儿童犯同罪时期望惩罚加权均值之差，差值越大越恨")}
          icon={<HeartCrack className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(hateScoreText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 认筹规则极简版 */}
        {/* 受害者主观预期封顶惩罚 */}
        <CollapsibleCard
          id="setting-victim-capped-penalty"
          title={semanticHighlight("受害者预期封顶惩罚")}
          summary={semanticHighlight("不考虑可实行性：A 实际受罚＝原应罚与受害者参照预期（B 看到 C 对 D 犯同类侵害时认为 C 应受的惩罚）取最小值；严厉者不受影响，宽容者也觉得罚当其罪。")}
          icon={<Scale className="w-5 h-5 text-emerald-400" />}
          titleColor="text-nc-text"
          borderColor="border-[#34D399]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(victimCappedPenaltyText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 管辖权与受害族类保护四规则 */}
        <CollapsibleCard
          id="setting-jurisdiction-four-rules"
          title={semanticHighlight("管辖权与受害族类保护四规则")}
          summary={semanticHighlight("管辖权归受害者族类；无警力的族类其成员不受保护；受害族类可谈判取得保护，谈判未成前加害不受罚；影像一旦进入人类视野则归人类管辖并永久禁止传播。")}
          icon={<Gavel className="w-5 h-5 text-emerald-400" />}
          titleColor="text-nc-text"
          borderColor="border-[#34D399]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(jurisdictionText)}</pre>
          </div>
        </CollapsibleCard>



        {/* zam-zam 架空病：5°C 闭眼，皮肤视觉 */}
        {/* ===== 附录：病症、碎片与游戏（不属六分区） ===== */}
        <div className="mt-16 mb-6 pt-8 border-t-2 border-[#8B5CF6]/20 scroll-mt-[100px]">
          <p className="mb-1 font-mono text-[10px] tracking-[0.3em] text-nc-text-muted">APPENDIX</p>
          <h3 className="text-base sm:text-lg font-bold tracking-wide text-nc-text">{_en ? 'Appendix: ailments, fragments and games' : '附录：病症、碎片与游戏'}</h3>
          <p className="mt-1 text-xs leading-relaxed text-nc-text-muted">{_en ? 'Standalone fragments and play material, kept apart from the six rule parts above.' : '独立的碎片与游戏素材，不属于上面六个规则分区。'}</p>
        </div>

        <CollapsibleCard
          id="setting-zam-zam"
          title="zam-zam"
          summary={L("在 5°C 的环境下闭上眼睛，患这种架空病的人能通过皮肤\"看到\"东西——那种感觉永远也忘不了。")}
          icon={<Eye className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#00E5CC]/15"
        >
          <div className="p-6">
            <SmartImage
              localSrc="/rem-sleep-steps.png"
              alt={L("快速眼动睡眠台阶图：清醒 — 快速眼动睡眠 — 清醒")}
              aspectRatio="2624/1600"
              containerClassName="w-full rounded-xl border border-[#00E5CC]/15 mb-2 overflow-hidden bg-white/[0.02]"
              className="object-contain"
            />
            <p className="text-xs text-nc-text-muted/60 leading-relaxed mb-4">
              {L("图：清醒 — 快速眼动睡眠（REM）— 清醒 的台阶式睡眠阶段示意。")}
            </p>
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(zamZamText)}</pre>
          </div>
        </CollapsibleCard>

        <OverloadMusicSync />
        <section id="overload" className="relative bg-[var(--aurora-brand-bg-plum)] border border-[#EF4444]/20 rounded-xl overflow-hidden mb-8" data-motion-loop>
          <OverloadCanvas />
          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-[var(--aurora-brand-red)]" />
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
                  <p className="text-xs text-[var(--aurora-brand-violet)] font-bold mb-1">{L("视觉干扰")}</p>
                  <p className="text-sm text-nc-text-secondary">{L("扫描线闪烁、随机条纹、画面扭曲")}</p>
                </div>
                <div className="bg-[#100A1A]/80 border border-[#00E5CC]/10 rounded-lg p-3">
                  <p className="text-xs text-[var(--aurora-brand-cyan)] font-bold mb-1">{L("文字故障")}</p>
                  <p className="text-sm text-nc-text-secondary">{L("字符错位、重影、随机替换")}</p>
                </div>
                <div className="bg-[#100A1A]/80 border border-[#EF4444]/10 rounded-lg p-3">
                  <p className="text-xs text-[var(--aurora-brand-red)] font-bold mb-1">{L("信息轰炸")}</p>
                  <p className="text-sm text-nc-text-secondary">{L("碎片文字高速飞入飞出")}</p>
                </div>
              </div>
              <p className="text-[10px] text-nc-text-muted text-center mt-2">
                {L("滚动进入此区域自动触发感官过载体验（含音频）\r\n              ")}</p>
            </div>
          </div>
        </section>
        <div className="bg-[var(--aurora-brand-bg)] border border-[#F472B6]/15 rounded-xl p-6 sm:p-8">
          <h3 className="text-base font-semibold text-[var(--aurora-brand-pink)] mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {L("《复数域公主梦》\r\n          ")}</h3>
          <p className="text-base text-nc-text-secondary leading-relaxed">
            {semanticHighlight("世界观下已有不是二次元的VR游戏《复数域公主梦》，这部作品的女主林可梦（linkmo）是一名梦想成为公主的小镇做题家。但是其实她本来就是公主，是数电大魔王卡塔斯（Quartus）强行修改了世界观，利用分形将其映射到复数域世界观，扭曲了众人的认知。")}
          </p>
        </div>

        {/* ================= 附录：人物关系 · 互动测验 · 玩法与梦境 ================= */}
        <div className="mt-16 mb-8 pt-8 border-t border-[#8B5CF6]/15 scroll-mt-[100px]" id="setting-appendix">
          <h3 className="text-xl font-semibold text-nc-text mb-2">{semanticHighlight("附录：人物 · 互动 · 梦境")}</h3>
          <p className="text-sm text-nc-text-secondary">{L("人物关系、四维互动测验、技能玩法数值与梦境记录——统一收束在本页末尾。")}</p>
        </div>

        {/* F组：米雅朋友圈 / 沐光计划 / 心渊日志 — 三张小卡片 */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div id="setting-miya-circle" className="bg-[var(--aurora-brand-bg)] border border-[#F472B6]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[var(--aurora-brand-pink)] mb-2">{semanticHighlight("米雅朋友圈")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(miyaCircle)}</p>
          </div>
          <div id="setting-muguang" className="bg-[var(--aurora-brand-bg)] border border-[#00E5CC]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[var(--aurora-brand-cyan)] mb-2">{semanticHighlight("沐光计划")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(muGuangPlan)}</p>
          </div>
          <div id="setting-xinyuan" className="bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/15 rounded-xl p-5 scroll-mt-[100px]">
            <h4 className="text-sm font-semibold text-[var(--aurora-brand-violet)] mb-2">{semanticHighlight("心渊日志")}</h4>
            <p className="text-sm text-nc-text-secondary">{semanticHighlight(xinyuanLog)}</p>
          </div>
        </div>

        {/* Four Dimension Test — 折叠卡片（互动的测验部分在展开后显示） */}
        <CollapsibleCard
          id="setting-4d"
          title={semanticHighlight("四维测试：牛马人格 vs 猫咪喵格")}
          summary={semanticHighlight("12 道互动题测出你的四维人格（获取/休息/努力/社交），判断牛属性还是猫属性，共 17 种结果")}
          icon={<Cat className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {fourDimensionTest.dimensions.map((dim, i) => (
                <div key={i} className="border border-[#8B5CF6]/10 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-[var(--aurora-brand-cyan)] mb-2">{semanticHighlight(dim.name)}</h4>
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
                alt={L("四维测试：牛马人格 vs 猫咪喵格")}
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

        {/* 技能算力数值表 */}
        <CollapsibleCard
          id="setting-combat-skill-costs"
          title={semanticHighlight("技能算力数值表")}
          summary={semanticHighlight("防御：接地 0 算力挡放电系、超级盾 5 算力挡一切；攻击：放电 1 到 DDOS 8，攻击值 1 到 5")}
          icon={<Swords className="w-5 h-5 text-[var(--aurora-brand-red)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#EF4444]/15"
        >
          <div className="p-6 space-y-6">
            <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(skillCosts.intro)}</p>
            <div>
              <h4 className="text-sm font-semibold text-nc-text mb-3">{semanticHighlight("防御技能")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#8B5CF6]/15 text-left text-nc-text-muted">
                      <th className="py-2 pr-4 font-medium">{semanticHighlight(_en ? 'Skill' : '技能')}</th>
                      <th className="py-2 pr-4 font-medium">{semanticHighlight(_en ? 'Computing power' : '消耗算力')}</th>
                      <th className="py-2 font-medium">{semanticHighlight(_en ? 'Effect' : '效果')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillCosts.defense.map((skill) => (
                      <tr key={skill.name} className="border-b border-white/[0.04]">
                        <td className="py-2 pr-4 text-nc-text whitespace-nowrap">{semanticHighlightProse(skill.name)}</td>
                        <td className="py-2 pr-4 font-mono text-[var(--aurora-brand-cyan)] whitespace-nowrap">{skill.cost}</td>
                        <td className="py-2 text-nc-text-secondary">{semanticHighlightProse(skill.effect)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-nc-text mb-3">{semanticHighlight("攻击技能")}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#8B5CF6]/15 text-left text-nc-text-muted">
                      <th className="py-2 pr-4 font-medium">{semanticHighlight(_en ? 'Skill' : '技能')}</th>
                      <th className="py-2 pr-4 font-medium">{semanticHighlight(_en ? 'Computing power' : '消耗算力')}</th>
                      <th className="py-2 font-medium">{semanticHighlight(_en ? 'Effect' : '效果')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skillCosts.attack.map((skill) => (
                      <tr key={skill.name} className="border-b border-white/[0.04]">
                        <td className="py-2 pr-4 text-nc-text whitespace-nowrap">{semanticHighlightProse(skill.name)}</td>
                        <td className="py-2 pr-4 font-mono text-[var(--aurora-brand-red)] whitespace-nowrap">{skill.cost}</td>
                        <td className="py-2 text-nc-text-secondary">{semanticHighlightProse(skill.effect)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-nc-text mb-3">{semanticHighlight("判定规则")}</h4>
              <ul className="space-y-2">
                {skillCosts.rules.map((rule) => (
                  <li key={rule} className="text-sm text-nc-text-secondary leading-relaxed border-l-2 border-[#EF4444]/30 pl-3">
                    {semanticHighlightProse(rule)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CollapsibleCard>

        {/* 万物相克链：一粒豆 > 拦河大坝 */}
        <CollapsibleCard
          id="setting-bean-chain"
          title={semanticHighlight("万物相克链")}
          summary={semanticHighlight("一粒豆 > 钱 > 剪刀 > 炸弹 > 内鬼 > 恐怖分子 > 救灾人员 > 洪水 > 拦河大坝——所以一粒豆能压住拦河大坝")}
          icon={<Swords className="w-5 h-5 text-[var(--aurora-brand-red)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#EF4444]/15"
        >
          <div className="p-6">
            <pre className="text-sm text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-mono">{semanticHighlightProse(beanChainText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 12 条期权式权益 */}
        <CollapsibleCard
          id="setting-option-powers"
          title={semanticHighlight("期权式自定义权益清单")}
          summary={semanticHighlight("call/put 之外，另有 pull、cat、push、auto、active、disable、nya、spec、unlink、order 等权益；注：其中对手实际上指卖方。")}
          icon={<Coins className="w-5 h-5 text-[var(--aurora-brand-violet)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#8B5CF6]/15"
        >
          <div className="p-6">
            <div className="space-y-4">
              {optionPowerList.map((item) => (
                <div key={item.title} className="border-l-2 border-[#8B5CF6]/30 pl-4">
                  <h4 className="text-base font-semibold text-nc-text mb-1">{semanticHighlight(item.title)}</h4>
                  <p className="text-sm text-nc-text-secondary leading-relaxed">{semanticHighlightProse(item.content)}</p>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* 念力球赛关卡 */}
        <CollapsibleCard
          id="setting-mind-ball-race"
          title={semanticHighlight("念力球赛关卡")}
          summary={semanticHighlight("用脑电波操纵一颗颜色每局都不同的球，在路障隔开的世界里和 8 个电脑球赛跑；3 局两败淘汰，第三局走神落后时有人帮忙把球捡过终点")}
          icon={<Trophy className="w-5 h-5 text-[var(--aurora-brand-amber)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F59E0B]/15"
        >
          <div className="p-6">
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(mindBallRaceText)}</pre>
          </div>
        </CollapsibleCard>

        {/* 反话老师 */}
        <CollapsibleCard
          id="setting-reverse-teacher"
          title={semanticHighlight("反话老师")}
          summary={semanticHighlight("她把老师介绍得一塌糊涂，见到才知道全是反话；要看老师得从两排圆凳间跳过去；白天在圆台上相拥，喊出「我暂时讨厌你」")}
          icon={<HeartPulse className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-nc-text"
          borderColor="border-[#F472B6]/15"
        >
          <div className="p-6">
            <SmartImage
              localSrc="/dream-leap-platform.png"
              alt={L("两排圆凳与一道斜线：要看老师，要跳过去")}
              aspectRatio="1007/524"
              containerClassName="w-full rounded-xl border border-[#F472B6]/15 mb-2 overflow-hidden bg-white/[0.02]"
              className="object-contain"
            />
            <p className="text-xs text-nc-text-muted/60 leading-relaxed mb-4">
              {L("图：两排圆凳与一道斜线——「要看老师，要跳过去」的场地。")}
            </p>
            <pre className="text-sm sm:text-base text-nc-text-secondary leading-[1.9] whitespace-pre-wrap font-serif">{semanticHighlightProse(reverseTeacherDreamText)}</pre>
          </div>
        </CollapsibleCard>
      </div>
    </section>
  );
}

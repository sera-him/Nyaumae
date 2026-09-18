import { useMemo, useState } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { motion } from 'framer-motion';
import { BlockMath, InlineMath } from 'react-katex';
import {
  Activity,
  ArrowDown,
  BadgeCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  ChevronRight,
  Database,
  Fingerprint,
  Gauge,
  HeartPulse,
  Languages,
  Network,
  RefreshCcw,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import {
  ADULT_REFERENCE_SCORES,
  evaluatePemsL,
  PEMS_DIMENSIONS,
  shiftScores,
  type PemsDimensionCode,
  type PemsScores,
} from '../lib/pemsLModel';
import 'katex/dist/katex.min.css';

const dimensions = [
  {
    code: 'P',
    title: '生理发育',
    subtitle: '身体自主能力与风险感知',
    description: '不测身高、肌肉或青春期程度，避免让力量更大的年轻人无缘无故获得更高法律年龄。',
    icon: Activity,
    color: '#22d3ee',
  },
  {
    code: 'E',
    title: '执行功能',
    subtitle: '计划、抑制控制、工作记忆、认知灵活性、后果预测',
    description: '最重要的核心维度之一；执行功能并非单一、同步发展的能力。',
    icon: BrainCircuit,
    color: '#a78bfa',
  },
  {
    code: 'M',
    title: '情绪调节',
    subtitle: '情绪是否会破坏自主决策能力',
    description: '测量的是决策稳定性，而不是情绪多寡；容易哭或情绪强烈不应自动等于“不成熟”。',
    icon: HeartPulse,
    color: '#f472b6',
  },
  {
    code: 'S',
    title: '社会互动',
    subtitle: '独立意志 · 社会后果 · 边界表达',
    description: '不以是否符合主流社交方式为标准。社会认知的不同组成部分随年龄可能朝不同方向变化。',
    icon: Users,
    color: '#34d399',
  },
  {
    code: 'L',
    title: '语言 / 符号',
    subtitle: '理解规则、合同、概率、条件和抽象后果',
    description: '关注能否理解具有法律意义的符号系统，而不是单纯测试词汇量。',
    icon: Languages,
    color: '#fbbf24',
  },
];

const scorePresets: { id: string; label: string; description: string; scores: PemsScores }[] = [
  {
    id: 'adult-line',
    label: '成年参考线',
    description: '五个维度都恰好位于各自 Tᵢ',
    scores: ADULT_REFERENCE_SCORES,
  },
  {
    id: 'balanced',
    label: '均衡偏高',
    description: '五个维度统一设为 0.4',
    scores: { P: 0.4, E: 0.4, M: 0.4, S: 0.4, L: 0.4 },
  },
  {
    id: 'executive-gap',
    label: '执行短板',
    description: '其余较高，但 E 明显偏低',
    scores: { P: 0.8, E: -2.1, M: 0.8, S: 0.8, L: 0.8 },
  },
];

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const DIM_TITLE_EN: Record<string, string> = {
  P: 'Physical development',
  E: 'Executive function',
  M: 'Emotional regulation',
  S: 'Social interaction',
  L: 'Language / symbols',
};

const SHORT_LABEL_EN: Record<string, string> = {
  P: 'Physical',
  E: 'Executive',
  M: 'Emotional',
  S: 'Social',
  L: 'Language',
};

function Formula({ math, label }: { math: string; label?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-4 sm:px-6 overflow-x-auto">
      {label && <p className="mb-2 text-center text-[11px] uppercase tracking-[0.18em] text-nc-text-muted">{L(label)}</p>}
      <div className="min-w-max text-center text-nc-text-secondary [&_.katex-display]:my-0">
        <BlockMath math={math} />
      </div>
    </div>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-nc-cyan">
        <span className="font-mono text-nc-text-muted">{index}</span>
        <span className="h-px w-8 bg-nc-cyan/40" />
        <span>{eyebrow}</span>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-nc-text sm:text-3xl">{title}</h3>
      {description && <p className="mt-3 max-w-3xl text-sm leading-7 text-nc-text-secondary sm:text-base">{L(description)}</p>}
    </div>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`liquid-glass-subtle glass-highlight glass-shine relative rounded-2xl border border-white/[0.06] ${className}`}>
      {children}
    </div>
  );
}

export default function FLAModel() {
  const _en = getLocale() === 'en';
  const [scores, setScores] = useState<PemsScores>(() => ({ ...ADULT_REFERENCE_SCORES }));
  const evaluation = useMemo(() => evaluatePemsL(scores), [scores]);
  const sensitivityBand = useMemo(() => ({
    low: evaluatePemsL(shiftScores(scores, -0.25)).demoEquivalentAge,
    high: evaluatePemsL(shiftScores(scores, 0.25)).demoEquivalentAge,
  }), [scores]);

  const updateScore = (code: PemsDimensionCode, value: number) => {
    setScores((current) => ({ ...current, [code]: value }));
  };

  return (
    <div className="relative mx-auto max-w-[1100px] pb-12">
      <div className="pointer-events-none absolute left-1/2 top-20 -z-0 h-[460px] w-[760px] max-w-full -translate-x-1/2 rounded-full bg-violet-600/[0.07] blur-[100px]" />

      <motion.header
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
        className="relative z-10 mb-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_80%_10%,rgba(0,229,204,0.13),transparent_34%),radial-gradient(circle_at_8%_90%,rgba(139,92,246,0.18),transparent_38%),rgba(255,255,255,0.015)] px-5 py-8 sm:px-10 sm:py-12"
      >
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-nc-cyan/25 bg-nc-cyan/[0.08] px-3 py-1.5 text-xs font-medium text-nc-cyan">
            <Sparkles className="h-3.5 w-3.5" />
            PEMS-L FLA v2.1
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-nc-text-muted">
            {_en ? 'Functional legal age model' : '功能法律年龄模型'}</span>
        </div>

        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-wide text-nc-text-secondary">{L("从“五科加权”到“人口曲线反查”")}</p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-nc-text sm:text-5xl">
            {_en ? 'Without overturning the life-course functions, ' : L("不推翻生命周期函数，")}<span className="text-gradient-cyan">{L("重构年龄映射的最后一步")}</span>
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-nc-text-secondary sm:text-base">
            {_en
            ? "The legacy formula assumed abilities could compensate for one another without limit, and that the five dimensions were independent. In reality, the timing of cognitive peaks varies a lot between people; executive function shares a common factor with distinct subcomponents, and social cognition may even move in different directions with age."
            : L("旧公式默认能力可以无限互相补偿，也默认五个维度彼此独立。现实中的认知能力峰值时间高度异质，执行功能包含共同因素与不同子成分，社会认知甚至会随年龄向不同方向变化。")}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-[0.9fr_auto_1.2fr] sm:items-center">
          <div className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] px-4 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-rose-300/60">Legacy mapping</p>
            <div className="text-sm text-nc-text-muted line-through decoration-rose-400/50">
              <InlineMath math={'A_F=18+7\\sum_i w_iZ_i'} />
            </div>
          </div>
          <ChevronRight className="hidden h-5 w-5 text-nc-text-muted sm:block" />
          <div className="rounded-xl border border-nc-cyan/15 bg-nc-cyan/[0.05] px-4 py-3">
            <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-nc-cyan/70">v2.1 mapping</p>
            <p className="text-sm font-medium text-nc-text">{L("多维成熟度 → 人口成长曲线 → 年龄等效值")}</p>
          </div>
        </div>
      </motion.header>

      <div className="relative z-10 space-y-8">
        <GlassCard className="p-5 sm:p-8">
          <SectionHeading
            index="01"
            eyebrow="Normative atlas"
            title={L("十个生命周期函数继续保留")}
            description="它们建立类似儿童身高生长曲线的生命周期参考图谱：给定年龄，估计正常分布，再计算个人偏离程度。"
          />

          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-3">
              <Formula math={'\\mu_P,\\mu_E,\\mu_M,\\mu_S,\\mu_L'} label="年龄相关的中心趋势" />
              <Formula math={'\\sigma_P,\\sigma_E,\\sigma_M,\\sigma_S,\\sigma_L'} label="年龄相关的变异程度" />
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-violet-400/10 bg-violet-400/[0.04] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
                <Database className="h-5 w-5" />
              </div>
              <p className="text-sm leading-7 text-nc-text-secondary">
                {L("这种思路接近现实中的 ")}<span className="text-nc-text">normative modelling</span>{_en ? ': large-scale life-course brain atlases model both the central trend and its dispersion, rather than assuming everyone develops along one fixed curve.' : L("：大型生命周期脑图谱也会同时建模中心趋势与变异程度，而不是假定所有人沿同一条固定曲线发展。")}</p>
              <p className="mt-3 border-l-2 border-amber-300/50 pl-3 text-xs leading-6 text-amber-100/70">
                {_en ? 'The concrete parameters should be read as fits of the worldbuilding database, not as precise biological constants already established in the real world.' : L("当前具体参数应理解为世界观数据库拟合值，而不是现实中已被证明的精确生物常数。")}</p>
            </div>
          </div>
        </GlassCard>

        <section>
          <SectionHeading
            index="02"
            eyebrow="Constructs"
            title={L("名称不变，法律测量内容重新定义")}
            description="五个维度仍然是 P、E、M、S、L，但测试关注的是法律主体能力，而非外观、性格或对主流行为方式的符合程度。"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {dimensions.map((dimension, index) => {
              const Icon = dimension.icon;
              return (
                <motion.article
                  key={dimension.code}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: index * 0.05 }}
                  className={`fla-dimension-card liquid-glass-subtle relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 ${index === 4 ? 'md:col-span-2' : ''}`}
                >
                  <div className="absolute right-4 top-1 font-mono text-6xl font-black opacity-[0.055]" style={{ color: dimension.color }}>
                    {dimension.code}
                  </div>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${dimension.color}16`, color: dimension.color }}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: dimension.color }}>{dimension.code}</p>
                      <h4 className="font-semibold text-nc-text">{_en ? DIM_TITLE_EN[dimension.code] : dimension.title}</h4>
                    </div>
                  </div>
                  <p className="text-sm font-medium leading-6 text-nc-text">{L(dimension.subtitle)}</p>
                  <p className="mt-2 text-sm leading-6 text-nc-text-muted">{L(dimension.description)}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <GlassCard className="overflow-hidden">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-5 sm:p-8">
              <SectionHeading
                index="03"
                eyebrow="Probability transform"
                title={L("先转换为“达到成年功能水平”的概率")}
                description="不再直接线性相加五个 Z 分数。每个维度先通过逻辑函数，映射到与成熟法律主体的匹配程度。"
              />
              <Formula math={'q_i=\\frac{1}{1+\\exp[-s_i(Z_i-T_i)]},\\qquad q_i\\in(0,1)'} />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/[0.025] p-4">
                  <p className="font-mono text-xs text-nc-cyan">Tᵢ</p>
                  <p className="mt-1 text-sm text-nc-text-secondary">{L("成年功能参考线")}</p>
                </div>
                <div className="rounded-xl bg-white/[0.025] p-4">
                  <p className="font-mono text-xs text-violet-300">sᵢ</p>
                  <p className="mt-1 text-sm text-nc-text-secondary">{L("跨过参考线时的过渡陡度")}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/[0.06] bg-black/10 p-5 sm:p-8 lg:border-l lg:border-t-0">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-nc-cyan" />
                <h4 className="text-sm font-semibold text-nc-text">{L("推荐过渡参数")}</h4>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/[0.07]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs text-nc-text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">{L("维度")}</th>
                      <th className="px-4 py-3 font-medium"><InlineMath math={'T_i'} /></th>
                      <th className="px-4 py-3 font-medium"><InlineMath math={'s_i'} /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] font-mono text-nc-text-secondary">
                    {PEMS_DIMENSIONS.map((dimension) => (
                      <tr key={dimension.code} className="transition-colors hover:bg-white/[0.025]">
                        <td className="px-4 py-3 font-semibold text-nc-text">{dimension.code}</td>
                        <td className="px-4 py-3">{dimension.threshold.toFixed(2)}</td>
                        <td className="px-4 py-3">{dimension.slope.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 sm:p-8">
          <SectionHeading
            index="04"
            eyebrow="Soft bottleneck"
            title={L("用几何平均制造“软短板效应”")}
            description="普通加权平均允许优势维度无限补偿短板；几何平均会让明显偏低的关键维度真实拖低整体成熟度，但不会让单项不足立刻归零全部权利。"
          />
          <Formula math={'Q=q_P^{0.05}q_E^{0.30}q_M^{0.25}q_S^{0.15}q_L^{0.25}'} />

          <div className="mt-6">
            <div className="fla-weight-bar mb-3 flex h-3 overflow-hidden rounded-full bg-white/[0.04]" data-motion-reveal>
              {PEMS_DIMENSIONS.map((dimension) => (
                <div
                  key={dimension.code}
                  style={{ width: `${dimension.weight * 100}%` }}
                  className="border-r border-nc-bg last:border-r-0 odd:bg-nc-cyan/70 even:bg-violet-400/70"
                />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {PEMS_DIMENSIONS.map((dimension) => (
                <div key={dimension.code} className="text-center">
                  <p className="font-mono text-sm font-semibold text-nc-text">{dimension.code} · {dimension.weight * 100}%</p>
                  <p className="mt-0.5 text-[10px] text-nc-text-muted">{_en ? SHORT_LABEL_EN[dimension.code] : dimension.shortLabel}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-4 text-sm leading-6 text-nc-text-secondary">
              {L("当一个人的 ")}<InlineMath math={'E\\approx0'} />{L("，即使其他四项很高，整体 ")}<InlineMath math={'Q'} /> {_en ? 'still drops noticeably.' : L("仍会明显下降。")}</div>
            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-4 text-sm leading-6 text-nc-text-secondary">
              {_en ? 'But this is not “fails E → all rights revoked”: it is a continuous, explainable soft constraint.' : L("但它不是“E 不合格 → 全部权利归零”，而是连续、可解释的软性约束。")}</div>
          </div>
        </GlassCard>

        <section>
          <SectionHeading
            index="05"
            eyebrow="Age equivalence"
            title={L("在人口成长曲线上反查年龄")}
            description="这是 v2.0 最大的升级：功能法律年龄不再来自人为设定的 18 + 7D，而是来自某个人与普通年龄人群之间的成熟模式匹配。"
          />

          <div className="mb-5 grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-stretch">
            {[
              { icon: Fingerprint, step: '输入', title: '个人五维能力', detail: 'P · E · M · S · L' },
              { icon: Network, step: '合成', title: '综合成熟度', detail: '几何平均 Q' },
              { icon: ChartNoAxesCombined, step: '反查', title: '年龄等效值', detail: '人口曲线 A*' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="contents">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 text-center">
                    <Icon className="mx-auto mb-2 h-5 w-5 text-nc-cyan" />
                    <p className="text-[10px] uppercase tracking-[0.16em] text-nc-text-muted">{L(item.step)}</p>
                    <p className="mt-1 text-sm font-medium text-nc-text">{L(item.title)}</p>
                    <p className="mt-1 text-xs text-nc-text-muted">{L(item.detail)}</p>
                  </div>
                  {index < 2 && <ChevronRight className="mx-auto hidden h-5 w-5 self-center text-nc-text-muted sm:block" />}
                </div>
              );
            })}
          </div>

          <GlassCard className="p-5 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-nc-text-muted">{L("普通人在每个年龄的预期成熟度")}</p>
                <Formula math={'Q_{\\mathrm{pop}}(x)=\\prod_i q_i\\!\\left(\\mu_i(x)\\right)^{w_i}'} />
                <p className="mt-3 text-sm leading-6 text-nc-text-secondary">
                  {L("只取正常成长阶段：")}<InlineMath math={'x\\in[0,30]'} />。
                </p>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-nc-text-muted">{L("寻找最接近的年龄位置")}</p>
                <Formula math={'A^*=\\underset{0\\le a\\le30}{\\operatorname{argmin}}\\left|Q_{\\mathrm{pop}}(a)-Q_{\\mathrm{person}}\\right|'} />
                <p className="mt-3 text-sm leading-6 text-nc-text-secondary">
                  {L("也就是 ")}<InlineMath math={'A^*=Q_{\\mathrm{pop}}^{-1}(Q)'} /> {_en ? ', i.e. the numerical inverse form.' : L("的数值反查形式。")}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border-l-2 border-nc-cyan bg-nc-cyan/[0.045] px-5 py-4">
              <p className="text-base font-medium text-nc-text">{L("“你的功能表现最接近普通人的多少岁？”")}</p>
              <p className="mt-2 text-sm leading-6 text-nc-text-secondary">
                {L("若 ")}<InlineMath math={'A^*=16.7'} />{_en ? ', this no longer means the formula arbitrarily outputs 16.7; it means this person\'s overall legal-maturity pattern best matches the typical 16.7-year-old level in the population.' : L("，含义不再是公式随意产出 16.7，而是此人的综合法律成熟模式与人口中典型的 16.7 岁水平最接近。")}</p>
            </div>
          </GlassCard>
        </section>

        <GlassCard className="overflow-hidden">
          <div className="border-b border-white/[0.06] p-5 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-nc-cyan">
                  <span className="font-mono text-nc-text-muted">06</span>
                  <span className="h-px w-8 bg-nc-cyan/40" />
                  <span>Interactive lab</span>
                </div>
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="h-6 w-6 text-nc-cyan" />
                  <h3 className="text-2xl font-semibold tracking-tight text-nc-text sm:text-3xl">{L("把公式变成可检查的实验台")}</h3>
                </div>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-nc-text-secondary sm:text-base">
                  {_en
                ? "Adjust the five standard scores and watch each dimension's match probability, the soft-bottleneck effect and the demo age back-out update in real time. Start from a preset to compare, then drag a single dimension to see which step actually moves the result."
                : L("调整五个标准分，实时查看每项匹配度、软短板效应和演示年龄反查。先用预设比较，再拖动单个维度，会更容易看清哪一步改变了结果。")}</p>
              </div>
              <button
                type="button"
                onClick={() => setScores({ ...ADULT_REFERENCE_SCORES })}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2 text-sm text-nc-text-secondary transition-colors hover:border-nc-cyan/30 hover:text-nc-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nc-cyan"
              >
                <RefreshCcw className="h-4 w-4" />
                {_en ? 'Reset to adult line' : '重置成年线'}</button>
            </div>

            <div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.045] px-4 py-3 text-xs leading-6 text-amber-100/75">
              {_en ? 'Transparency note: the ten life-course functions have no publicly verifiable fit data yet, so the lab uses ' : L("透明度说明：十条生命周期函数尚无可公开复核的拟合数据，因此实验台用")}<span className="mx-1 font-mono text-amber-100">Qdemo(a)=sigmoid[0.22(a−18)]</span>
              {_en ? 'to demo the final back-out step. It exists to inspect model behavior — it is not a real-world assessment, diagnosis, or legal verdict.' : L("演示最后一步反查。它用于检查模型行为，不是现实测评、诊断或法律结论。")}</div>

            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={L("PEMS-L 分数预设")}>
              {scorePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setScores({ ...preset.scores })}
                  title={preset.description}
                  className="min-h-11 rounded-xl border border-white/[0.08] bg-black/15 px-4 py-2 text-left transition-colors hover:border-violet-300/30 hover:bg-violet-400/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  <span className="block text-sm font-medium text-nc-text">{L(preset.label)}</span>
                  <span className="mt-0.5 block text-[10px] text-nc-text-muted">{L(preset.description)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-4 p-5 sm:p-8">
              {evaluation.dimensions.map((dimension) => (
                <div key={dimension.code} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <label htmlFor={`pems-score-${dimension.code}`} className="flex min-w-0 items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-bold"
                        style={{ backgroundColor: `${dimension.color}16`, color: dimension.color }}
                      >
                        {dimension.code}
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-nc-text">{_en ? DIM_TITLE_EN[dimension.code] : dimension.title}</span>
                        <span className="mt-0.5 block text-[10px] text-nc-text-muted">
                          Tᵢ {dimension.threshold.toFixed(2)} · sᵢ {dimension.slope.toFixed(1)} {L("· 权重 ")}{dimension.weight * 100}%
                        </span>
                      </span>
                    </label>
                    <output
                      htmlFor={`pems-score-${dimension.code}`}
                      className="rounded-lg bg-black/25 px-2.5 py-1 font-mono text-sm font-semibold text-nc-text"
                    >
                      {dimension.score > 0 ? '+' : ''}{dimension.score.toFixed(1)}
                    </output>
                  </div>

                  <input
                    id={`pems-score-${dimension.code}`}
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={dimension.score}
                    onChange={(event) => updateScore(dimension.code, Number(event.currentTarget.value))}
                    aria-label={_en ? `${DIM_TITLE_EN[dimension.code]} standard score` : `${dimension.title}标准分`}
                    aria-valuetext={_en ? `${dimension.score.toFixed(1)}, match ${formatPercent(dimension.probability)}` : `${dimension.score.toFixed(1)}，匹配度 ${formatPercent(dimension.probability)}`}
                    className="h-11 w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nc-cyan"
                    style={{ accentColor: dimension.color }}
                  />

                  <div className="mt-1 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full transition-[width] duration-150"
                        style={{ width: `${dimension.probability * 100}%`, backgroundColor: dimension.color }}
                      />
                    </div>
                    <span className="w-[88px] text-right font-mono text-[11px] text-nc-text-muted">
                      q{dimension.code} {formatPercent(dimension.probability)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <aside className="border-t border-white/[0.06] bg-black/10 p-5 sm:p-8 lg:border-l lg:border-t-0" aria-label={L("PEMS-L 即时结果")}>
              <div className="lg:sticky lg:top-24" aria-live="polite">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-nc-text-muted">Demonstration result</p>
                <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <p className="font-mono text-5xl font-semibold tracking-tight text-nc-text sm:text-6xl">
                    {evaluation.demoEquivalentAge.toFixed(1)}
                    <span className="ml-1 text-lg font-normal text-nc-text-muted">{L("岁")}</span>
                  </p>
                  <span className={`mb-2 rounded-full border px-3 py-1 text-xs ${
                    evaluation.maturity >= evaluation.adultReference
                      ? 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200'
                      : 'border-amber-300/20 bg-amber-300/[0.06] text-amber-100'
                  }`}>
                    {_en
                    ? (evaluation.maturity >= evaluation.adultReference ? 'Meets demo adult line' : 'Below demo adult line')
                    : (evaluation.maturity >= evaluation.adultReference ? '达到演示成年线' : '未达到演示成年线')}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-nc-text-muted">{L("这是演示曲线上的 A*，不是自然年龄，也不决定任何人的权利。")}</p>

                <div
                  className="relative mt-7 h-14"
                  role="img"
                  aria-label={_en ? `Demo age scale 0 to 30, current result ${evaluation.demoEquivalentAge.toFixed(1)}, adult reference line 18` : `演示年龄刻度 0 到 30 岁，当前结果 ${evaluation.demoEquivalentAge.toFixed(1)} 岁，成年参考线 18 岁`}
                >
                  <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-gradient-to-r from-violet-500/30 via-nc-cyan/50 to-emerald-400/40" />
                  <div className="absolute bottom-0 left-0 font-mono text-[10px] text-nc-text-muted">0</div>
                  <div className="absolute bottom-0 font-mono text-[10px] text-nc-text-muted" style={{ left: '60%', transform: 'translateX(-50%)' }}>18</div>
                  <div className="absolute bottom-0 right-0 font-mono text-[10px] text-nc-text-muted">30</div>
                  <div className="absolute top-0 h-9 w-px bg-amber-200/60" style={{ left: '60%' }} />
                  <div
                    className="absolute top-2 h-5 w-2 -translate-x-1/2 rounded-full bg-nc-cyan shadow-[0_0_16px_rgba(34,211,238,0.7)] transition-[left] duration-150"
                    style={{ left: `${evaluation.demoEquivalentAge / 30 * 100}%` }}
                  />
                </div>

                <div className="mt-7 space-y-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-nc-text-secondary">{L("几何成熟度 Q")}</span>
                      <span className="font-mono font-semibold text-nc-text">{formatPercent(evaluation.maturity)}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.05]">
                      <div className="h-full rounded-full bg-nc-cyan transition-[width] duration-150" style={{ width: `${evaluation.maturity * 100}%` }} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-nc-text-secondary">{L("普通加权平均")}</span>
                      <span className="font-mono text-nc-text">{formatPercent(evaluation.arithmeticMaturity)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                      <span className="text-nc-text-muted">{L("软短板拉低")}</span>
                      <span className="font-mono text-rose-200/80">
                        {evaluation.bottleneckGap >= 0.00005 ? '−' : ''}{(evaluation.bottleneckGap * 100).toFixed(2)} {_en ? 'pp' : '个百分点'}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-violet-300/10 bg-violet-400/[0.04] p-4">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-violet-200/70">{L("±0.25 分敏感性带")}</p>
                    <p className="mt-1 font-mono text-lg text-nc-text">
                      {sensitivityBand.low.toFixed(1)}–{sensitivityBand.high.toFixed(1)} {L("岁\n                    ")}</p>
                    <p className="mt-1 text-xs leading-5 text-nc-text-muted">{L("所有维度同时上下移动 0.25 分的压力测试，不是统计置信区间。")}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border-l-2 border-rose-300/50 bg-rose-300/[0.035] px-4 py-3">
                  <p className="text-xs text-nc-text-muted">{L("当前最低匹配维度")}</p>
                  <p className="mt-1 text-sm font-medium text-nc-text">
                    {evaluation.limitingDimension.code} · {_en ? DIM_TITLE_EN[evaluation.limitingDimension.code] : evaluation.limitingDimension.title}
                    <span className="ml-2 font-mono text-rose-200/80">{formatPercent(evaluation.limitingDimension.probability)}</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-5 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-nc-cyan/10 text-nc-cyan">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-nc-cyan">07 · Calibration</p>
                <h3 className="mt-1 text-xl font-semibold text-nc-text">{L("成年线仍为 18，由人口目标校准")}</h3>
              </div>
            </div>
            <Formula math={'A^*\\ge18'} label="通常成年功能标准" />
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-white/[0.025] px-3 py-3 text-sm text-nc-text-secondary">
                <InlineMath math={'P(A^*\\ge18\\mid x<14)<5\\%'} />
              </div>
              <div className="rounded-lg bg-white/[0.025] px-3 py-3 text-sm text-nc-text-secondary">
                <InlineMath math={'P(A^*\\ge18\\mid x\\ge25)>98\\%'} />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-violet-400/10 bg-violet-400/[0.04] p-4 text-sm text-nc-text-secondary">
              <span>{L("先规定人口目标")}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-violet-300" />
              <span>{L("再统计拟合 ")}<InlineMath math={'T_i,s_i,w_i'} /></span>
            </div>
            <p className="mt-4 text-xs leading-6 text-nc-text-muted">{L("不要先凭感觉定参数，再期待结果刚好符合制度目标。这种反向校准方式更像真正实施过的大规模公共政策。")}</p>
          </GlassCard>

          <GlassCard className="p-5 sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">08 · Irreversibility</p>
                <h3 className="mt-1 text-xl font-semibold text-nc-text">{L("成年法律身份不可逆")}</h3>
              </div>
            </div>
            <Formula math={'t_{\\mathrm{adult}}=\\inf\\{t:A^*(t)\\ge18\\}'} label="首次成年时间" />
            <div className="mt-3">
              <Formula math={'A_F(t)=\\begin{cases}A^*(t),&t<t_{\\mathrm{adult}}\\\\[4pt]\\max(18,A^*(t)),&t\\ge t_{\\mathrm{adult}}\\end{cases}'} label="正式有效年龄" />
            </div>
            <p className="mt-4 text-sm leading-6 text-nc-text-secondary">
              {L("老年人不会因认知老化出现 ")}<span className="font-mono text-rose-300/80">80 → 17 → 15 → 12</span> {_en ? 'and re-attains minor status. Declining ability should trigger a “specific-capacity assessment”, not a rollback of age.' : L("并重新取得未成年人身份。当前能力下降应进入“特定行为能力评估”，而不是让年龄倒流。")}</p>
          </GlassCard>
        </div>

        <GlassCard className="p-5 sm:p-8">
          <SectionHeading
            index="09"
            eyebrow="Measurement model"
            title={L("把一次考试升级为稳定能力估计")}
            description="失眠、生病或紧张不应让一个人的功能法律年龄在一天内从 19.2 跌到 16.8。五维真实能力应作为潜变量，通过多次、不同可靠度的测量进行估计。"
          />
          <div className="grid gap-5 lg:grid-cols-[0.9fr_auto_1.1fr] lg:items-center">
            <div>
              <Formula math={'X_{ij}=\\theta_i+\\varepsilon_{ij}'} label="单次测试观测" />
              <p className="mt-3 text-center text-xs text-nc-text-muted"><InlineMath math={'\\theta_i'} /> {L("为稳定能力，")}<InlineMath math={'\\varepsilon_{ij}'} /> {L("为当次误差")}</p>
            </div>
            <ArrowDown className="mx-auto h-5 w-5 text-nc-text-muted lg:-rotate-90" />
            <div>
              <Formula math={'\\hat\\theta_i=\\frac{\\sum_j r_{ij}X_{ij}}{\\sum_j r_{ij}}'} label="法律系统的能力估计" />
              <p className="mt-3 text-center text-xs text-nc-text-muted">{L("可靠性更高的测试获得更大的 ")}<InlineMath math={'r_{ij}'} /> {L("权重")}</p>
            </div>
          </div>
        </GlassCard>

        <section className="overflow-hidden rounded-3xl border border-nc-cyan/15 bg-[linear-gradient(135deg,rgba(0,229,204,0.07),rgba(139,92,246,0.07))] p-5 sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-nc-cyan/10 text-nc-cyan">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-nc-cyan">Recommended architecture</p>
              <h3 className="mt-1 text-2xl font-semibold text-nc-text">{L("PEMS-L FLA v2.1 当前结构")}</h3>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
            {[
              ['01', '10 个生命周期函数', '建立人口参考'],
              ['02', 'P · E · M · S · L', '转换为五个 qᵢ'],
              ['03', '几何平均 Q', '加入软短板效应'],
              ['04', '反查 Qpop', '得到功能法律年龄 A*'],
            ].map((step, index) => (
              <div key={step[0]} className="contents">
                <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
                  <p className="font-mono text-[10px] text-nc-cyan">{step[0]}</p>
                  <p className="mt-1 text-sm font-medium text-nc-text">{L(step[1])}</p>
                  <p className="mt-1 text-xs leading-5 text-nc-text-muted">{L(step[2])}</p>
                </div>
                {index < 3 && <ChevronRight className="mx-auto hidden h-4 w-4 text-nc-text-muted md:block" />}
              </div>
            ))}
          </div>

          <p className="mt-6 max-w-4xl text-sm leading-7 text-nc-text-secondary">
            {_en
            ? "So FLA is no longer “five subject scores weighted into one age”; it locates a person within the multi-dimensional maturity space and finds which age stage's population maturity distribution they most resemble — while keeping the bottleneck effect, measurement error and the irreversibility of adult status."
            : L("FLA 因此不再是“五科考试加权算一个年龄”，而是根据一个人在多维成熟空间中的位置，寻找他最接近哪一个年龄阶段的人口成熟分布；同时保留短板效应、测量误差与成年身份不可逆性。")}</p>
        </section>

        <div className="rounded-2xl border border-dashed border-violet-400/25 bg-violet-400/[0.035] p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-violet-300">Next · v3.0</p>
              <h3 className="mt-1 text-xl font-semibold text-nc-text">{L("取消五维独立假设")}</h3>
              <p className="mt-2 text-sm leading-7 text-nc-text-secondary">
                {L("数学上更完整的下一版，应加入一个 ")}<InlineMath math={'5\\times5'} /> {_en ? 'covariance matrix, so the age equivalence is computed from a full multivariate probability distribution, explicitly modeling the shared factors and correlational structure among the five dimensions.' : L("协方差矩阵，以完整的多元概率分布计算年龄等效值，显式建模五维之间的共同因素与相关结构。")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

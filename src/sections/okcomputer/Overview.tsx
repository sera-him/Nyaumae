import {
  DIM_LABEL,
  DIM_NAME,
  countByDim,
  observations,
  type Dimension,
} from '@/data/okcomputerObservations';
import { dimBarClass, dimDot } from './dimStyle';
import { revealObservation } from './archiveNavigation';

const dimDesc: Record<Dimension, string> = {
  ASD: '整理与孤独症谱系常见主题相似的表述，如社交沟通、感觉处理、可预测性与系统化偏好；不等于符合诊断标准。',
  ADHD: '整理与注意缺陷多动常见主题相似的表述，如启动、工作记忆、注意稳定与刺激调节；不等于符合诊断标准。',
  CROSS: '两类主题下都可能出现、难以单向归因的材料。这里是重叠索引，不代表 AuDHD 判断。',
  META: '不属于特征本身：时间起点与本人自述的鉴别说明；自述鉴别不能替代专业评估。',
};

const order: Dimension[] = ['ASD', 'ADHD', 'CROSS', 'META'];

export default function Overview() {
  const total = observations.length;
  return (
    <section id="overview" className="border-b border-line bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline gap-4">
          <span className="font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
            01 — Overview
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
            维度总览
          </h2>
        </div>

        <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
          {order.map((d) => {
            const n = countByDim(d);
            return (
              <div key={d} className="bg-cardok p-5 md:p-6">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono2 text-[12px] tracking-wider text-mute">
                    {DIM_LABEL[d]}
                  </span>
                  <span className="font-mono2 text-3xl font-semibold tracking-tight text-inkstrong">
                    {String(n).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-3 h-1 w-full bg-paper">
                  <div
                    className={`h-1 ${dimBarClass[d]}`}
                    style={{ width: `${(n / total) * 100}%` }}
                  />
                </div>
                <p className="mt-4 text-[13px] leading-6 text-ink">{dimDesc[d]}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[12px] leading-5 text-mute">
          计数按主维度；档案筛选会同时包含次维度，因此筛选结果可能略多。
        </p>

        <div className="mt-10">
          <p className="font-mono2 text-[12px] tracking-wider text-mute">
            SPECTRUM · 46 条的维度分布（点击编号跳转；若已筛选，会自动清除筛选）
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {observations.map((o) => (
              <button
                key={o.id}
                type="button"
                title={`#${String(o.id).padStart(2, '0')} ${DIM_NAME[o.dim]}`}
                aria-label={`跳转到第 ${o.id} 条，${DIM_NAME[o.dim]}`}
                onClick={() => revealObservation(o.id)}
                className={`flex h-11 w-11 items-center justify-center font-mono2 text-[12px] text-cardok transition-transform hover:scale-110 focus-visible:scale-110 md:h-9 md:w-9 ${dimDot[o.dim]}`}
              >
                {String(o.id).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

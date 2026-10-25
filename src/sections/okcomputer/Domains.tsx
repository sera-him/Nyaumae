import { DOMAIN_LIST, observations, type Domain } from '@/data/okcomputerObservations';
import ObservationLink from './ObservationLink';

const domainDesc: Record<Domain, string> = {
  感觉处理: '触觉、听觉、痛觉与重复动作分开记录；不把瘙痒或磕碰直接归因于同一机制。',
  执行功能: '启动、维持与收尾的困难；“结构 × 意义”是当前用于理解它们的自我模型。',
  注意调节: '注意分配与稳定性：听而未保持、走神、波动，以及另一端的持续投入。',
  社交沟通: '社交步骤需要刻意运行：眼神、话题与关系深入；亲密需求本身偏向陪伴。',
  思维与想象: '高产出、强联想与沉浸式内在世界；同时关注内在构思与实际输出的差异。',
  记忆: '工作记忆保持困难，以及细节记忆与事件记忆的不对称。',
};

export default function Domains() {
  const max = Math.max(
    ...DOMAIN_LIST.map((d) => observations.filter((o) => o.domains.includes(d)).length),
  );
  return (
    <section id="domains" className="border-b border-line bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline gap-4">
          <span className="font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
            03 — Domains
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
            功能域视图
          </h2>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-mute">
          暂时抛开诊断标签，按“哪类日常功能受到影响”重新归类。一条观察可同时属于多个功能域，因此各域计数不能相加为总数。
        </p>

        <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
          {DOMAIN_LIST.map((d) => {
            const items = observations.filter((o) => o.domains.includes(d));
            return (
              <div key={d} className="bg-cardok p-5 md:p-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-inkstrong">
                    {d}
                  </h3>
                  <span className="font-mono2 text-sm text-mute">
                    {items.length} 条
                  </span>
                </div>
                <div className="mt-3 h-1 w-full bg-paper">
                  <div
                    className="h-1 bg-acc"
                    style={{ width: `${(items.length / max) * 100}%` }}
                  />
                </div>
                <p className="mt-4 text-[13px] leading-6 text-ink">{domainDesc[d]}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {items.map((o) => (
                    <ObservationLink key={o.id} id={o.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

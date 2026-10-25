import { countByDim, observations } from '@/data/okcomputerObservations';

const stats = [
  { n: '46', label: '条自我观察' },
  { n: String(countByDim('ASD')), label: '谱系相关主题' },
  { n: String(countByDim('ADHD')), label: '多动注意相关主题' },
  { n: String(countByDim('CROSS')), label: '交叉共享主题' },
  { n: '30+', label: '个月｜最早语言发育线索' },
];

export default function Hero() {
  return (
    <section id="top" className="no-print border-b border-line">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 md:px-8 md:pb-20 md:pt-20">
        <p className="font-mono2 text-[12px] uppercase tracking-[0.2em] text-acc-deep">
          Observation Archive · 自我编目 · 46 Entries
        </p>
        <h1 className="font-display mt-6 max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight text-inkstrong md:text-6xl">
          46 条自我观察，
          <br />
          与两套神经多样性
          <br />
          描述的逐条对照
        </h1>
        <p className="mt-8 max-w-2xl text-[15px] leading-7 text-ink md:text-base md:leading-8">
          这是一份围绕发育史与当前体验整理的个人编目：把 46
          条自我观察，按孤独症谱系与注意缺陷多动两大类描述中的常见主题建立索引——语言与社交、感觉处理、执行功能、注意模式、思维与记忆。原始表述保持不变，整理注解单独标注，避免把观察与解释混在一起。
        </p>

        <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-cream px-5 py-4">
              <div className="font-mono2 text-2xl font-semibold tracking-tight text-inkstrong md:text-3xl">
                {s.n}
              </div>
              <div className="mt-1 text-[12px] leading-5 text-mute">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 border border-line bg-cardok p-5 md:flex-row md:items-start md:gap-4">
          <span className="font-mono2 shrink-0 text-[12px] tracking-wider text-acc-deep">
            ※ 阅读边界
          </span>
          <p className="text-[13px] leading-6 text-ink md:text-sm">
            本档案<strong className="font-semibold">不是诊断工具</strong>
            ，维度是整理索引，不是诊断概率，“交叉共享”也不代表 AuDHD
            判断。是否属于孤独症谱系、注意缺陷多动或其他情况，只能由具备资质的专业人员结合发育史、功能影响与标准化评估判断。本档案的用途，是把零散体验整理成可供自我理解和就诊讨论的材料（共
            {observations.length} 条）。
          </p>
        </div>
      </div>
    </section>
  );
}

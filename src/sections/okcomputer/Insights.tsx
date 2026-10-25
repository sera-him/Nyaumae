import { insights } from '@/data/okcomputerObservations';
import ObservationLink from './ObservationLink';

export default function Insights() {
  return (
    <section id="insights" className="border-b border-line bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline gap-4">
          <span className="font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
            05 — Patterns
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
            模式洞察
          </h2>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-mute">
          以下五条是用于继续观察的整理假设，不是因果结论。它们的价值在于提示“下一次可以记录什么”，而不是给体验定性。
        </p>

        <div className="mt-10 space-y-px border border-line bg-line">
          {insights.map((it) => (
            <div key={it.index} className="bg-cardok p-5 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:gap-8">
                <span className="font-display shrink-0 text-4xl font-light leading-none text-acc-deep md:w-16 md:text-5xl">
                  {it.index}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold tracking-tight text-inkstrong md:text-xl">
                    {it.title}
                  </h3>
                  <p className="mt-3 max-w-2xl text-[13.5px] leading-7 text-ink md:text-[14.5px]">
                    {it.body}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono2 mr-1 text-[12px] tracking-wider text-mute">
                      涉及条目
                    </span>
                    {it.ids.map((id) => (
                      <ObservationLink key={`${it.index}-${id}`} id={id} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

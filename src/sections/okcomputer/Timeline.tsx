import { timeline } from '@/data/okcomputerObservations';
import ObservationLink from './ObservationLink';

export default function Timeline() {
  return (
    <section id="timeline" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="flex items-baseline gap-4">
          <span className="font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
            04 — Timeline
          </span>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
            发育时间线
          </h2>
        </div>
        <p className="mt-4 max-w-2xl text-[14px] leading-6 text-mute">
          发育史访谈通常关注早期表现与持续过程。以下均为本人回溯线索，不补写未知年龄；能增加具体事件、家人观察或旧记录会更有帮助。
        </p>

        <ol className="mt-10 border-l-2 border-line pl-0">
          {timeline.map((t, i) => (
            <li key={t.era} className="relative pb-10 pl-8 last:pb-0 md:pl-12">
              <span
                className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-paper ${
                  i === timeline.length - 1 ? 'bg-acc' : 'bg-mute'
                }`}
              />
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="font-display text-xl font-semibold tracking-tight text-inkstrong">
                  {t.label}
                </h3>
                <span className="font-mono2 text-[12px] tracking-wider text-mute">
                  {t.sub}
                </span>
              </div>
              <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-ink">{t.note}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.ids.map((id) => (
                  <ObservationLink key={`${t.era}-${id}`} id={id} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

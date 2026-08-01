import { primeFocus, revolutionTable, vppRules, exchangeRates, fosStory, gaoKaiStory, gaoKaiTableData, iqTests, yearDayData } from '@/data/extraStories';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { Cpu, Globe, Scale, GraduationCap, Brain } from 'lucide-react';
import SmartImage from '@/components/SmartImage';

export default function PrimeFocus() {
  return (
    <section id="prime-focus" className="future-line-motion py-24 px-4 sm:px-6 bg-[#0D0614] relative">
      <div className="max-w-[1100px] mx-auto">
        <div className="mb-12" data-motion-reveal>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] mb-3 tracking-wide">{semanticHighlight("Prime Focus & 未来线")}</h2>
          <p className="text-nc-text text-lg">
            初音ミク · Eirene · Damocles · 高考改革
          </p>
        </div>

        {/* Prime Focus Story */}
        {primeFocus.sections.map((section, i) => (
          <div key={i} className="future-story-card bg-[#100A1A] border border-[#8B5CF6]/15 rounded-xl p-6 sm:p-8 mb-6" data-motion-reveal>
            {i === 0 && (
              <SmartImage
                localSrc="/story-prime-focus.jpg"
                alt="Prime Focus"
                aspectRatio="16/9"
                containerClassName="future-story-image w-full rounded-lg border border-[#8B5CF6]/10 mb-4"
                className="object-cover"
              />
            )}
            <h3 className="text-lg font-semibold text-[#00E5CC] mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              {section.subtitle}
            </h3>
            <pre className="font-sans text-sm text-nc-text leading-[1.9] whitespace-pre-wrap">
              {semanticHighlight(section.content)}
            </pre>
          </div>
        ))}

        {/* Revolution Table */}
        <div className="future-data-panel bg-[#100A1A] border border-[#EF4444]/20 rounded-xl overflow-hidden mb-8" data-motion-reveal>
          <div className="px-6 py-4 border-b border-[#EF4444]/10">
            <h3 className="text-lg font-semibold text-[#F0E6FF] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#EF4444]" />
              三次革命
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[500px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#8B5CF6]/10">
                  <th className="text-left px-4 py-3 text-nc-text-muted font-medium">革命</th>
                  <th className="text-left px-4 py-3 text-nc-text-muted font-medium">技术形态</th>
                  <th className="text-left px-4 py-3 text-nc-text-muted font-medium">核心承诺</th>
                  <th className="text-left px-4 py-3 text-nc-text-muted font-medium">真实代价</th>
                </tr>
              </thead>
              <tbody>
                {revolutionTable.map((row) => (
                  <tr key={row.name} className="future-table-row border-b border-[#8B5CF6]/5">
                    <td className="px-4 py-3 text-[#F0E6FF] font-medium">{semanticHighlight(row.name)}</td>
                    <td className="px-4 py-3 text-nc-text">{semanticHighlight(row.type)}</td>
                    <td className="px-4 py-3 text-[#00E5CC]">{semanticHighlight(row.promise)}</td>
                    <td className="px-4 py-3 text-[#EF4444]">{semanticHighlight(row.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* VPP */}
        <div className="future-focus-card bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 sm:p-8 mb-6" data-motion-reveal>
          <h3 className="text-base font-semibold text-[#F0E6FF] mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00E5CC]" />
            虚拟考生计划 (VPP)
          </h3>
          <p className="text-sm text-nc-text leading-relaxed">{semanticHighlight(vppRules)}</p>
        </div>

        {/* Exchange Rates */}
        <div className="future-focus-card bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 mb-6" data-motion-reveal>
          <h3 className="text-base font-semibold text-[#F0E6FF] mb-3">{semanticHighlight("汇率设定（2028）")}</h3>
          <div className="flex flex-wrap gap-4">
            {exchangeRates.map((r, i) => (
              <span key={i} className="future-rate-chip font-mono text-sm text-[#00E5CC] bg-[#1A1025] px-3 py-1.5 rounded-md">{r}</span>
            ))}
          </div>
        </div>

        {/* Year/Day */}
        <div className="future-data-panel bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 mb-6" data-motion-reveal>
          <pre className="font-mono text-sm text-nc-text whitespace-pre-wrap">{semanticHighlight(yearDayData)}</pre>
        </div>

        {/* FOS Story */}
        <div className="future-story-card bg-[#100A1A] border border-[#F59E0B]/15 rounded-xl p-6 sm:p-8 mb-6" data-motion-reveal>
          <h3 className="text-base font-semibold text-[#F59E0B] mb-3 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Fill Ocean High School
          </h3>
          <SmartImage
            localSrc="/story-fill-ocean.jpg"
            alt="Fill Ocean High School"
            aspectRatio="16/9"
            containerClassName="future-story-image w-full rounded-lg border border-[#F59E0B]/10 mb-4"
            className="object-cover"
          />
          <pre className="font-sans text-sm text-nc-text leading-[1.9] whitespace-pre-wrap">{semanticHighlight(fosStory)}</pre>
        </div>

        {/* IQ Tests */}
        <div className="future-focus-card bg-[#100A1A] border border-[#8B5CF6]/10 rounded-xl p-6 sm:p-8 mb-6" data-motion-reveal>
          <h3 className="text-base font-semibold text-[#F0E6FF] mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#8B5CF6]" />
            智商测试三层方法
          </h3>
          <div className="space-y-3">
            {iqTests.map((t, i) => (
              <div key={i} className="future-method-item border-l-2 border-[#8B5CF6]/30 pl-4">
                <p className="text-xs font-mono text-[#F472B6] mb-1">{t.method}</p>
                <p className="text-sm text-nc-text">{semanticHighlight(t.content)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* GaoKai Story */}
        <div className="future-story-card bg-[#100A1A] border border-[#00E5CC]/15 rounded-xl p-6 sm:p-8" data-motion-reveal>
          <h3 className="text-lg font-semibold text-[#00E5CC] mb-3 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            Damocles 高考改革：750分之死
          </h3>
          <SmartImage
            localSrc="/story-damocles-exam.jpg"
            alt="Damocles 高考改革"
            aspectRatio="16/9"
            containerClassName="future-story-image w-full rounded-lg border border-[#00E5CC]/10 mb-4"
            className="object-cover"
          />
          <div className="text-sm text-nc-text leading-[1.9]">
            {(() => {
              const parts = gaoKaiStory.split('[TABLE_PLACEHOLDER]');
              const before = parts[0];
              const after = parts[1] || '';
              return (
                <>
                  <span>{semanticHighlight(before)}</span>
                  <div className="my-6 overflow-x-auto rounded-lg border border-nc-violet/15 bg-nc-bg-secondary">
                    <table className="text-xs font-mono" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
                          {gaoKaiTableData.header.map((cell, i) => (
                            <th key={i} className="px-2 py-1.5 text-left text-nc-text-muted font-normal" style={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>{cell}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
                          {gaoKaiTableData.row1.map((cell, i) => (
                            <td key={i} className="px-2 py-1.5 text-nc-text" style={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>{cell}</td>
                          ))}
                        </tr>
                        <tr>
                          {gaoKaiTableData.row2.map((cell, i) => (
                            <td key={i} className="px-2 py-1.5 text-nc-text" style={{ whiteSpace: 'nowrap' }}>{cell}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <span>{semanticHighlight(after)}</span>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
}

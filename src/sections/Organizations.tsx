import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { organizations, zhihuaClasses } from '@/data/organizations';
import SmartImage from '@/components/SmartImage';
import CollapsibleCard from '@/components/CollapsibleCard';
import HyperCommunication from '@/sections/HyperCommunication';
import { Radio } from 'lucide-react';

function ClassTable() {
  const undergradTotal = zhihuaClasses.reduce(
    (s, c) => s + c.undergradPerYear * c.undergradYears,
    0
  );
  const gradTotal = zhihuaClasses.reduce(
    (s, c) => s + c.gradPerYear * c.gradYears,
    0
  );

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nc-violet/20">
            <th className="text-left py-2 px-2 text-nc-text-muted font-normal">学院</th>
            <th className="text-left py-2 px-2 text-nc-text-muted font-normal">班级</th>
            <th className="text-right py-2 px-2 text-nc-text-muted font-normal">本科</th>
            <th className="text-right py-2 px-2 text-nc-text-muted font-normal">研究生</th>
            <th className="text-left py-2 px-2 text-nc-text-muted font-normal hidden sm:table-cell">方向</th>
          </tr>
        </thead>
        <tbody>
          {zhihuaClasses.map((cls, i) => (
            <tr
              key={cls.name}
              className={`border-b border-nc-violet/10 ${i % 2 === 0 ? 'bg-nc-bg' : 'bg-nc-bg-secondary/30'}`}
            >
              <td className="py-2 px-2 text-nc-text-secondary whitespace-nowrap">{cls.college}</td>
              <td className="py-2 px-2 text-nc-text font-medium">{cls.name}</td>
              <td className="py-2 px-2 text-nc-text-secondary text-right font-mono">
                {cls.undergradPerYear}×{cls.undergradYears}
              </td>
              <td className="py-2 px-2 text-nc-text-secondary text-right font-mono">
                {cls.gradPerYear}×{cls.gradYears}
              </td>
              <td className="py-2 px-2 text-nc-text-muted hidden sm:table-cell">{cls.direction}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-nc-violet/30">
            <td className="py-2 px-2 text-nc-text-muted" colSpan={2}>合计</td>
            <td className="py-2 px-2 text-nc-text font-bold text-right font-mono">{undergradTotal}</td>
            <td className="py-2 px-2 text-nc-text font-bold text-right font-mono">{gradTotal}</td>
            <td className="py-2 px-2 text-nc-text-muted hidden sm:table-cell">在读 {undergradTotal + gradTotal} 人</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Organizations() {
  const { ref, isVisible } = useScrollReveal();
  const [zhihuaExpanded, setZhihuaExpanded] = useState(false);

  return (
    <section id="organizations" className="py-24 px-4 sm:px-6 relative">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-3 tracking-wide">
            {semanticHighlight("组织机构")}
          </h2>
          <p className="text-nc-text-secondary text-lg">
            {semanticHighlight("权力与知识的网络，驱动着这个世界的运转")}
          </p>
        </motion.div>

        {/* Org Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {organizations.map((org, i) => (
            <motion.div
              key={org.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden hover:border-nc-cyan/20 transition-all duration-300"
            >
              <div className="h-32 relative overflow-hidden">
                <SmartImage
                  localSrc={org.image}
                  alt={org.name}
                  containerClassName="absolute inset-0"
                  className="object-cover opacity-60"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${org.color} opacity-40`} />
                {/* Org Icon Badge */}
                <div className="absolute top-3 right-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg shadow-black/30 bg-nc-bg/50 backdrop-blur-sm">
                  <SmartImage
                    localSrc={org.icon}
                    alt={org.shortName || org.name}
                    containerClassName="w-full h-full"
                    className="object-contain p-1"
                  />
                </div>
                <div className="absolute bottom-4 left-5">
                  <h3 className="text-xl font-bold text-white">{semanticHighlight(org.name)}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-nc-text-secondary text-sm leading-relaxed mb-4">{semanticHighlight(org.description)}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: org.accentColor + '20', color: org.accentColor }}>
                      B
                    </span>
                    <span className="text-nc-text-muted">{semanticHighlight("年预算：")}</span>
                    <span className="font-mono text-nc-text">{org.budget}</span>
                  </div>
                  {org.budgetNote && (
                    <p className="text-[11px] text-nc-text-muted pl-8 leading-relaxed">{org.budgetNote}</p>
                  )}
                  {org.facultyCount && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: org.accentColor + '20', color: org.accentColor }}>
                        F
                      </span>
                      <span className="text-nc-text-muted">{semanticHighlight("师资：")}</span>
                      <span className="text-nc-text">教授 {org.facultyCount} 人</span>
                    </div>
                  )}
                  {org.facultyNote && (
                    <p className="text-[11px] text-nc-text-muted pl-8 leading-relaxed">{org.facultyNote}</p>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: org.accentColor + '20', color: org.accentColor }}>
                      M
                    </span>
                    <span className="text-nc-text-muted">{semanticHighlight("核心成员：")}</span>
                    <span className="text-nc-text-secondary">{semanticHighlight(org.members.join('、'))}</span>
                  </div>
                </div>

                {/* Zhihua class table expandable */}
                {org.id === 'zhihua' && (
                  <div className="mt-4 pt-4 border-t border-nc-violet/10">
                    <button
                      onClick={() => setZhihuaExpanded((v) => !v)}
                      className="text-sm text-nc-violet hover:text-nc-cyan transition-colors flex items-center gap-1"
                    >
                      {zhihuaExpanded ? '收起' : '查看班级结构'}
                      <span className={`transition-transform ${zhihuaExpanded ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {zhihuaExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <ClassTable />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* HyperCommunication — nested collapsible */}
        <CollapsibleCard
          id="hyper-communication"
          title="HyperCommunication"
          summary="哲华学校的核心融合机制——让数理生信艺哲语在碰撞中产生火花"
          icon={<Radio className="w-5 h-5 text-nc-cyan" />}
          borderColor="border-nc-cyan/15"
          titleColor="text-nc-cyan"
        >
          <HyperCommunication />
        </CollapsibleCard>
      </div>
    </section>
  );
}

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
              className="organization-motion-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden hover:border-nc-cyan/20 transition-all duration-300"
            >
              <div className="organization-motion-cover h-32 relative overflow-hidden">
                <SmartImage
                  localSrc={org.image}
                  alt={org.name}
                  containerClassName="absolute inset-0"
                  className="object-cover opacity-60"
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${org.color} opacity-40`} />
                {/* Org Icon Badge */}
                <div className="organization-motion-mark absolute top-3 right-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg shadow-black/30 bg-nc-bg/50 backdrop-blur-sm">
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
                      className="organization-expand-button text-sm text-nc-violet hover:text-nc-cyan transition-colors flex items-center gap-1"
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

        {/* 超级智能校规 - 新增 */}
        <CollapsibleCard
          id="super-intelligence-rule"
          title={semanticHighlight("超级智能校规提案")}
          summary={semanticHighlight("学生四不条件+监护人签字，学校必须执行，否则校长被超级智能秒开除")}
          icon={<Radio className="w-5 h-5 text-violet-400" />}
          borderColor="border-violet-500/15"
          titleColor="text-violet-300"
        >
          <div className="p-6">
            <p className="text-sm text-nc-text leading-relaxed">{semanticHighlight("对于任意学生及其就读的学校，只要学生请求①不违法、②不笔试作弊、③不增加学校资源消耗、④不直接影响其他学生，那么监护人签字同意后，学校必须无条件执行，否则校长被超级智能秒开除。")}</p>
          </div>
        </CollapsibleCard>

        {/* 统一招聘平台 - 新增 */}
        <CollapsibleCard
          id="unified-recruitment"
          title={semanticHighlight("国家统一招聘平台")}
          summary={semanticHighlight("先晒价·盲面·后验资，总分定胜负")}
          icon={<Radio className="w-5 h-5 text-emerald-400" />}
          borderColor="border-emerald-500/15"
          titleColor="text-emerald-300"
        >
          <div className="p-6 space-y-3 text-sm text-nc-text leading-relaxed">
            <p>{semanticHighlight("1. 先晒价（面试前）：企业必须提前公示《资质加分表》，明确每个证书/技能加多少分，全网公开，禁止暗箱操作。")}</p>
            <p>{semanticHighlight("2. 盲面（无身份）：面试仅限文字或变声通话，禁止透露性别、年龄、外貌。面试官只问技术问题，打出的分数仅代表“纯能力”。")}</p>
            <p>{semanticHighlight("3. 后验资（面试后）：面试结束后，求职者再提交学历、证书等资质。平台自动核验真伪，并按公示的表格计算附加分。")}</p>
            <p>{semanticHighlight("4. 总分定胜负：最终总分 = 面试能力分 + 资质加分。按分数排名录取，公开透明。")}</p>
            <p className="text-xs text-emerald-300/80 border-t border-emerald-500/10 pt-3">{semanticHighlight("核心铁律：面试时允许撒谎（因为技术问题答不出就露馅）；资质造假零容忍。一切只凭真本事和硬证书说话。")}</p>
          </div>
        </CollapsibleCard>

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

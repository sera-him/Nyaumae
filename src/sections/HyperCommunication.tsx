import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { getLocale } from '@/lib/i18n';
import { Radio, MessageCircle, Shuffle, Eye } from 'lucide-react';
import { modesEn, rulesEn, largeHcEn, calendarEn } from '@/data/hyperCommunication.en';

const modes = [
  {
    icon: <Radio className="w-5 h-5" />,
    name: '汇报',
    desc: '各项目集群 10 分钟闪电汇报，全体师生旁听提问',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    name: '碰撞',
    desc: '预设跨学科议题（如"AGI 能感受颜色吗？"），随机分组辩论',
  },
  {
    icon: <Shuffle className="w-5 h-5" />,
    name: '错位',
    desc: '学生必须用非本学科语言汇报研究进展（冯班用画画、美术班用公式）',
  },
  {
    icon: <Eye className="w-5 h-5" />,
    name: '静默',
    desc: '全员进入星界馆，不使用语言，仅用书写 / 图像 / 代码交流 1.5 小时',
  },
];

const rules = [
  '赵召本人必须参加，缺席视为教学事故',
  '不允许说"这是你们科照真的问题不关我观学院的事"',
  '每学期每位学生至少发言 / 展示 3 次',
  '内容原则上不记录、不存档、不追溯——鼓励冒险表达',
  '大型 HC 分组必须计算机随机分配，禁止同班抱团',
];

const largeHc = [
  {
    name: '收敛 HC',
    time: '1 月初 · 秋季学期末',
    theme: '回顾、总结、收束',
    morning: '各项目集群年度成果展示',
    afternoon: '跨学院辩论：评选"年度最佳集群"',
    evening: '赵召总结：哪些路径被证明无效，该放弃',
  },
  {
    name: '发散 HC',
    time: '6 月底 · 春季学期末',
    theme: '展望、开题、发散',
    morning: '赵召亲自主持发布新年度主题',
    afternoon: '自由组队：学生自主提出新集群方向',
    evening: '点评：哪些方向值得下学期资源倾斜',
  },
];

const calendar = [
  { week: '1-16', label: '秋季学期', hc: '每周五 19:00-21:30' },
  { week: '17-18', label: '1 月初', hc: '大型 HC（收敛）' },
  { week: '—', label: '寒假', hc: '暂停', off: true },
  { week: '19-34', label: '春季学期', hc: '每周五 19:00-21:30' },
  { week: '35-36', label: '6 月底', hc: '大型 HC（发散）' },
  { week: '—', label: '暑假', hc: '暂停', off: true },
];

export default function HyperCommunication() {
  const { ref, isVisible } = useScrollReveal();
  const _en = getLocale() === 'en';
  const modesList = _en ? modesEn : modes;
  const rulesList = _en ? rulesEn : rules;
  const largeHcList = _en ? largeHcEn : largeHc;
  const calendarList = _en ? calendarEn : calendar;

  return (
    <div ref={ref} className="px-4 sm:px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

        {/* Overview cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5"
          >
            <div className="text-nc-violet text-sm font-medium mb-1">{L("频次")}</div>
            <div className="text-nc-text text-lg font-bold">{L("每周五")}</div>
            <div className="text-nc-text-muted text-sm">19:00 - 21:30</div>
            <div className="text-nc-text-muted text-xs mt-2">{L("星界馆主厅 · 全体师生强制参加")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5"
          >
            <div className="text-nc-violet text-sm font-medium mb-1">{L("规模")}</div>
            <div className="text-nc-text text-lg font-bold">{L("约 30 次 / 年")}</div>
            <div className="text-nc-text-muted text-sm">{L("+ 2 次大型 HC")}</div>
            <div className="text-nc-text-muted text-xs mt-2">{L("秋季\"收敛\" · 春季\"发散\"")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5"
          >
            <div className="text-nc-violet text-sm font-medium mb-1">{L("核心规则")}</div>
            <div className="text-nc-text text-sm leading-relaxed">
              {L("全员在场 · 无学科庇护\n              ")}<br />
              {L("强制发言 · 无记录\n            ")}</div>
          </motion.div>
        </div>

        {/* Four modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-10"
        >
          <h3 className="text-lg font-bold text-nc-text mb-4">{L("四种模式")}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modesList.map((mode) => (
              <div
                key={mode.name}
                className="bg-nc-bg-secondary border border-nc-violet/10 rounded-lg p-4 hover:border-nc-cyan/20 transition-colors"
              >
                <div className="flex items-center gap-2 text-nc-violet mb-2">
                  {mode.icon}
                  <span className="font-bold text-nc-text">{mode.name}</span>
                </div>
                <p className="text-nc-text-secondary text-sm leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Large HC */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-10"
        >
          <h3 className="text-lg font-bold text-nc-text mb-4">{L("大型 HC（全天 9:00-21:00）")}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {largeHcList.map((hc) => (
              <div
                key={hc.name}
                className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 hover:border-nc-cyan/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-nc-text">{hc.name}</span>
                  <span className="text-xs text-nc-text-muted">{hc.time}</span>
                </div>
                <p className="text-nc-violet text-sm mb-3">{hc.theme}</p>
                <div className="space-y-1.5 text-sm text-nc-text-secondary">
                  <p><span className="text-nc-text-muted">{L("上午：")}</span>{hc.morning}</p>
                  <p><span className="text-nc-text-muted">{L("下午：")}</span>{hc.afternoon}</p>
                  <p><span className="text-nc-text-muted">{L("晚上：")}</span>{hc.evening}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-10"
        >
          <h3 className="text-lg font-bold text-nc-text mb-4">{L("核心规则")}</h3>
          <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5">
            <ul className="space-y-2">
              {rulesList.map((rule, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-nc-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-nc-violet/20 text-nc-violet flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-lg font-bold text-nc-text mb-4">{L("全年 HC 日历")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nc-violet/20">
                  <th className="text-left py-2 px-3 text-nc-text-muted font-normal">{L("教学周")}</th>
                  <th className="text-left py-2 px-3 text-nc-text-muted font-normal">{L("阶段")}</th>
                  <th className="text-left py-2 px-3 text-nc-text-muted font-normal">{L("HC 安排")}</th>
                </tr>
              </thead>
              <tbody>
                {calendarList.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-nc-violet/10 ${row.off ? 'bg-nc-bg-secondary/30' : ''}`}
                  >
                    <td className="py-2 px-3 text-nc-text-secondary font-mono">{row.week}</td>
                    <td className="py-2 px-3 text-nc-text">{row.label}</td>
                    <td className={`py-2 px-3 ${row.off ? 'text-nc-text-muted' : 'text-nc-text-secondary'}`}>
                      {row.hc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-nc-text-muted text-xs mt-3">
            {L("寒暑假期间 HC 完全暂停。QET 考前两周及期末考试周暂停或缩短。\n          ")}</p>
        </motion.div>
      </div>
    </div>
  );
}

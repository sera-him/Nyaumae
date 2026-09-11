import { motion } from 'framer-motion';
import { professions as profData, activeSkills } from '@/data/skillTicTacToe';
import { semanticHighlight } from '@/lib/semanticHighlight';

// ============================================================
// Rules Panel
// ============================================================

export function RulesPanel() {
  return (
    <div className="space-y-6">
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5">
        <h3 className="text-lg font-bold text-nc-text mb-3">核心机制</h3>
        <div className="space-y-2 text-sm text-nc-text-secondary">
          <p>• 每个格子有独立的成功概率，落子时掷概率骰判定是否成功</p>
          <p>• 失败跳过回合，但根据格子位置获得 SP 补偿：中心 +3，角 +4，边 +6</p>
          <p>• SP 上限 30，每回合 +3 收入，可用技能/购买职业</p>
          <p>• 先连成三连者获胜</p>
        </div>
      </div>


    </div>
  );
}

// ============================================================
// Professions Panel
// ============================================================

export function ProfessionsPanel() {
  return (
    <div className="space-y-4">
      <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5">
        <h3 className="text-lg font-bold text-nc-text mb-4">职业系统（8 种）</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {profData.map((prof, i) => (
            <motion.div
              key={prof.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`bg-nc-bg-secondary border rounded-xl p-4 hover:scale-[1.02] transition-transform bg-gradient-to-br ${prof.color} bg-opacity-5 border-white/10`}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-bold text-nc-text">{semanticHighlight(prof.name)}</h5>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-nc-bg text-nc-text-secondary font-bold">{prof.spCost} SP</span>
              </div>
              <p className="text-xs text-nc-text-secondary leading-relaxed">{semanticHighlight(prof.effect)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Skills Panel
// ============================================================

export function SkillsPanel() {
  return (
    <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full text-sm">
          <thead>
            <tr className="border-b border-nc-violet/10">
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">技能</th>
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">SP</th>
              <th className="text-left px-4 py-3 text-nc-text-muted font-medium">效果</th>
            </tr>
          </thead>
          <tbody>
            {activeSkills.map((skill, i) => (
              <tr key={i} className={`border-b border-nc-violet/5 hover:bg-nc-bg-tertiary/30 transition-colors ${i % 2 === 1 ? 'bg-nc-bg-tertiary/15' : ''}`}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-nc-text-secondary">{semanticHighlight(skill.name)}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-nc-text-secondary whitespace-nowrap">{skill.spCost}</td>
                <td className="px-4 py-3 text-nc-text-secondary text-xs max-w-[400px]">
                  <span>{semanticHighlight(skill.effect)}</span>
                  {skill.detail && <p className="text-[10px] text-nc-text-muted mt-1">{semanticHighlight(skill.detail)}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

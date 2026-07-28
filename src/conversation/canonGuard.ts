import type { CanonStatus, MemoryInput, MemoryRecord } from './types.ts';
import { conversationRepository, type ConversationRepository } from './storage.ts';
import { normalizeSearchText } from './utils.ts';

export type CanonVerdict = 'pass' | 'review' | 'blocked';

export interface CanonConflict {
  id: string;
  severity: 'warning' | 'blocking';
  title: string;
  explanation: string;
  existing: MemoryRecord;
}

export interface CanonAssessment {
  verdict: CanonVerdict;
  conflicts: CanonConflict[];
  checkedRecords: number;
  sourcePriority: string[];
}

const LOCKED_STATUSES = new Set<CanonStatus>(['canon', 'system-rule']);

function comparable(memory: MemoryRecord, input: MemoryInput): boolean {
  if (memory.isDeleted || !LOCKED_STATUSES.has(memory.canonStatus)) return false;
  if (memory.scope !== input.scope) return false;
  if (normalizeSearchText(memory.title) === normalizeSearchText(input.title)) return true;
  const incomingTags = new Set((input.tags ?? []).map(normalizeSearchText));
  return memory.tags.some((tag) => incomingTags.has(normalizeSearchText(tag)));
}

export class CanonGuard {
  private readonly persist: ConversationRepository;

  readonly sourcePriority = [
    '本轮用户明确指令',
    '已锁定正史',
    '用户确认的长期设定',
    '当前项目资料',
    '模型推断',
  ];

  constructor(persist: ConversationRepository = conversationRepository) {
    this.persist = persist;
  }

  assessMemory(input: MemoryInput): CanonAssessment {
    const records = this.persist.listMemories();
    const conflicts = records
      .filter((memory) => comparable(memory, input))
      .filter((memory) => normalizeSearchText(memory.content) !== normalizeSearchText(input.content))
      .map<CanonConflict>((memory) => ({
        id: `canon-conflict:${memory.id}`,
        severity: input.canonStatus === 'draft' || input.canonStatus === 'inferred' ? 'warning' : 'blocking',
        title: `“${input.title}”与已锁定记录不一致`,
        explanation: input.canonStatus === 'draft' || input.canonStatus === 'inferred'
          ? '可以作为草案并存，但不会进入角色可用的正史上下文。'
          : '已阻止覆盖。请先把新内容保存为草案，再单独进行版本裁决。',
        existing: memory,
      }));

    const verdict: CanonVerdict = conflicts.some((conflict) => conflict.severity === 'blocking')
      ? 'blocked'
      : conflicts.length > 0
        ? 'review'
        : 'pass';

    return {
      verdict,
      conflicts,
      checkedRecords: records.filter((memory) => !memory.isDeleted && LOCKED_STATUSES.has(memory.canonStatus)).length,
      sourcePriority: [...this.sourcePriority],
    };
  }
}

export const canonGuard = new CanonGuard();

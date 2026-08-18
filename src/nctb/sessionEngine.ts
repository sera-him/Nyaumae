import {
  DEFAULT_ADAPTIVE_DIFFICULTY,
  NCTB_BANK_VERSION,
  NCTB_DIMENSION_IDS,
  questionsRequiredForDimension,
} from './catalog.ts';
import { defaultBankForMode, getNctbQuestion, questionsFor } from './questionBank.ts';
import { isNctbAnswerCorrect } from './scoring/answerKeys.ts';
import { hashSeed, seededShuffle } from './runtime/seededRandom.ts';
import type {
  NctbBankId,
  NctbDifficulty,
  NctbDimensionId,
  NctbOption,
  NctbResponse,
  NctbSession,
  NctbSessionConfig,
} from './types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}_${uuid}` : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createSeed(): number {
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1);
    globalThis.crypto.getRandomValues(value);
    return value[0] || 1;
  }
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1;
}

function clampDifficulty(value: number): NctbDifficulty {
  return Math.max(1, Math.min(5, Math.round(value))) as NctbDifficulty;
}

function buildCandidateOrder(mode: NctbSession['mode'], bankId: NctbBankId, seed: number): Record<NctbDimensionId, string[]> {
  return Object.fromEntries(NCTB_DIMENSION_IDS.map((dimensionId, index) => [
    dimensionId,
    seededShuffle(questionsFor(mode, dimensionId, bankId).map((question) => question.id), hashSeed(seed + index * 97, dimensionId)),
  ])) as Record<NctbDimensionId, string[]>;
}

export function effectiveResponses(session: NctbSession): NctbResponse[] {
  return session.responses.filter((response) => !response.superseded);
}

export function currentDimensionId(session: NctbSession): NctbDimensionId {
  return session.dimensionOrder[Math.min(session.currentDimensionIndex, session.dimensionOrder.length - 1)] ?? 'pattern';
}

export function currentResponse(session: NctbSession): NctbResponse | undefined {
  return [...session.responses].reverse().find((response) => !response.superseded && response.itemId === session.currentItemId);
}

function targetDifficulty(session: NctbSession, dimensionId: NctbDimensionId): NctbDifficulty {
  const answered = effectiveResponses(session).filter((response) => response.dimensionId === dimensionId).length;
  if (session.friendlyMode && answered === 0) return 1;
  return session.strategy === 'adaptive' ? session.adaptiveDifficulty[dimensionId] : session.fixedDifficulty;
}

/**
 * New exam sessions administer all five items in each dimension. Older local
 * sessions can have shorter frozen candidate lists, so their original length
 * remains the safe upper bound when they are resumed after the bank migration.
 */
export function requiredQuestionsForSessionDimension(session: NctbSession, dimensionId: NctbDimensionId): number {
  const configured = questionsRequiredForDimension(dimensionId, session.focusDimension, session.mode);
  const available = session.candidateOrderByDimension[dimensionId]?.length ?? configured;
  return Math.min(configured, available);
}

function selectNextItem(session: NctbSession): string | undefined {
  const dimensionId = currentDimensionId(session);
  const used = new Set(session.itemOrder);
  const candidates = session.candidateOrderByDimension[dimensionId].filter((id) => !used.has(id));
  const target = targetDifficulty(session, dimensionId);
  let bestId: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const id of candidates) {
    const question = getNctbQuestion(session.mode, id, session.bankId);
    if (!question) continue;
    const distance = Math.abs(question.difficulty - target);
    if (distance < bestDistance) {
      bestId = id;
      bestDistance = distance;
    }
  }
  return bestId;
}

function attachNextItem(session: NctbSession): NctbSession {
  const itemId = selectNextItem(session);
  if (!itemId) return session;
  return {
    ...session,
    currentItemId: itemId,
    currentItemActiveMs: 0,
    currentStimulusSeen: false,
    itemOrder: [...session.itemOrder, itemId],
    updatedAt: nowIso(),
  };
}

export function createNctbSession(input: Partial<NctbSessionConfig> = {}): NctbSession {
  const timestamp = nowIso();
  const mode = input.mode ?? 'formal';
  const bankId = input.bankId ?? defaultBankForMode(mode);
  const focusDimension = input.focusDimension ?? 'all';
  const seed = createSeed();
  return {
    id: createId('nctb-session'),
    schemaVersion: 4,
    bankVersion: NCTB_BANK_VERSION,
    bankId,
    mode,
    strategy: input.strategy === 'adaptive' ? 'fixed' : input.strategy ?? 'fixed',
    friendlyMode: input.friendlyMode ?? false,
    fixedDifficulty: input.fixedDifficulty ?? 3,
    focusDimension,
    phase: 'setup',
    seed,
    dimensionOrder: focusDimension === 'all' ? [...NCTB_DIMENSION_IDS] : [focusDimension],
    currentDimensionIndex: 0,
    currentItemActiveMs: 0,
    currentStimulusSeen: false,
    candidateOrderByDimension: buildCandidateOrder(mode, bankId, seed),
    itemOrder: [],
    responses: [],
    adaptiveDifficulty: { ...DEFAULT_ADAPTIVE_DIFFICULTY },
    activeMs: 0,
    interruptionCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function configureNctbSession(session: NctbSession, patch: Partial<NctbSessionConfig>): NctbSession {
  if (session.phase !== 'setup') return session;
  const mode = patch.mode ?? session.mode;
  const bankId = patch.bankId ?? session.bankId;
  const focusDimension = patch.focusDimension ?? session.focusDimension;
  const requestedStrategy = patch.strategy ?? session.strategy;
  const strategy = requestedStrategy === 'adaptive' ? 'fixed' : requestedStrategy;
  const seed = session.seed;
  return {
    ...session,
    mode,
    bankId,
    strategy,
    friendlyMode: patch.friendlyMode ?? session.friendlyMode,
    fixedDifficulty: patch.fixedDifficulty ?? session.fixedDifficulty,
    focusDimension,
    seed,
    dimensionOrder: focusDimension === 'all' ? [...NCTB_DIMENSION_IDS] : [focusDimension],
    candidateOrderByDimension: buildCandidateOrder(mode, bankId, seed),
    updatedAt: nowIso(),
  };
}

export function startNctbSession(session: NctbSession): NctbSession {
  if (session.phase !== 'setup') return session;
  const timestamp = nowIso();
  return attachNextItem({ ...session, phase: 'active', startedAt: timestamp, updatedAt: timestamp });
}

export function accrueActiveTime(session: NctbSession, deltaMs: number): NctbSession {
  if (session.phase !== 'active' || !Number.isFinite(deltaMs) || deltaMs <= 0) return session;
  const safeDelta = Math.min(5_000, deltaMs);
  return {
    ...session,
    activeMs: session.activeMs + safeDelta,
    currentItemActiveMs: session.currentItemActiveMs + safeDelta,
    updatedAt: nowIso(),
  };
}

export function markCurrentStimulusSeen(session: NctbSession): NctbSession {
  if (session.phase !== 'active' || session.currentStimulusSeen) return session;
  return { ...session, currentStimulusSeen: true, updatedAt: nowIso() };
}

export function answerCurrentQuestion(session: NctbSession, optionId: string): NctbSession {
  if (session.phase !== 'active' || currentResponse(session)) return session;
  const question = getNctbQuestion(session.mode, session.currentItemId, session.bankId);
  if (!question || !question.options.some((option) => option.id === optionId)) return session;
  const isCorrect = isNctbAnswerCorrect(session.bankId, question.id, optionId);
  if (isCorrect === undefined) return session;
  const response: NctbResponse = {
    id: createId('nctb-response'),
    itemId: question.id,
    itemVersion: question.version,
    dimensionId: question.dimensionId,
    difficulty: question.difficulty,
    optionId,
    isCorrect,
    answeredAt: nowIso(),
    activeMs: Math.round(session.currentItemActiveMs),
    timedOut: session.currentItemActiveMs > question.targetMs * 2,
    superseded: false,
  };
  const nextAdaptive = { ...session.adaptiveDifficulty };
  if (session.strategy === 'adaptive') {
    const current = nextAdaptive[question.dimensionId];
    if (!response.isCorrect) nextAdaptive[question.dimensionId] = clampDifficulty(current - 1);
    else if (response.activeMs <= question.targetMs * 1.25) nextAdaptive[question.dimensionId] = clampDifficulty(current + 1);
  }
  return {
    ...session,
    responses: [...session.responses, response],
    adaptiveDifficulty: nextAdaptive,
    updatedAt: nowIso(),
  };
}

export function pauseNctbSession(session: NctbSession): NctbSession {
  if (session.phase !== 'active') return session;
  return {
    ...session,
    phase: 'paused',
    pauseReason: 'manual',
    interruptionCount: session.interruptionCount + 1,
    updatedAt: nowIso(),
  };
}

export function resumeNctbSession(session: NctbSession): NctbSession {
  if (session.phase !== 'paused') return session;
  const resumed = { ...session, phase: 'active' as const, pauseReason: undefined, updatedAt: nowIso() };
  return resumed.currentItemId ? resumed : attachNextItem(resumed);
}

export function advanceNctbSession(session: NctbSession): NctbSession {
  if (session.phase !== 'active' || !currentResponse(session)) return session;
  const dimensionId = currentDimensionId(session);
  const answeredInDimension = effectiveResponses(session).filter((response) => response.dimensionId === dimensionId).length;
  const required = requiredQuestionsForSessionDimension(session, dimensionId);
  if (answeredInDimension >= required) {
    const nextDimensionIndex = session.currentDimensionIndex + 1;
    if (nextDimensionIndex >= session.dimensionOrder.length) {
      const timestamp = nowIso();
      return {
        ...session,
        phase: 'completed',
        currentItemId: undefined,
        currentItemActiveMs: 0,
        currentStimulusSeen: false,
        completedAt: timestamp,
        updatedAt: timestamp,
      };
    }
    return {
      ...session,
      phase: 'paused',
      pauseReason: 'section-break',
      currentDimensionIndex: nextDimensionIndex,
      currentItemId: undefined,
      currentItemActiveMs: 0,
      currentStimulusSeen: false,
      updatedAt: nowIso(),
    };
  }
  if (session.friendlyMode && answeredInDimension > 0 && answeredInDimension % 3 === 0) {
    return {
      ...session,
      phase: 'paused',
      pauseReason: 'friendly-break',
      currentItemId: undefined,
      currentItemActiveMs: 0,
      currentStimulusSeen: false,
      updatedAt: nowIso(),
    };
  }
  return attachNextItem({
    ...session,
    currentItemId: undefined,
    currentItemActiveMs: 0,
    currentStimulusSeen: false,
    updatedAt: nowIso(),
  });
}

export function openNctbReport(session: NctbSession): NctbSession {
  if (!session.reportId || !['completed', 'report'].includes(session.phase)) return session;
  return { ...session, phase: 'report', updatedAt: nowIso() };
}

export function orderedQuestionOptions(session: NctbSession): NctbOption[] {
  const question = getNctbQuestion(session.mode, session.currentItemId, session.bankId);
  if (!question) return [];
  return seededShuffle(question.options, hashSeed(session.seed, `${question.id}:options`));
}

export function sessionCompletion(session: NctbSession): { answered: number; required: number; percentage: number } {
  const answered = effectiveResponses(session).length;
  const required = session.dimensionOrder.reduce((total, dimensionId) => total + requiredQuestionsForSessionDimension(session, dimensionId), 0);
  return { answered, required, percentage: Math.min(100, Math.round(answered / Math.max(1, required) * 100)) };
}

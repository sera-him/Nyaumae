import { NCTB_DIMENSION_IDS } from './catalog.ts';
import type {
  NctbDifficulty,
  NctbDimensionId,
  NctbDimensionResult,
  NctbLegacySnapshot,
  NctbReport,
  NctbResponse,
  NctbSession,
  NctbState,
} from './types.ts';
import { readJsonStorage, removeStorageValue, writeJsonStorage } from '../lib/browserStorage.ts';

export const NCTB_STORAGE_KEY = 'neural-connection:nctb-state:v4';
export const PREVIOUS_NCTB_STORAGE_KEY = 'neural-connection:nctb-state:v3';
export const LEGACY_NCTB_STORAGE_KEY = 'neural-connection:nctb-progress:v2';

const MAX_SESSION_HISTORY = 36;
const MAX_REPORT_HISTORY = 36;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNonNegativeNumber(value) && Number.isInteger(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string';
}

function isOptionalIsoDate(value: unknown): value is string | undefined {
  return value === undefined || isIsoDate(value);
}

function isDifficulty(value: unknown): value is NctbDifficulty {
  return Number.isInteger(value) && typeof value === 'number' && value >= 1 && value <= 5;
}

function isDimensionId(value: unknown): value is NctbDimensionId {
  return typeof value === 'string' && NCTB_DIMENSION_IDS.includes(value as NctbDimensionId);
}

function isUniqueStringArray(value: unknown, allowEmpty = true): value is string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) return false;
  if (!value.every((item) => typeof item === 'string' && item.length > 0)) return false;
  return new Set(value).size === value.length;
}

function isDimensionRecord(
  value: unknown,
  predicate: (entry: unknown) => boolean,
): value is Record<NctbDimensionId, unknown> {
  return isRecord(value) && NCTB_DIMENSION_IDS.every((dimensionId) => predicate(value[dimensionId]));
}

const LEGACY_PRACTICE_ITEM_PREFIX = 'practice-v1-';
const EXAM_FOUNDATION_ITEM_PREFIX = 'formal-a-v1-foundation-';

function migrateItemId(value: unknown): unknown {
  if (typeof value !== 'string' || !value.startsWith(LEGACY_PRACTICE_ITEM_PREFIX)) return value;
  return `${EXAM_FOUNDATION_ITEM_PREFIX}${value.slice(LEGACY_PRACTICE_ITEM_PREFIX.length)}`;
}

function migrateNctbSession(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const candidateOrderByDimension = isRecord(value.candidateOrderByDimension)
    ? Object.fromEntries(Object.entries(value.candidateOrderByDimension).map(([dimensionId, itemIds]) => [
      dimensionId,
      Array.isArray(itemIds) ? itemIds.map(migrateItemId) : itemIds,
    ]))
    : value.candidateOrderByDimension;
  const responses = Array.isArray(value.responses)
    ? value.responses.map((response) => isRecord(response) ? { ...response, itemId: migrateItemId(response.itemId) } : response)
    : value.responses;
  return {
    ...value,
    mode: 'formal',
    bankId: 'formal-a-v1',
    currentItemId: migrateItemId(value.currentItemId),
    itemOrder: Array.isArray(value.itemOrder) ? value.itemOrder.map(migrateItemId) : value.itemOrder,
    candidateOrderByDimension,
    responses,
  };
}

function migrateNctbReport(value: unknown): unknown {
  return isRecord(value) ? { ...value, mode: 'formal' } : value;
}

function isResponse(value: unknown): value is NctbResponse {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.itemId === 'string'
    && value.itemId.length > 0
    && Number.isInteger(value.itemVersion)
    && typeof value.itemVersion === 'number'
    && value.itemVersion > 0
    && isDimensionId(value.dimensionId)
    && isDifficulty(value.difficulty)
    && typeof value.optionId === 'string'
    && value.optionId.length > 0
    && typeof value.isCorrect === 'boolean'
    && isIsoDate(value.answeredAt)
    && isNonNegativeNumber(value.activeMs)
    && typeof value.timedOut === 'boolean'
    && typeof value.superseded === 'boolean';
}

export function isValidNctbSession(value: unknown): value is NctbSession {
  if (!isRecord(value)) return false;
  const modeAndBankMatch = value.mode === 'formal' && value.bankId === 'formal-a-v1';
  const dimensionOrder = value.dimensionOrder;
  const validDimensionOrder = Array.isArray(dimensionOrder)
    && dimensionOrder.length > 0
    && dimensionOrder.every(isDimensionId)
    && new Set(dimensionOrder).size === dimensionOrder.length;
  const focusDimension = value.focusDimension;
  const focusMatchesOrder = validDimensionOrder && (
    focusDimension === 'all'
      ? dimensionOrder.length === NCTB_DIMENSION_IDS.length
        && NCTB_DIMENSION_IDS.every((dimensionId) => dimensionOrder.includes(dimensionId))
      : isDimensionId(focusDimension)
        && dimensionOrder.length === 1
        && dimensionOrder[0] === focusDimension
  );
  return value.schemaVersion === 4
    && typeof value.id === 'string'
    && value.id.length > 0
    && Number.isInteger(value.bankVersion)
    && typeof value.bankVersion === 'number'
    && value.bankVersion > 0
    && modeAndBankMatch
    && (value.strategy === 'fixed' || value.strategy === 'adaptive')
    && typeof value.friendlyMode === 'boolean'
    && isDifficulty(value.fixedDifficulty)
    && (focusDimension === 'all' || isDimensionId(focusDimension))
    && (value.phase === 'setup' || value.phase === 'active' || value.phase === 'paused' || value.phase === 'completed' || value.phase === 'report')
    && (value.pauseReason === undefined || value.pauseReason === 'manual' || value.pauseReason === 'section-break' || value.pauseReason === 'friendly-break')
    && Number.isInteger(value.seed)
    && typeof value.seed === 'number'
    && value.seed >= 0
    && focusMatchesOrder
    && isNonNegativeInteger(value.currentDimensionIndex)
    && value.currentDimensionIndex < dimensionOrder.length
    && isOptionalString(value.currentItemId)
    && isNonNegativeNumber(value.currentItemActiveMs)
    && typeof value.currentStimulusSeen === 'boolean'
    && isDimensionRecord(value.candidateOrderByDimension, (entry) => isUniqueStringArray(entry, false))
    && isUniqueStringArray(value.itemOrder)
    && Array.isArray(value.responses)
    && value.responses.every(isResponse)
    && isDimensionRecord(value.adaptiveDifficulty, isDifficulty)
    && isNonNegativeNumber(value.activeMs)
    && isNonNegativeInteger(value.interruptionCount)
    && isIsoDate(value.createdAt)
    && isIsoDate(value.updatedAt)
    && isOptionalIsoDate(value.startedAt)
    && isOptionalIsoDate(value.completedAt)
    && isOptionalString(value.reportId)
    && isOptionalString(value.completionEventId);
}

function isDimensionResult(value: unknown): value is NctbDimensionResult {
  if (!isRecord(value)) return false;
  return isDimensionId(value.dimensionId)
    && isNonNegativeInteger(value.answered)
    && isNonNegativeInteger(value.correct)
    && value.correct <= value.answered
    && isNonNegativeNumber(value.accuracy)
    && value.accuracy <= 100
    && isNonNegativeNumber(value.score)
    && value.score <= 100
    && isNonNegativeNumber(value.ciLow)
    && isNonNegativeNumber(value.ciHigh)
    && value.ciLow <= value.ciHigh
    && value.ciHigh <= 100
    && isNonNegativeNumber(value.medianActiveMs)
    && isNonNegativeNumber(value.averageDifficulty)
    && value.averageDifficulty <= 5
    && (value.scoreModel === 'accuracy' || value.scoreModel === 'speed-accuracy');
}

export function isValidNctbReport(value: unknown): value is NctbReport {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.sessionId === 'string'
    && value.sessionId.length > 0
    && value.mode === 'formal'
    && (value.strategy === 'fixed' || value.strategy === 'adaptive')
    && typeof value.friendlyMode === 'boolean'
    && (value.focusDimension === 'all' || isDimensionId(value.focusDimension))
    && isIsoDate(value.createdAt)
    && isNonNegativeInteger(value.totalAnswered)
    && isNonNegativeInteger(value.totalCorrect)
    && value.totalCorrect <= value.totalAnswered
    && isNonNegativeNumber(value.totalActiveMs)
    && isNonNegativeInteger(value.interruptionCount)
    && Array.isArray(value.dimensions)
    && value.dimensions.every(isDimensionResult)
    && (value.composite === undefined || (
      isRecord(value.composite)
      && isNonNegativeNumber(value.composite.score)
      && value.composite.score <= 100
      && isNonNegativeInteger(value.composite.coverage)
      && value.composite.coverage <= NCTB_DIMENSION_IDS.length
    ))
    && Array.isArray(value.strengths)
    && value.strengths.every(isDimensionId)
    && Array.isArray(value.focusAreas)
    && value.focusAreas.every(isDimensionId);
}

function v2LegacySnapshot(): NctbLegacySnapshot | undefined {
  try {
    const parsed = readJsonStorage<unknown>(LEGACY_NCTB_STORAGE_KEY, null).value;
    if (!isRecord(parsed)) return undefined;
    const questionProgress = Array.isArray(parsed.questionProgress)
      ? parsed.questionProgress.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      : [];
    const answers = Array.isArray(parsed.answers)
      ? parsed.answers.filter(Array.isArray).reduce((total, part) => total + part.length, 0)
      : 0;
    const answeredCount = Math.max(answers, questionProgress.reduce((total, count) => total + Math.max(0, Math.floor(count)), 0));
    if (answeredCount === 0) return undefined;
    const completedParts = Array.isArray(parsed.completedParts)
      ? parsed.completedParts.filter((value) => typeof value === 'number').length
      : 0;
    return {
      answeredCount,
      completedParts,
      mode: 'formal',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : undefined,
      preservedAt: new Date().toISOString(),
      sourceVersion: 2,
    };
  } catch {
    return undefined;
  }
}

function v3LegacySnapshot(): NctbLegacySnapshot | undefined {
  try {
    const parsed = readJsonStorage<unknown>(PREVIOUS_NCTB_STORAGE_KEY, null).value;
    if (!isRecord(parsed) || parsed.schemaVersion !== 3 || !Array.isArray(parsed.sessions)) return undefined;
    const sessions = parsed.sessions.filter(isRecord);
    const answeredCount = sessions.reduce((total, session) => {
      const responses = Array.isArray(session.responses) ? session.responses.filter(isRecord) : [];
      return total + responses.filter((response) => response.superseded !== true).length;
    }, 0);
    if (answeredCount === 0 && sessions.length === 0) return undefined;
    const latest = [...sessions].sort((left, right) => String(right.updatedAt ?? '').localeCompare(String(left.updatedAt ?? '')))[0];
    const completedParts = sessions.reduce((total, session) => {
      const responses = Array.isArray(session.responses) ? session.responses.filter(isRecord) : [];
      return total + new Set(responses.map((response) => response.dimensionId).filter((id) => typeof id === 'string')).size;
    }, 0);
    return {
      answeredCount,
      completedParts,
      mode: 'formal',
      updatedAt: typeof latest?.updatedAt === 'string' ? latest.updatedAt : undefined,
      preservedAt: new Date().toISOString(),
      sourceVersion: 3,
    };
  } catch {
    return undefined;
  }
}

function legacySnapshot(): NctbLegacySnapshot | undefined {
  return v3LegacySnapshot() ?? v2LegacySnapshot();
}

function emptyState(): NctbState {
  return { schemaVersion: 4, sessions: [], reports: [], legacy: legacySnapshot() };
}

export function loadNctbState(): NctbState {
  try {
    const parsed = readJsonStorage<unknown>(NCTB_STORAGE_KEY, null).value;
    if (!isRecord(parsed) || parsed.schemaVersion !== 4) return emptyState();
    const sessions = Array.isArray(parsed.sessions) ? parsed.sessions.map(migrateNctbSession).filter(isValidNctbSession) : [];
    const reports = Array.isArray(parsed.reports) ? parsed.reports.map(migrateNctbReport).filter(isValidNctbReport) : [];
    const activeSessionId = typeof parsed.activeSessionId === 'string'
      && sessions.some((session) => session.id === parsed.activeSessionId)
      ? parsed.activeSessionId
      : undefined;
    const savedLegacy = isRecord(parsed.legacy)
      && typeof parsed.legacy.answeredCount === 'number'
      && typeof parsed.legacy.completedParts === 'number'
      ? parsed.legacy as unknown as NctbLegacySnapshot
      : undefined;
    return {
      schemaVersion: 4,
      activeSessionId,
      sessions,
      reports,
      legacy: savedLegacy ?? legacySnapshot(),
    };
  } catch {
    return emptyState();
  }
}

export function saveNctbState(state: NctbState): boolean {
  return writeJsonStorage(NCTB_STORAGE_KEY, state).persisted;
}

function trimSessions(sessions: NctbSession[]): NctbSession[] {
  const ordered = [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const unfinished = ordered.filter((session) => !['completed', 'report'].includes(session.phase));
  const finished = ordered.filter((session) => ['completed', 'report'].includes(session.phase));
  return [...unfinished, ...finished.slice(0, Math.max(0, MAX_SESSION_HISTORY - unfinished.length))];
}

export function putNctbSession(state: NctbState, session: NctbSession, makeActive = true): NctbState {
  const sessions = state.sessions.some((item) => item.id === session.id)
    ? state.sessions.map((item) => item.id === session.id ? session : item)
    : [...state.sessions, session];
  return {
    ...state,
    activeSessionId: makeActive ? session.id : state.activeSessionId,
    sessions: trimSessions(sessions),
  };
}

export function putNctbReport(state: NctbState, report: NctbReport): NctbState {
  const reports = state.reports.some((item) => item.id === report.id)
    ? state.reports.map((item) => item.id === report.id ? report : item)
    : [...state.reports, report];
  return {
    ...state,
    reports: reports.sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, MAX_REPORT_HISTORY),
  };
}

export function setActiveNctbSession(state: NctbState, sessionId: string | undefined): NctbState {
  return {
    ...state,
    activeSessionId: sessionId && state.sessions.some((session) => session.id === sessionId) ? sessionId : undefined,
  };
}

export function clearNctbState(): NctbState {
  removeStorageValue(NCTB_STORAGE_KEY);
  removeStorageValue(PREVIOUS_NCTB_STORAGE_KEY);
  removeStorageValue(LEGACY_NCTB_STORAGE_KEY);
  return { schemaVersion: 4, sessions: [], reports: [] };
}

import { getLocale } from '@/lib/i18n';
import { EXACT_TRANSLATIONS, PHRASE_TRANSLATIONS } from './dictionary';
import { applyTranslationRules } from './entries/rules';
import { MANUAL_EXTRA } from './manualExtra';

export const MANUAL_EN: Record<string, string> = {
  ...EXACT_TRANSLATIONS,
  ...MANUAL_EXTRA,
};

const SINGLE_CHAR: Record<string, string> = {
  '项': 'items', '次': 'uses', '篇': 'parts', '条': '', '的': '', '道': 'items',
  '题': 'questions', '秒': 's', '分': 'min', '岁': 'yrs', '步': 'steps', '轮': 'Round',
  '手': 'mv', '种': 'types', '洞': 'holes', '行': 'Row', '列': 'Col', '枚': 'pcs',
  '第': '', '按': 'per', '若': 'If ', '或': 'or', '对': 'vs ', '共': 'Total ',
  '蓝': 'Blue', '橙': 'Orange', '盘': 'boards', '旅': 'Trip', '猫': 'Cat',
  '人': ' people', '位': ' characters',
};
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;

/** Second pass over rule output: translate any remaining dictionary-known CJK runs. */
function innerPass(output: string): string {
  return output.replace(/[\u3400-\u9fff\uf900-\ufaff]+/g, (run) => {
    if (run.length === 1) { const s = SINGLE_CHAR[run]; return s === undefined ? run : s; }
    return MANUAL_EN[run] ?? run;
  });
}

export function L(input: string): string {
  if (typeof input !== 'string') return input;
  if (getLocale() !== 'en') return input;
  const trimmed = input.trim();
  if (trimmed.length === 1 && CJK.test(trimmed)) {
    const single = SINGLE_CHAR[trimmed];
    return single === undefined ? input : input.replace(trimmed, () => single);
  }
  if (trimmed.length < 2 || !CJK.test(trimmed)) return input;
  const exact = MANUAL_EN[trimmed];
  if (exact) return input.replace(trimmed, () => exact);
  const ruled = applyTranslationRules(input);
  if (ruled !== null) return innerPass(ruled);
  let output = input;
  for (const [from, to] of PHRASE_TRANSLATIONS) {
    if (output.includes(from)) output = output.split(from).join(to);
  }
  return output;
}

export function translateSurfaceText(input: string): string {
  return L(input);
}

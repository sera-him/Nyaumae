// Minimal zh-CN / en i18n. Default stays zh-CN (index.html lang="zh-CN").
// Persist choice in localStorage; <html lang> is synced on init + change.
import { readJsonStorage, writeJsonStorage } from './browserStorage';

export type Locale = 'zh-CN' | 'en';
const KEY = 'nc:locale:v1';

const dict = {
  'zh-CN': {
    home: '首页',
    search: '全站搜索',
    skip: '跳到正文',
    comments: '评论',
    like: '点赞',
    progress: '阅读进度',
  },
  en: {
    home: 'Home',
    search: 'Search',
    skip: 'Skip to content',
    comments: 'Comments',
    like: 'Like',
    progress: 'Progress',
  },
} as const;

export type I18nKey = keyof (typeof dict)['zh-CN'];

export function getLocale(): Locale {
  const saved = readJsonStorage<string>(KEY, 'zh-CN').value;
  const locale: Locale = saved === 'en' ? 'en' : 'zh-CN';
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
  return locale;
}

export function setLocale(next: Locale): void {
  writeJsonStorage(KEY, next, 'local');
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}

export function t(key: I18nKey, locale?: Locale): string {
  const active = locale ?? getLocale();
  return dict[active][key] ?? dict['zh-CN'][key];
}

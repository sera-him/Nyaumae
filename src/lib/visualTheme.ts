export const SITE_THEMES = [
  'default',
  'world',
  'characters',
  'stories',
  'miia',
  'math',
  'playground',
  'api',
  'story-mia',
  'story-ocean',
  'story-zhenhai',
  'story-agi',
  'story-giant',
] as const;

export type SiteTheme = (typeof SITE_THEMES)[number];

interface ThemeRoute {
  readonly theme: Exclude<SiteTheme, 'default'>;
  readonly prefixes: readonly string[];
}

const THEME_ROUTES = [
  { theme: 'story-mia', prefixes: ['/stories/mia-world'] },
  { theme: 'story-ocean', prefixes: ['/stories/fox-penguin'] },
  { theme: 'story-zhenhai', prefixes: ['/stories/zhenhai-refining'] },
  { theme: 'story-agi', prefixes: ['/stories/agi-land'] },
  { theme: 'story-giant', prefixes: ['/stories/little-girl-in-giant-country'] },
  { theme: 'world', prefixes: ['/world'] },
  { theme: 'characters', prefixes: ['/characters'] },
  { theme: 'stories', prefixes: ['/stories'] },
  { theme: 'miia', prefixes: ['/miia'] },
  { theme: 'math', prefixes: ['/math'] },
  { theme: 'playground', prefixes: ['/playground'] },
  { theme: 'api', prefixes: ['/api'] },
] as const satisfies readonly ThemeRoute[];

function normalizePathname(pathname: string): string {
  let normalized = pathname.trim();

  // Also accepts a raw HashRouter URL for callers outside React Router.
  const hashIndex = normalized.indexOf('#');
  if (hashIndex >= 0) normalized = normalized.slice(hashIndex + 1);

  const queryIndex = normalized.indexOf('?');
  if (queryIndex >= 0) normalized = normalized.slice(0, queryIndex);

  try {
    normalized = decodeURI(normalized);
  } catch {
    // Keep the original path when a malformed escape sequence is supplied.
  }

  normalized = `/${normalized}`.replace(/\/+/g, '/');
  if (normalized.length > 1) normalized = normalized.replace(/\/+$/, '');
  return normalized.toLowerCase();
}

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Resolve the visual climate for a React Router location pathname.
 * Story routes are intentionally evaluated before the generic stories route.
 */
export function resolveSiteTheme(pathname: string): SiteTheme {
  const normalizedPathname = normalizePathname(pathname);

  for (const route of THEME_ROUTES) {
    if (route.prefixes.some((prefix) => pathMatchesPrefix(normalizedPathname, prefix))) {
      return route.theme;
    }
  }

  return 'default';
}

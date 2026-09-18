/**
 * Content gap report — what still needs the author's own words.
 *
 * Scans the character / relation / story data and writes a prioritised
 * worklist to docs/内容待补清单.md, so "角色详情页太空" can be filled with
 * real content instead of guesswork. Regenerate after editing the data:
 *   npm run content:report
 *
 * Read-only with respect to src/ — it only writes the markdown report.
 */
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { characters } from '../src/data/characters.ts';
import { extraCharacters } from '../src/data/extraCharacters.ts';
import { characterRelations } from '../src/data/relationships.ts';
import { stories } from '../src/data/stories.ts';

const root = resolve(import.meta.dirname, '..');

/** Characters whose short bio is acceptable as-is (one clear sentence). */
const BIO_MIN_CHARS = 40;
/** Characters that are intentionally minimal (ASI logs, side extras). */
const _BIO_EXEMPT = new Set(['gpt', 'mimi', 'mia', 'miia', 'miaowu']); // 保留待接入豁免逻辑（审计 QUA-006）

interface Gap {
  id: string;
  name: string;
  group: string;
  missing: string[];
  bioChars: number;
  profileFields: number;
  relations: number;
  storyCount: number;
  images: number;
}

const relationsByCharacter = new Map<string, number>();
for (const relation of characterRelations) {
  relationsByCharacter.set(relation.from, (relationsByCharacter.get(relation.from) ?? 0) + 1);
  relationsByCharacter.set(relation.to, (relationsByCharacter.get(relation.to) ?? 0) + 1);
}

function countStories(name: string): number {
  return stories.filter((story) => story.chapters.some((chapter) => chapter.content.includes(name))).length;
}

/**
 * Portrait sets are discovered from the filesystem instead of importing
 * `characterImages.ts`, which pulls in Vite-only `import.meta.env` helpers that
 * plain Node cannot evaluate.
 */
const characterDir = resolve(root, 'public', 'characters');
const characterFiles = existsSync(characterDir) ? readdirSync(characterDir) : [];
function countImages(id: string): number {
  return characterFiles.filter((name) => name === `${id}.png` || name === `${id}.jpg` || name.startsWith(`${id}-`)).length;
}

const gaps: Gap[] = [];

for (const character of characters) {
  const bio = character.bio ?? '';
  const profileFields = character.profile?.length ?? 0;
  const relations = relationsByCharacter.get(character.id) ?? 0;
  const storyCount = countStories(character.name);
  const images = countImages(character.id);

  const missing: string[] = [];
  if (!character.title) missing.push('称号 title');
  if (bio.replace(/\s/g, '').length < BIO_MIN_CHARS) missing.push('简介偏薄');
  if (profileFields === 0) missing.push('档案字段 profile');
  if (relations === 0) missing.push('无关联角色');
  if (storyCount === 0) missing.push('未在故事中出场');

  if (missing.length > 0) {
    gaps.push({ id: character.id, name: character.name, group: character.groupLabel, missing, bioChars: bio.replace(/\s/g, '').length, profileFields, relations, storyCount, images });
  }
}

for (const character of extraCharacters) {
  const bio = character.bio ?? '';
  const relations = relationsByCharacter.get(character.id) ?? 0;
  const profileFields = 'profile' in character && Array.isArray(character.profile) ? character.profile.length : 0;
  const missing: string[] = [];
  if (!character.title) missing.push('称号 title');
  if (bio.replace(/\s/g, '').length < BIO_MIN_CHARS) missing.push('简介偏薄');
  if (profileFields === 0) missing.push('档案字段 profile');
  if (relations === 0) missing.push('无关联角色');

  if (missing.length > 0) {
    gaps.push({ id: character.id, name: character.name, group: '附加角色', missing, bioChars: bio.replace(/\s/g, '').length, profileFields, relations, storyCount: countStories(character.name), images: countImages(character.id) });
  }
}

gaps.sort((left, right) => right.missing.length - left.missing.length || left.name.localeCompare(right.name, 'zh-CN'));

// Public art that no source file references — either wire it up or publish the story it belongs to.
function unusedArt(): string[] {
  const sources: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(ts|tsx|css|json|html|mjs|py|xml|txt)$/.test(entry.name)) continue;
      try { sources.push(readFileSync(full, 'utf-8')); } catch { /* unreadable, skip */ }
    }
  };
  walk(resolve(root, 'src'));
  walk(resolve(root, 'scripts'));
  const blob = sources.join('\n');

  const candidates = readdirSync(resolve(root, 'public'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(jpe?g|png|webp|avif|mp4|mp3)$/i.test(entry.name))
    .map((entry) => entry.name)
    .filter((name) => !blob.includes(name));
  return candidates.sort();
}

const unused = unusedArt();
const groupCounts = new Map<string, number>();
for (const gap of gaps) groupCounts.set(gap.group, (groupCounts.get(gap.group) ?? 0) + 1);

const lines: string[] = [];
lines.push('# 角色内容待补清单');
lines.push('');
lines.push('> 由 `npm run content:report` 生成，改完 `src/data/` 后重新运行即可刷新。');
lines.push('> 本清单只统计**结构性缺口**（称号/简介长度/档案字段/关联/出场故事），不代表角色写得好不好。');
lines.push('');
lines.push('## 总览');
lines.push('');
lines.push(`- 角色总数：${characters.length + extraCharacters.length}（主库 ${characters.length} + 附加 ${extraCharacters.length}）`);
lines.push(`- 有结构性缺口的角色：**${gaps.length}**`);
lines.push(`- 关联关系总条数：${characterRelations.length}`);
lines.push(`- 故事总数：${stories.length}`);
lines.push('');
if (groupCounts.size > 0) {
  lines.push('按阵营分布：');
  lines.push('');
  for (const [group, count] of [...groupCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${group}：${count} 位`);
  }
  lines.push('');
}
lines.push('## 待补明细（缺口多的排前面）');
lines.push('');
lines.push('| 角色 | 阵营 | 缺什么 | 简介字数 | 档案字段 | 关联 | 出场故事 | 形象图 |');
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
for (const gap of gaps) {
  lines.push(`| ${gap.name}（${gap.id}） | ${gap.group} | ${gap.missing.join('、')} | ${gap.bioChars} | ${gap.profileFields} | ${gap.relations} | ${gap.storyCount} | ${gap.images} |`);
}
lines.push('');
lines.push('## 填写指引');
lines.push('');
lines.push('1. **称号 title**：一句话身份，如「冯·诺伊曼班候选人」。写在 `src/data/characters.ts` 的 `title`。');
lines.push('2. **简介 bio**：建议 40 字以上，写「她是谁 + 一个具体细节」。');
lines.push('3. **档案字段 profile**：键值对数组，例如 `{ label: \'巨人国身高\', value: \'21 m\' }`，详情页会自动排成三列。');
lines.push('4. **关联角色**：在 `src/data/relationships.ts` 加一条 `{ from, to, type }`，详情页会生成带头像的关联卡。');
lines.push('5. **形象图集**：把多张立绘放进 `public/characters/<id>-*` 并在 `src/data/characterImages.ts` 登记，详情页会自动出现「形象图集」。');
lines.push('');
lines.push('## 未被任何源码引用的素材');
lines.push('');
if (unused.length === 0) {
  lines.push('（无）');
} else {
  lines.push('这些文件在 `public/` 里但没有源码引用，可能是给尚未发布的故事准备的：');
  lines.push('');
  for (const name of unused) lines.push(`- \`public/${name}\``);
}
lines.push('');

const outputDir = resolve(root, 'docs');
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, '内容待补清单.md');
writeFileSync(outputPath, lines.join('\n'), 'utf-8');
console.log(`content-gap-report: ${gaps.length} characters with gaps, ${unused.length} unused art files -> docs/内容待补清单.md`);
if (!existsSync(outputPath)) process.exitCode = 1;

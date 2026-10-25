import {
  DIM_LABEL,
  clinicSummary,
  insights,
  observations,
  timeline,
} from '@/data/okcomputerObservations';

const pad = (id: number) => String(id).padStart(2, '0');
const disclaimer = '个人自我观察整理，仅供自我理解与就诊讨论，不构成医学诊断或排除依据。';

export function buildClinicText() {
  const core = clinicSummary.core
    .map(
      (item, index) =>
        `${index + 1}. ${item.label}（相关条目：${item.ids.map(pad).join('、')}）\n   ${item.desc}`,
    )
    .join('\n');
  const next = clinicSummary.next.map((item, index) => `${index + 1}. ${item}`).join('\n');
  return `自我观察档案｜就诊摘要\n${disclaimer}\n\n【核心材料】\n${core}\n\n【下一步建议】\n${next}\n\n完整原始清单共 ${observations.length} 条，就诊时可一并提供。`;
}

export function buildArchiveMarkdown() {
  const entries = observations
    .map((o) => {
      const dims = [DIM_LABEL[o.dim], ...(o.dimSecondary ? [`次维度：${DIM_LABEL[o.dimSecondary]}`] : [])].join('｜');
      return `### ${pad(o.id)}｜${dims}\n\n- 功能域：${o.domains.join('、')}\n- 原文：${o.text}\n- 整理线索（非证据）：${o.note}`;
    })
    .join('\n\n');

  const eras = timeline
    .map((t) => `### ${t.label}｜${t.sub}\n\n${t.note}\n\n相关条目：${t.ids.map(pad).join('、')}`)
    .join('\n\n');

  const patterns = insights
    .map((it) => `### ${it.index}. ${it.title}\n\n${it.body}\n\n涉及条目：${it.ids.map(pad).join('、')}`)
    .join('\n\n');

  return `# 自我观察档案\n\n> ${disclaimer}\n> 维度是整理索引，不是诊断概率；原始表述与整理注解分开保留。\n\n## 就诊摘要\n\n${buildClinicText()}\n\n## 逐条档案（46 条）\n\n计数按主维度；部分条目带次维度。\n\n${entries}\n\n## 发育时间线\n\n以下内容按本人回溯整理，不补写未知年龄。\n\n${eras}\n\n## 模式洞察\n\n以下为待继续观察的整理假设，不是因果结论。\n\n${patterns}\n`;
}

export function downloadArchiveMarkdown() {
  const blob = new Blob([buildArchiveMarkdown()], {
    type: 'text/markdown;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = '自我观察档案-完整46条.md';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

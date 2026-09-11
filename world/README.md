# 世界内容运营（CMS / 写稿流）

`world/` 下只有 `overview/`、`timeline/` 时，新增设定请按此流程：

1. 在 `world/_cms/` 复制 `template.md` 新建草稿（文件名 `YYYY-MM-DD-主题.md`）。
2. 状态：`draft` -> `review` -> `canon`。`canon` 锁定后只能追加修订，不能静默覆盖。
3. 有冲突时以 `src/conversation/canonGuard.ts` 的 `blocked/review/pass` 为准，
   人工裁决记入 `src/conversation/canonReview.ts` + `CHANGELOG.md`。
4. 图片放对应目录，保持原 `已生成图像*.png` 命名外再加语义化英文别名。

## 目录

- `overview/` 世界概览
- `timeline/` 编年史
- `_cms/template.md` 稿件模板

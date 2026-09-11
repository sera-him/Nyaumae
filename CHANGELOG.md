# 更新日志

格式：`YYYY-MM-DD vX.Y.Z 一句话` + 要点。每次 `canon` 锁定必须记一条。

## 2026-09-04 v0.2.0

- 工程卫生：清理根目录 48 个 `*.log`，补 `.gitignore`，新增 `ci.yml`（lint/test:conversation/test:site/build）。
- 数据层：新增 `IndexedDB` 适配（`idbStorage.ts`）、导入导出与冲突迁移（`storageSync.ts`）、混合检索（`hybridSearch.ts`）。
- 产品闭环：评论/点赞/阅读进度云同步抽象（`cloudSync.ts`）、中英双语（`i18n.ts`）、`feed.xml` RSS、`SiteAids` 无障碍与键盘（`/` 搜索）、`sw.js v12` 离线。
- 内容运营：`world/` 写稿流、正史审核流（`canonReview.ts`）、版本化日志。
- 测试：单测/性能预算脚本，WebLLM 独立分包保留。

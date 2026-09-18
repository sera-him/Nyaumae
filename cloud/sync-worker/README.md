# Nyaumæ 同步 Worker

为网站 AI 的对话、AI 配置（不含密钥）、评论、点赞和阅读进度提供服务端持久化。

## 安全模型

- 客户端用同步密钥 PBKDF2 派生 AES-GCM 密钥，**所有数据在浏览器内加密后才上传**，Worker 只存密文。
- Worker 按 `SHA-256(同步密钥)` 分命名空间，看不到原始密钥。
- AI 配置同步走 `exportSafeAiConfig`，**API Key 永不上传**。

## 部署（一次性，约 2 分钟）

```bash
cd cloud/sync-worker
npx wrangler login                      # 首次需要，登录你的 Cloudflare 账户
npx wrangler kv namespace create SYNC_KV
# 把输出的 id 填进 wrangler.toml 的 id = "..."
npx wrangler deploy
```

部署后得到 `https://nyaumae-sync.<你的子域>.workers.dev`，把它填进网站
「AI 设置 → 云端同步」的同步地址，再设一个足够长的同步密钥（≥ 8 位，
建议随机生成 24 位以上），开启同步即可。多台设备使用**同一个同步密钥**
即可共享数据；忘记密钥等于忘记全部云端数据（服务端只有密文，无法找回）。

## 合并策略

整包最后写入获胜（LWW）：每条数据带 `updatedAt`，拉取时远端较新才覆盖本地，
随后本地变更防抖 2.5 秒后推送。适合单人多设备、不同时编辑的场景。

## 本地开发

```bash
npx wrangler dev        # 本地模拟 KV，无需登录
```

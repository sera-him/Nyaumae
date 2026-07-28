# 网站 AI 交付说明

本文件记录第 2 项“网站 AI”的当前实现边界。它不代表 NCTB、故事系统、图片或游戏阶段已经开始。

## 已实现范围

- 网站助手模式：`/chat`
- 角色对话模式：在对话工作台中选择角色；未选择角色时不能发送
- 故事查询模式：按剧透等级筛选站内资料
- OpenAI 兼容 API 适配器
- 本地模型服务适配器（同样使用 HTTP，请求格式兼容 OpenAI Chat Completions）
- 普通 HTTP 请求与 Fetch ReadableStream / SSE 流式输出，不使用 WebSocket
- 站内全文检索、引用来源和可点击站内路由
- 当前对话的模型覆盖、停止生成、重新生成、编辑上一条用户消息、导出对话
- 对话重新打开后恢复引用和本次请求使用的记忆 ID

## 代码边界

| 能力 | 入口 |
| --- | --- |
| 统一请求流程 | `src/conversation/conversationEngine.ts` |
| 上下文顺序与预算 | `src/conversation/contextBuilder.ts` |
| 站内知识来源 | `src/conversation/siteKnowledgeRetriever.ts` |
| 检索与引用 | `src/conversation/knowledgeRetriever.ts` |
| 模型适配 | `src/conversation/modelAdapters.ts` |
| BYOK 安全处理 | `src/conversation/privacy.ts` |
| 本地状态与迁移入口 | `src/conversation/storage.ts` |
| 对话界面 | `src/pages/ConversationWorkbench.tsx` |
| AI 设置 | `src/pages/AISettingsPage.tsx` |

## 知识检索与引用

网站 AI 复用现有 `src/data/fullSearchIndex.ts`，在检索层转换为统一的知识文档结构。当前全文检索结果会携带：

- 文档标题、类型、正史状态、相关 ID
- 可访问的站内路由
- 与用户问题相关的短摘录
- 故事文档的剧透等级

角色模式只允许检索当前角色自身资料和关系资料，不把全站知识库注入角色上下文。故事查询模式默认最多使用允许等级为 2 的内容；用户未选择角色时，系统拒绝角色模式请求。没有可靠匹配时不会伪造引用。

上下文顺序固定为：核心规则、隐私规则、模式规则、角色边界、页面信息、世界时间点、正史约束、相关知识、相关记忆、会话摘要、最近消息、当前输入。每一部分都有预算，草稿、推断和过期内容不会按默认规则注入。

## BYOK 与本地存储

AI 设置页：`/settings/ai`

- API Key 只保存在当前浏览器的 `localStorage`
- 页面只显示掩码，不显示完整密钥
- 配置导出不包含密钥，只包含 `hasApiKey`
- 导入配置不会覆盖当前已保存的密钥
- 对话导出不包含 AI 配置和 API Key
- 请求错误会先脱敏，再显示给用户；不会记录完整请求头或密钥
- 本地模型适配器不发送 API Key

当前存储键：

- `nyaumae:conversation-state:v1`：对话、消息、摘要、记忆、等级事件和 Prompt 状态
- `nyaumae:ai-config:v1`：本机 AI 配置；密钥属于该浏览器设备，不进入项目数据

如果未来改变结构，应新增版本键或增加显式迁移函数，不要静默覆盖旧数据。

## 使用方法

1. 打开 `/settings/ai`。
2. 开启“启用网站 AI”。
3. 选择 OpenAI 兼容服务或本地模型，填写地址、模型名称和必要的 API Key。
4. 点击“测试连接”，确认后保存。
5. 打开 `/chat`，选择网站助手、角色对话或故事查询模式。
6. 发送问题；若回答使用了站内资料，可在引用区域打开对应页面。

API 文档页 `/api` 只提供服务商格式参考，不连接服务商账户，不生成或伪造密钥、账单、余额、限流和实时用量。

## 当前限制

- 知识库第一阶段使用本地全文检索，尚未接入向量检索。
- 对话与配置默认保存在浏览器本地，没有跨设备同步或服务端持久化。
- 不同服务商对 OpenAI 兼容流式格式的兼容程度可能不同，连接测试应在实际模型上执行。
- 站内资料的正史状态来自现有数据；模型推断不会自动写入正式正史。
- 第 3 项 NCTB 仅保留 Prompt 类型和数据接口预留，不属于本阶段交付。

## 验证

定向回归测试：

```text
npm.cmd run test:conversation
9 tests passed
```

构建和类型检查仍应在每次涉及对话核心的改动后执行。

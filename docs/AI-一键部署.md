# AI 一键部署设计

> 面向对象：第一次使用本站 AI 的普通用户。
> 目标：把「用上 AI」从 7 个步骤、1 个终端、2 个外部下载，压缩到 **点 1 下 + 双击 1 个文件**。

## 1. 原来的问题

旧版 `/settings/ai` 的本地部署路径要求用户依次完成：

1. 自己判断该选「云端 / 电脑本地 / 浏览器」；
2. 在 40 多个尺寸（0.56M—2.8T）里挑一个；
3. 打开 ollama.com 下载安装包并安装；
4. 打开终端，复制粘贴 `ollama pull qwen2.5:7b`；
5. 等模型下载完；
6. 回来手填「本地 API 地址」和「模型名称」；
7. 点「保存并测试连接」。

其中任何一步都可能失败，而且失败提示是技术性的（例如「本地模型服务不可用，请确认服务已启动并允许浏览器跨域访问」）。最隐蔽的一关是第 7 步：Ollama 默认只允许 `127.0.0.1` 来源，线上站点 `https://nyaumae.pages.dev` 调用它会被 CORS 拒绝，而用户几乎不可能自己知道要设置 `OLLAMA_ORIGINS`。

## 2. 新的主路径（一键）

`/settings/ai` 顶部只保留一张卡片，状态机如下：

```
点「一键开启本地 AI」
        │
        ├─ 探测 127.0.0.1:11434 / :1234 / :8000
        │
        ├─ 已有服务且有模型 ──→ 自动选模型 → 测试 → 保存 → 「已连接 · 去对话」
        │
        └─ 没有服务
              └─ 展示「下载一键安装包」
                     └─ 用户双击脚本
                           └─ 页面每 3 秒自动探测
                                 └─ 服务就绪 → 自动测试 / 保存 → 「已连接」
```

关键点：

- **用户不需要做任何配置判断**。尺寸、运行器、地址、模型名都由页面决定。
- **安装期间页面不用刷新**。脚本跑完后服务一上线，页面自动连上。
- **不需要用户懂 CORS**。脚本把当前站点 origin 写进 `OLLAMA_ORIGINS` 并重启 Ollama。
- **失败也有下一步**。安装包下载失败会给出官网地址；服务没起来会提示「重新检测」。
- **不打扰已在用的用户**。已经配好云端 API 或浏览器模型的用户，卡片显示「云端 / 浏览器 AI 已启用」，只给「开始对话」和「改用本地模型」，不会把安装包推到他们面前。

### 探测与选型

`src/conversation/localRuntimeProbe.ts`

| 端口 | 运行器 | 说明 |
| --- | --- | --- |
| `127.0.0.1:11434/v1` | Ollama | 主力路径，脚本会自动安装 |
| `127.0.0.1:1234/v1` | LM Studio | 已装 LM Studio 的用户直接可用 |
| `127.0.0.1:8000/v1` | 本站 CharLSTM | `scripts/charlstm_serve.py` 启动的字符级模型 |

探测使用 `GET /v1/models`，2.5 秒超时。选模型时读取已有模型列表，用 `localModelCatalog` 里的参数规模挑「这台设备跑得动且尽量大」的一个。

### 一键安装包

`src/conversation/oneClickInstaller.ts` 在浏览器端生成脚本，不经过任何服务器：

- Windows：`nyaumae-one-click-ai.bat`
- macOS：`nyaumae-one-click-ai.command`
- Linux：`nyaumae-one-click-ai.sh`

脚本固定做三件事：

1. 安装/复用 Ollama（Windows 用官方 `OllamaSetup.exe` 静默安装；macOS 用 `Ollama-darwin.zip`；Linux 用官方 `install.sh`）；
2. 写入 `OLLAMA_ORIGINS`（当前站点 origin + 生产域名 + 本地开发端口），重启 Ollama 让设置生效；
3. `ollama pull <model>` 下载用户选中的模型。

安全边界：

- 脚本不接收远程指令，内容在生成时已固定；
- 不修改系统 PATH、不装服务、不需要管理员权限（Linux 的 systemd 那一步除外，脚本会提示需要 sudo）；
- `OLLAMA_ORIGINS` 只放行本站域名与本地开发端口，不写 `*`；
- 安装包不会读取或上传任何用户数据。

### 你自己的模型会怎样

这是这条流程必须说清楚的一点：**一键包只新增，不删除。**

| 场景 | 行为 |
| --- | --- |
| Ollama 里已有的模型（含自己 `ollama create` 的模型） | 原样保留。脚本只执行 `ollama pull`，没有任何 `rm`/`delete` |
| 自己训练、自己启动的服务（如 `scripts/charlstm_serve.py`） | 只要它在 `:8000` 提供 `/v1/models`，页面会发现它，直接连接，连安装包都不会出现 |
| 自己命名、站内目录里没有的模型 | 不会被自动选中；但它会出现在「使用已安装的模型」下拉里，可手动指定 |
| 本站自训的 CharLSTM（`public/models/nyaumae-charlstm/*.npz`） | 不用装任何东西：在「一键开启 AI」里点「在浏览器里运行」即可；也可以点「下载权重 .npz」把文件拿走 |
| 已经选好模型的配置 | 一键连接会优先沿用当前配置里的模型（只要它还在本机列表里），不会悄悄换掉 |
| 正在跑的生成任务 | 脚本为了写入 `OLLAMA_ORIGINS` 会重启 Ollama，正在生成的那一条会中断；模型权重不受影响 |

自动选型的顺序：**当前配置的模型 → 按设备内存能跑的最大目录内模型 → 模型列表第一个**。所以「我的模型」优先于「推荐模型」。

CharLSTM 的两个权重（`nyaumae-charlstm-0.56m` / `1.25m`）都在目录里，16GB 机器会自动选 1.25M；也可以在「手动配置」里指定 0.56M 或直接填任意 OpenAI 兼容地址。

## 3. 零安装路径：本站模型直接跑在页面里

卡片上「先试本站自己的模型 · 零安装」这一段，是给「不想装任何东西」的用户准备的最短路径：

1. 选 `NYM 0.56M`（2.3 MB）或 `NYM 1.25M`（4.6 MB）；
2. 点「在浏览器里运行」；
3. 页面自己下载 `.npz`、解包、加载权重，几秒后直接变成「已连接 · 本站模型」。

用户不需要 Python、不需要终端、不需要启动任何服务。权重就是站点里的静态文件：

```
public/models/nyaumae-charlstm/nyaumae-charlstm-0.56m.npz
public/models/nyaumae-charlstm/nyaumae-charlstm-1.25m.npz
```

同一段里还有「下载权重 .npz」，想离线保存或自己拿去研究的人可以直接下载。

实现：`src/conversation/charlstmRuntime.ts` 在浏览器里做三件事——解 ZIP（`.npz` 本质是 zip）、解 `.npy`、按 PyTorch 的 `i,f,g,o` 门序做 LSTM 前向。没有引入任何新依赖，也没有 WebAssembly。

页面会在空闲时预取默认权重（设置页停在「一键开启 AI」时、以及已启用本站模型的聊天页打开时），所以用户真正点按钮/发第一条消息时通常不用再等下载；流量敏感（`Save-Data`）的设备不预取。权重按模型名缓存在页面内，切换会话不会重新下载。

性能（实测，1.25M）：

| 指标 | 数值 |
| --- | --- |
| 权重下载 + 解析 | 通常 0.2–0.9 秒（4.6 MB；本机首次抓取偶发被系统扫描拖慢） |
| 生成速度 | 约 3 ms/字（32 字约 170–250 ms） |
| 与 Python 参考服务的贪心输出 | 逐字一致 |

如果浏览器不支持 `DecompressionStream('deflate-raw')`（老版本 Safari/Firefox），会提示加载失败，用户仍可走 Ollama 安装包路径。

### 还留着「浏览器跑 Llama 1B」

同一张卡片上的「浏览器跑 Llama 1B（约 800 MB）」仍然保留，适合想要通用对话能力、又不想装本地服务的用户；它需要 WebGPU。本站 CharLSTM 不需要 WebGPU，两条路径互不影响。

## 4. 手动配置

原来的三模式配置（云端 / 电脑本地 / 浏览器）、40 多个尺寸、运行器选择、地址与模型名、高级生成设置全部保留，收进折叠的「手动配置」：

- 云端用户仍然走「选服务商 → 贴 Key」两步；
- 需要指定尺寸或接自己的推理服务的高级用户不受影响；
- 一键流程保存后会同步手动表单并清除草稿，避免两套值互相覆盖；
- NYM 0.56M / 1.25M 在「浏览器」模式下也可选，选中后按钮变成「在页面里加载并启用」，不会触发 WebGPU 检查，也不会调用 llama 的下载器。

## 5. 聊天页引导

`/chat` 在未配置 AI 时的空状态里新增一条虚线卡片：「AI 还没有连接 → 一键开启」，直接跳 `/settings/ai`。用户不用先去找设置入口。

## 6. 代码位置

| 能力 | 文件 |
| --- | --- |
| 本机服务探测、选模型、生成配置 | `src/conversation/localRuntimeProbe.ts` |
| 本站 CharLSTM 的浏览器内运行时 | `src/conversation/charlstmRuntime.ts` |
| 一键安装包生成与下载 | `src/conversation/oneClickInstaller.ts` |
| 聊天适配器（含 CharLSTM 分流） | `src/conversation/modelAdapters.ts` |
| 一键面板 UI | `src/components/OneClickAiSetup.tsx` / `.css` |
| 设置页整合 | `src/pages/AISettingsPage.tsx` |
| 聊天页引导 | `src/pages/ThemedChat.tsx`、`src/pages/chat-layout.css` |

## 7. 验证

- `node_modules/.bin/tsc -b`：类型检查通过；
- `vite build`：构建通过；
- 浏览器实测（Playwright + Edge）：权重已预取时，点「在浏览器里运行」约 1 秒内变成「已连接 · 本站模型」；首次抓取若被页面其他资源排队/系统扫描拖慢，进度文案会一直显示「正在下载权重…」，不会假装成功；进入 `/chat/ocean` 发一句话，约 1 秒开始出字；
- 逐字对齐：同一句种子、`temperature=0.01`（贪心）下，浏览器输出与 `scripts/charlstm_serve.py` 的输出完全一致（0.56M 与 1.25M 都验证）；
- 布局：中文 / 英文 / 390px 窄屏均无溢出。

## 8. 还没做的（可选）

- 安装包的下载/安装进度回传到页面（目前只能靠页面 3 秒轮询服务是否上线）；
- 模型体积与显存/内存的更精确匹配（当前用 `deviceMemory` + 目录里的参数规模估算）；
- 局域网内另一台机器跑 Ollama 的场景（需要用户手填地址，仍走手动配置）。

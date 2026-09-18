// Overflow batch — UI chrome that was still rendering in Chinese on English
// mode: error/loading state blocks, resilience notices, feedback modal,
// floating toggles, and secondary page copy missed by the harvested batches.
//
// Keep this list declarative: one entry per surface string, keyed by its
// trimmed rendered text. Strings longer than 48 chars still work here because
// EXACT matching has no length cap — the 48-char limit only gates substring
// (phrase) replacement.

export const OVERFLOW_TRANSLATIONS: Record<string, string> = {
  // ── PageState loading / empty / error / offline / success / forbidden ──
  '正在连接内容': 'Connecting…',
  '内容准备好后会自动显示，请稍候。': 'Content appears automatically when ready — please wait.',
  '这里暂时没有内容': 'Nothing here yet',
  '可以返回上一层，或换一个入口继续探索。': 'You can go back or try another entry.',
  '内容暂时无法显示': 'Content is temporarily unavailable',
  '连接或资源发生了问题，请稍后重试。': 'A connection or resource issue occurred. Please try again later.',
  '恢复网络后即可继续加载尚未缓存的内容。': 'Reconnect to continue loading content that is not cached yet.',
  '操作已完成': 'Done',
  '你的更改已经保存。': 'Your changes have been saved.',
  '没有访问权限': 'No access',
  '当前账户无法查看或执行此操作。': 'This account cannot view or perform this action.',

  // ── AppErrorBoundary full-page crash ──
  '页面资源已更新': 'Page resources updated',
  '页面暂时无法显示': 'Page is temporarily unavailable',
  '这个页面尚未缓存。恢复网络后重新加载，即可继续打开当前页面。':
    'This page is not cached yet. Reconnect and reload to open it.',
  '浏览器仍保留着旧版本资源。重新加载后会继续打开当前页面。':
    'The browser still holds an old version. Reload to continue.',
  '发生了未预期的问题。你可以重新加载页面后再试。':
    'An unexpected error occurred. Reload the page and try again.',

  // ── ResilienceNotices (offline / restored / update / storage) ──
  '站点状态提示': 'Site status notices',
  '网络已恢复': 'Back online',
  '已打开的内容仍可继续浏览；图片、第三方游戏和模型请求需要联网后重试。':
    'Open content stays available; images, third-party games and model requests need the network to retry.',
  '现在可以重试刚才失败的图片、游戏或聊天请求。':
    'You can retry the failed images, games or chat requests now.',
  '发现新版本': 'New version available',
  '刷新后仍会回到当前网址。': 'Refreshing keeps you on this page.',
  '刷新更新': 'Refresh to update',
  '本机存档需要注意': 'Local storage needs attention',
  '知道了': 'Got it',

  // ── RouteErrorBoundary area labels ──
  '故事区域': 'Stories area',
  '角色区域': 'Characters area',
  '世界区域': 'World area',
  '游戏区域': 'Games area',
  '聊天区域': 'Chat area',
  '设置区域': 'Settings area',
  '当前区域': 'This area',
  '原地重试': 'Retry in place',
  '重新载入当前网址': 'Reload current URL',

  // ── FeedbackModal ──
  '关闭反馈窗口': 'Close feedback window',
  '当前反馈接收邮箱': 'Feedback email',
  '截止 2028.6.30 23:59:59 前': 'Until 2028-06-30 23:59:59',
  '2028.6.30 23:59:59 后': 'After 2028-06-30 23:59:59',
  '点击上方邮箱地址即可唤起邮件客户端发送反馈。':
    'Click the email address above to open your mail client.',
  '你也可以手动复制邮箱地址发送邮件。反馈内容可以包括：网站 bug 报告、内容勘误、功能建议，或者任何关于 Neural Connection 世界观的想法。':
    'You can also copy the address manually. Feedback may include bug reports, content corrections, feature suggestions, or thoughts about the Neural Connection world.',

  // ── Floating toggles & small widgets ──
  '关闭音乐': 'Turn music off',
  '开启音乐': 'Turn music on',
  '图片': 'Image',
  '图片加载失败 · 点击重试': 'Failed to load image · click to retry',
  '本章阅读进度': 'Chapter reading progress',
  '⚠ 感官过载激活 ⚠': '⚠ Sensory overload activated ⚠',
  '激活感官过载': 'Activate sensory overload',

  // ── Entry matrix kickers (home) ──
  '叙事': 'Narratives',

  // ── Music toggle aria / navigation extras ──
  '个空间导航': 'spaces navigation',

  // ── AISettingsPage (step labels & buttons) ──
  '选择你的 AI': 'Choose your AI',
  '云端、电脑本地或浏览器内运行，一步一步完成。': 'Cloud, on-device or in-browser — step by step.',
  'AI 放在哪里运行？': 'Where should the AI run?',
  '本地模式不会把对话发送给云端模型服务商。': 'On-device mode never sends chats to a cloud provider.',
  '云端 API': 'Cloud API',
  '最省设备空间，需 API Key': 'Saves disk space; needs an API key',
  '放在电脑本地': 'Run on this computer',
  'Ollama 或官方权重下载，支持 1M—2.8T': 'Ollama or official weights; 1M to 2.8T',
  '放在浏览器': 'Run in the browser',
  '无需安装，模型保存在浏览器缓存': 'No install; model stays in browser cache',
  '选择云端服务': 'Choose a cloud service',
  '选择后只需填写密钥。': 'Select one, then enter your key.',
  '必填': 'Required',
  '留空则继续使用已保存的密钥': 'Leave blank to keep the saved key',
  '粘贴你的 API Key': 'Paste your API key',
  '手动填写模型…': 'Enter model manually…',
  '例如：deepseek-v4-pro': 'e.g. deepseek-v4-pro',
  '自定义模型名称': 'Custom model name',
  '手动填写模型名称': 'Enter model name manually',
  '服务名称': 'Service name',
  'API 地址': 'API endpoint',
  '这是云端模型标识。': 'This is a cloud model identifier.',
  '选择模型尺寸': 'Choose model size',
  '完整覆盖 1M 到 2.8T；默认已按这台设备推荐。': 'Full range 1M to 2.8T; a default is recommended for this device.',
  '未知内存': 'unknown memory',
  '微型': 'Tiny',
  '个人设备': 'Personal device',
  '工作站': 'Workstation',
  '服务器': 'Server',
  '集群': 'Cluster',
  '模型参数规模': 'Model parameter size',
  '推荐': 'Recommended',
  '已选尺寸': 'Selected size',
  '权重/量化内存估算': 'Weights / quantized memory estimate',
  '建议设备': 'Recommended device',
  '当前浏览器支持 WebGPU': 'This browser supports WebGPU',
  '当前浏览器没有可用的 WebGPU': 'This browser has no usable WebGPU',
  '模型会下载到浏览器缓存，之后可离线使用。': 'The model downloads to browser cache and works offline afterwards.',
  '请使用最新版 Chrome/Edge，或改用“电脑本地”。': 'Use the latest Chrome/Edge, or switch to on-device.',
  '这不是普通电脑能轻松运行的尺寸。': 'This size is not easy to run on an ordinary PC.',
  '下载到浏览器': 'Download to browser',
  '连接电脑上的 AI': 'Connect an on-device AI',
  '首次下载后，模型权重会留在当前浏览器。': 'After the first download, the weights stay in this browser.',
  '按照下面三步即可完成本地部署。': 'Follow the three steps below to set up locally.',
  '最简单，推荐': 'Simplest; recommended',
  '图形界面': 'GUI',
  '其他本地服务': 'Other local server',
  'OpenAI 兼容接口': 'OpenAI-compatible endpoint',
  '安装运行器': 'Install the runner',
  '下载安装 Ollama。': 'Download and install Ollama.',
  '下载安装 LM Studio，并在 Local Server 中启动服务。': 'Download LM Studio and start its Local Server.',
  '启动你的本地推理服务并打开 OpenAI 兼容接口。': 'Start your local inference server and enable its OpenAI-compatible endpoint.',
  '打开官方下载页': 'Open official download page',
  '下载模型': 'Download model',
  '加载模型': 'Load model',
  'Ollama 本地包': 'Ollama local package',
  'Hugging Face 官方权重': 'Official Hugging Face weights',
  '官方来源': 'Official source',
  'Ollama 没有这个本地模型包。': 'Ollama has no package for this model.',
  '测试连接': 'Test connection',
  '保持本地服务运行，再点击页面底部的"保存并测试"。': 'Keep the local server running, then click "Save & test" at the bottom.',
  '本地 API 地址': 'Local API endpoint',
  '例如：qwen2.5:7b': 'e.g. qwen2.5:7b',
  '此尺寸可以选择': 'You can select this size',
  '浏览器暂时没有对应权重，请切换到"电脑本地"模式运行。': 'The browser has no weights for this size yet; use on-device mode.',
  '将下载到当前浏览器': 'Will download to this browser',
  '暂无内置浏览器权重': 'No built-in browser weights',
  '请切换到"电脑本地"模式运行这个尺寸。': 'Switch to on-device mode for this size.',
  '无需 API Key · 对话不离开设备': 'No API key · chats stay on-device',
  '刷新页面后仍可使用': 'Survives page refresh',
  '模型由浏览器网站数据管理': 'Managed by browser site data',
  '首次下载需要网络': 'First download needs the network',
  '正在准备模型文件…': 'Preparing model files…',
  '高级生成设置': 'Advanced generation settings',
  '大多数人不需要修改': 'Most people do not need to change this',
  '回答风格': 'Answer style',
  '最大输出长度': 'Max output length',
  '超时时间（秒）': 'Timeout (seconds)',
  '流式显示回答': 'Stream the answer',
  '像打字一样逐字出现': 'Appears character by character, like typing',
  '仅保存': 'Save only',
  '保存并测试连接': 'Save & test connection',
  '取消连接': 'Cancel connection',
  '密钥仅存储在这台设备上': 'Keys are stored only on this device',
  '配置导出中也不会包含密钥。': 'Exported configs never include keys.',
  '前往 AI 对话': 'Go to AI chat',
  '配置迁移与清除': 'Config transfer & reset',
  '可复制或导入不含密钥的配置，适合在不同设备间迁移。': 'Copy or import key-free configs to move between devices.',
  '复制配置': 'Copy config',
  '清除本机设置': 'Clear local settings',
  '清空文本': 'Clear text',
  '在这里粘贴配置 JSON': 'Paste config JSON here',
  '载入配置': 'Load config',
  '严谨': 'Precise',
  '回答稳定直接': 'Stable and direct',
  '平衡': 'Balanced',
  '适合多数对话': 'Good for most chats',
  '创意': 'Creative',
  '表达更多样': 'More varied expression',
  'AI 服务': 'AI service',
  '浏览器 WebGPU': 'Browser WebGPU',
  '本地 OpenAI 兼容服务': 'Local OpenAI-compatible server',
  '正在准备浏览器本地模型…': 'Preparing the browser-local model…',
  '正在连接模型…': 'Connecting to model…',
  '模型已保存在浏览器缓存中，可以离线对话。': 'The model is saved in browser cache; you can chat offline.',
  '连接成功，设置已经保存。': 'Connected; settings saved.',
  '连接失败，请检查填写内容后重试。': 'Connection failed. Check your input and retry.',
  'Ollama 本地模型命令已复制。': 'The Ollama local-model command is copied.',
  '官方权重下载命令已复制。': 'The official weights download command is copied.',
  '清除这台设备上的 AI 设置？': 'Clear the AI settings on this device?',
  '服务地址、模型参数和已保存的密钥都会移除；已经下载的浏览器模型缓存不会自动删除。': 'Endpoint, model params and saved keys are removed; downloaded browser model cache is not auto-deleted.',
  '这台设备上的 AI 设置已清除。浏览器模型缓存可在浏览器的网站数据中清除。': 'AI settings on this device are cleared. Browser model cache can be cleared in browser site data.',
  '配置已复制，内容不包含 API Key。': 'Config copied; it does not include the API key.',
  '配置已放入下方文本框，可手动复制。': 'Config is in the text box below; copy it manually.',
  '载入这份 AI 配置？': 'Load this AI config?',
  '当前表单中的服务、模型和参数会被替换；导入内容不包含 API Key，仍需你自行确认后保存。': 'Current service, model and params will be replaced; the import has no API key, review and save.',
  '配置已载入。确认无误后，请点击"仅保存"。': 'Config loaded. Review and click "Save only".',
  '无法识别这份配置。': 'Unrecognized config.',
  '设置已保存，可以开始对话了。': 'Settings saved; you can start chatting.',
  '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到"电脑本地"模式后再保存。': 'This size has no built-in browser weights; switch to on-device mode before saving.',
  '当前选择的尺寸没有可供浏览器加载的内置权重，请切换到"电脑本地"模式后再保存并测试。': 'This size has no built-in browser weights; switch to on-device mode before saving and testing.',
  '当前模型没有 Ollama 官方本地包。请切换到支持官方权重的运行器并填写其模型名称，或选择 Ollama 可用的模型后再测试。': 'This model has no official Ollama package. Switch to a runner that supports official weights and enter its model name, or pick an Ollama-available model before testing.',
  '表单草稿已保存在本机（不包含 API Key）': 'Draft saved locally (no API key)',
  '正在下载并加载…': 'Downloading and loading…',
  '正在连接…': 'Connecting…',
  '下载模型并启用': 'Download model & enable',

  // ── CatMouseGame (visible chrome only) ──
  '非对称推理追逐': 'Asymmetric reasoning chase',
  '重开': 'Restart',
  '猫': 'Cat',
  '老鼠': 'Mouse',
  '诱饵': 'Bait',
  '可能位置': 'Possible positions',
  '等待开局': 'Waiting to start',
  '选择老鼠的新位置': 'Choose a new position for the mouse',
  '老鼠正在移动': 'The mouse is moving',
  '放置一个误导诱饵': 'Place a misleading bait',
  '判断并移动猫': 'Judge and move the cat',
  '猫正在判断': 'The cat is judging',
  '确认移动': 'Confirm move',
  '放置诱饵': 'Place bait',
  '确认追踪': 'Confirm pursuit',
  '猫完成捕获': 'The cat made the capture',
  '猫完成终局封锁': 'The cat closed the final net',
  '老鼠成功逃脱': 'The mouse escaped',
  '灵感源自 IMO 2017 · 猎人与兔子': 'Inspired by IMO 2017 · Hunter and Rabbit',
  '你追逐的，': 'What you chase,',
  '是真相还是': 'is truth or',
  '诱饵？': 'bait?',
  '在连续平面上展开一场信息不对称的心理战。猫用三次真实气味收紧可能区域；老鼠用假信号与疾跑，把判断引向错误方向。':
    'An asymmetric information game on a continuous plane. The cat narrows the possible region with three real scents; the mouse steers judgment with fake signals and sprints.',
  '推断': 'Infer',
  '从诱饵与轨迹收缩可能区域': 'Narrow the region from bait and tracks',

  // ── BoxDuel visible chrome ──
  '资本与命运的博弈': 'A game of capital and fate',
  '玩家设置': 'Player setup',
  '人类': 'Human',
  '回合数（必须为偶数）': 'Rounds (must be even)',
  '规则': 'Rules',
  '等待游戏开始...': 'Waiting to start…',
  '总净收益': 'Total net gain',
  '金额面板': 'Amount panel',
  '已打开': 'Opened',
  '精神力': 'Spirit',
  '输入金额': 'Enter an amount',
  '点精神力': 'spirit points',
  '玩家 1': 'Player 1',
  '玩家 2': 'Player 2',
  '参赛者': 'Contestant',
  '资本家': 'Capitalist',
  '接受': 'Accept',
  '拒绝': 'Reject',
  '议价': 'Negotiate',
  '提交议价': 'Submit negotiation',
  '确认出价': 'Confirm offer',
  '输入出价金额': 'Enter your offer',
  '输入议价金额': 'Enter your counter-offer',
  '当前出价': 'Current offer',
  '接受议价': 'Accept counter-offer',
  '拒绝议价': 'Reject counter-offer',
  '平局！': 'Draw!',
  '获胜！': 'wins!',
  '总计': 'Total',
  '保留箱子': 'Keep the box',
  '接受出价': 'Accept offer',
  '议价成交': 'Negotiated deal',
  '开始游戏': 'Start game',
  '再来一局': 'Play again',

  // ── CatMachine visible chrome ──
  '猫咪机': 'Cat Machine',
  '把九只猫送进刚刚好的工位': 'Fit nine cats into just the right stations',
  '玩法': 'How to play',
  '关闭音效': 'Turn sound effects off',
  '开启音效': 'Turn sound effects on',
  '有声': 'Sound on',
  '静音': 'Muted',
  '无限营业中': 'Open indefinitely',
  '再过': 'in',
  '班选模块': 'shifts until module',
  '累计呼噜': 'Total purrs',
  '永久保留': 'Kept permanently',
  '鱼干': 'Fish treats',
  '金色毛球': 'Golden furball',
  '点击释放': 'Click to release',
  '本班已点亮': 'Lit this shift',
  '本班突发状况 · SHIFT': 'Shift event · SHIFT',
  '对味': 'matched',
  '本班可用猫爪': 'Cat paws available this shift',
  '加一只猫爪': 'Add a cat paw',
  '本班已加餐': 'Extra added this shift',
  '下班再来': 'Come back next shift',
  '已选': 'Selected',
  '改工位，或点一只猫再点相邻猫交换。': 'Change a station, or click a cat then an adjacent cat to swap.',

  // ── Misc aria-labels & titles missed ──
  '猫鼠迷踪游戏棋盘': 'Cat & Mouse board',
  '猫鼠迷逐棋盘目标控制': 'Cat & Mouse target control',
  '阻力区 · 速度减半': 'Resistance zone · speed halved',
  '棋盘键盘操作': 'Board keyboard controls',
  '将目标重置到当前角色的位置': 'Reset target to the current piece',
  '当前第': 'Current shift',
  '班，无限营业': ', open indefinitely',
  '三层猫咪工位': 'Three floors of cat stations',
  '剩余': 'Remaining',
  '次操作': 'moves left',
  '猫咪机游戏': 'Cat Machine game',
  '打开玩法说明': 'Open instructions',

  // ── Character profiles (characters.ts) ──
  '陈予安': 'Chen Yu\'an',
  '来自现实世界的高中生': 'High-school student from the real world',
  '来自现实世界的高中生，只是出现在《大人国的小女孩》的故事中，并不来自大人国。谨慎、安静，遇到异常事件时仍会尽力帮助别人。':
    'A high-school student from the real world who appears in "The Little Girl in the Giant Country"; she is not from the Giant Country. Cautious and quiet, she still does her best to help others when strange things happen.',
  '现实年龄': 'Real age',
  '身份': 'Identity',
  '所属': 'Affiliation',
  '大人国的小女孩阵营（故事关联）': 'Giant Country girl faction (story connection)',

  '苏珞': 'Su Luo',
  '黑发少年': 'Black-haired youth',
  '背着书包的安静少年，观察细致，习惯把复杂的情绪藏在平静的目光之后。':
    'A quiet youth with a backpack, observant, used to hiding complex emotions behind a calm gaze.',
  '学生': 'Student',

  'GPT': 'GPT',
  '白发 AI 意识体': 'White-haired AI entity',
  '以白发少女形象出现的 AI 意识体，擅长整理知识、拆解问题，并把复杂目标转译成可执行的下一步。':
    'An AI entity appearing as a white-haired girl, skilled at organizing knowledge, breaking down problems, and translating complex goals into actionable next steps.',
  'AI': 'AI',

  '小芽': 'Xiao Ya',
  '二年级小小探索家': 'Second-grade little explorer',
  '喜欢和 AI 一起学习的二年级学生，总把新奇的问题写进自己的小本子里。':
    'A second-grader who loves learning with AI, always writing new and curious questions into her little notebook.',
  '小学二年级': 'Second grade',

  '霓虹': 'Neon',
  '穿行于霓虹都市的赛博朋克游侠，擅长情报追踪与近身防御，行动目标始终保持神秘。':
    'A cyberpunk ranger moving through the neon city, skilled at intelligence tracking and close-quarters defense; their objectives remain mysterious.',
  '赛博朋克游侠': 'Cyberpunk ranger',

  '长风': 'Changfeng',
  '爸比 · 巨人国居民': 'Daddy · Giant Country resident',
  '小满和小谷的父亲，初夏的丈夫。体型高挑修长，按照统一尺度换算后属于偏瘦但健康的成年男性。':
    'Xiaoman and Xiao Gu\'s father, Chuxia\'s husband. Tall and slender; converted to common scale he is a lean but healthy adult male.',
  '巨人国身高': 'Giant Country height',
  '巨人国体重': 'Giant Country weight',
  '普通人等效身高': 'Human-equivalent height',
  '普通人等效体重': 'Human-equivalent weight',
  '等效体型': 'Equivalent build',
  '高挑偏瘦': 'Tall and lean',
  '纪年换算：公元 1991 年 = 巨人国 134 年': 'Era conversion: 1991 CE = Giant Country year 134',

  '初夏': 'Chuxia',
  '妈妈 · 巨人国居民': 'Mom · Giant Country resident',
  '小满和小谷的母亲，长风的妻子。体型纤细；在小满关于家乡的记忆里，她总会准备草莓吐司、热牛奶和切好的苹果。':
    'Xiaoman and Xiao Gu\'s mother, Changfeng\'s wife. Slender build; in Xiaoman\'s memories of home, she always prepared strawberry toast, warm milk, and sliced apples.',
  '纤细型': 'Slender type',
  '纪年换算：公元 1993 年 = 巨人国 136 年': 'Era conversion: 1993 CE = Giant Country year 136',

  '小满': 'Xiaoman',
  '第 9 代 · 巨人国女孩': '9th generation · Giant Country girl',
  '从巨人国意外来到东海市的女孩。黑色长发、琥珀色眼睛，身穿浅蓝色连衣裙；敏感、善良，也会努力避免伤害脚下这个过于小巧的世界。喵呜初见时从低处仰视，将她目测为"十八九米"。':
    'A girl who accidentally arrived in Donghai City from the Giant Country. Long black hair, amber eyes, wearing a light-blue dress; sensitive and kind, trying her best not to hurt this tiny world beneath her feet. When Miaowu first saw her from below, she estimated Xiaoman as "about eighteen or nineteen meters."',
  '巨人国真实身高': 'True Giant Country height',
  '喵呜初见估算': 'Miaowu\'s first estimate',
  '18–19 m（仰视目测）': '18–19 m (estimated from below)',
  '纪年换算：公元 2017 年 = 巨人国 160 年': 'Era conversion: 2017 CE = Giant Country year 160',
  '统一换算：身高 ÷ 12；体重 ÷ 1728': 'Standard conversion: height ÷ 12; weight ÷ 1728',

  '小禾': 'Xiao He',
  '小谷的双胞胎妹妹 · 巨人国女孩': 'Xiao Gu\'s twin sister · Giant Country girl',
  '小谷的双胞胎妹妹。有神经发育障碍，需要像喵呜一样按时服药；虽然发育稍缓，但眼神里总带着温柔的好奇。喜欢和小谷一起躲在窗帘后，听姐姐用舌头顶那颗摇晃的牙。':
    'Xiao Gu\'s twin sister. Has a neurodevelopmental condition and needs medication on schedule like Miaowu; though her development is slower, her eyes always hold gentle curiosity. She likes hiding behind the curtains with Xiao Gu, listening to her sister push her wiggly tooth with her tongue.',
  '正常偏纤细': 'Normal to slender',
  '纪年换算：公元 2020 年 = 巨人国 163 年': 'Era conversion: 2020 CE = Giant Country year 163',

  '小谷': 'Xiao Gu',
  '小满的妹妹 · 巨人国女孩': 'Xiaoman\'s little sister · Giant Country girl',
  '小满明显更年幼的妹妹。正在换牙，会躲在窗帘后用舌头顶那颗摇晃的牙；小满谈起她时，总会自然地放松下来。':
    'Xiaoman\'s visibly younger little sister. Losing baby teeth; she hides behind the curtains pushing her wiggly tooth with her tongue; whenever Xiaoman talks about her, she naturally relaxes.',

  '喵呜': 'Miaowu',
  '小满在普通世界遇见的第一个朋友': 'The first friend Xiaoman meets in the ordinary world',
  '东海市二年级小学生，身高不到 1.3 米，有神经发育障碍，需要按时服药。说话直接、观察细致，不轻易以"正常"或"异常"评判别人；她接纳小满，也成为小满适应普通世界时最重要的朋友。':
    'A second-grader in Donghai City, under 1.3 meters tall, with a neurodevelopmental condition requiring medication on schedule. Speaks directly, observes carefully, and doesn\'t readily judge others as "normal" or "abnormal"; she accepts Xiaoman and becomes the most important friend as Xiaoman adapts to the ordinary world.',
  '现实世界身高': 'Real-world height',
  '年龄依据': 'Age basis',
  '正文未明示；按年级暂定约 8 岁': 'Not stated explicitly; provisionally about 8 by grade level',
  '推定纪年：约公元 2018 年 = 约巨人国 161 年': 'Inferred era: ~2018 CE = ~Giant Country year 161',

  '秀兰奶奶': 'Granny Xiulan',
  '周济的母亲 · 黄豆的主人': 'Zhou Ji\'s mother · Huangdou\'s owner',
  '住在东海市幸福小区的老人，务实、泼辣又热心。她给小满找来窗帘、床单和夏凉被，又架起大锅做饭；面对儿子周济的破产与自责，她用一盘蛋炒饭和朴素的话把他重新拉回生活。':
    'An elderly resident of Xingfu Community, Donghai City—pragmatic, sharp-tongued, and warm-hearted. She finds curtains, bedsheets, and a summer quilt for Xiaoman and sets up a big wok to cook; facing her son Zhou Ji\'s bankruptcy and self-blame, she pulls him back to life with a plate of egg fried rice and plain words.',
  '现实世界身份': 'Real-world identity',
  '东海市居民': 'Donghai City resident',
  '家庭关系': 'Family relation',
  '周济的母亲': 'Zhou Ji\'s mother',
  '宠物': 'Pet',
  '黄豆（土狗）': 'Huangdou (local dog)',
  '纪年换算：公元 1969 年 = 巨人国 112 年': 'Era conversion: 1969 CE = Giant Country year 112',

  '周济': 'Zhou Ji',
  '绿芯半导体驱动工程师': 'Lvgreen Semiconductor driver engineer',
  '在绿芯半导体担任了六年显卡底层驱动工程师，参与支撑 AI 对齐基础设施。公司事故令他的积蓄与期权几乎归零，也使他陷入强烈自责；母亲秀兰和小满的经历让他重新尝试面对问题。':
    'Spent six years as a low-level GPU driver engineer at Lvgreen Semiconductor, helping support AI alignment infrastructure. A company incident wiped out his savings and stock options and plunged him into deep self-blame; his mother Xiulan and Xiaoman\'s story help him try facing problems again.',
  '现实世界职业': 'Real-world occupation',
  '半导体驱动工程师': 'Semiconductor driver engineer',
  '从业时间': 'Years in field',
  '6 年': '6 years',
  '秀兰奶奶的儿子': 'Granny Xiulan\'s son',
  '纪年换算：公元 1994 年 = 巨人国 137 年': 'Era conversion: 1994 CE = Giant Country year 137',

  '外卖员': 'Delivery rider',
  '热心的东海外卖骑手': 'Warm-hearted Donghai delivery rider',
  '最初在路口目睹小满出现，随后主动拿出防水布和野餐垫，并多次骑车跑腿采购食材。他以前做过后厨，熟悉灶具、采购和处理食材，是临时互助小队里行动力很强的一员。正文没有公布他的姓名与精确年龄。':
    'First witnessed Xiaoman appear at an intersection, then volunteered tarps and picnic blankets and made multiple runs on his bike to buy supplies. He used to work in a kitchen, knows stoves, procurement, and food prep—highly action-oriented in the makeshift team. The story never reveals his name or exact age.',
  '外卖骑手；曾做后厨': 'Delivery rider; former kitchen staff',
  '正文未公布': 'Not revealed in text',
  '正文未明示；人物档案暂定约 30 岁': 'Not stated in text; profile provisionally about 30',
  '推定纪年：约公元 1996 年 = 约巨人国 139 年': 'Inferred era: ~1996 CE = ~Giant Country year 139',

  '米迷': 'Mimi',
  '女孩，Neural Connection 世界观中最年幼的意识体。': 'A girl, the youngest entity in the Neural Connection universe.',

  '棋程': 'Qicheng',
  '中国象棋、国际象棋、围棋，他擅长并热爱一切棋类游戏。理科成绩名列前茅。曾在由米雅举行的、和咪呀、Mia、米娅的数学比赛中获得和咪呀并列第一名。':
    'Chinese chess, international chess, Go—he excels at and loves every kind of board game. Top grades in STEM. In a math contest hosted by Miya, tied with Miia for first place against Mia and Amiya.',

  '咪呀': 'Miia',
  '冯·诺伊曼班候选人': 'Von Neumann class candidate',
  '与 Mia 常被合称为"小小咪"。挑战 Codeforces 上高难度的算法题。于 2019 年创造角色 mia³。期待加入哲华学校科照真学院冯·诺伊曼班，研究 QuaAGI。':
    'Often grouped with Mia as "Little Mi." Tackles high-difficulty algorithm problems on Codeforces. Created the character mia³ in 2019. Looks forward to joining the Von Neumann class at Kezhaozhen Academy, Zhehua School, to research QuaAGI.',
  'FSIII 排名并列第 3（226）': 'FSIII tied 3rd (226)',

  'Mia': 'Mia',
  '与咪呀常被合称为"小小咪"。喜欢绘画和音乐，经常弹奏钢琴。':
    'Often grouped with Miia as "Little Mi." Loves painting and music, often plays the piano.',

  '墨璇玥.iv': 'Mo Xuanyue.iv',
  '长发缀满银白珠饰，常着青碧云纹襦裙，手持白梅团扇。':
    'Long hair adorned with silver-white beads, often wears a cyan-blue cloud-patterned ruqun, holding a white plum blossom round fan.',
  '2026.2.20 时：1.47m，32kg': 'As of 2026.2.20: 1.47m, 32kg',
  '与咪呀 p₂r=1.498，与 Mia p₂r=0.970，与米娅 p₂r=0.970': 'p₂r with Miia=1.498, with Mia=0.970, with Amiya=0.970',
  '住在银润豪景，餐费30元，牛奶水果15元，零花钱30元': 'Lives at Yinrun Haojing; meals ¥30, milk & fruit ¥15, allowance ¥30',
  'ID：330206201608201648（NC下1641）': 'ID: 330206201608201648 (NC: 1641)',

  '朵拉·卡可拉': 'Dora Calcla',
  '莱尼尔·塞佛·卡可拉的妹妹，早产 20 天。在哥哥的影响下喜欢密码，设定密码 "c+ti"。':
    'Linear Cypher Calcla\'s younger sister, born 20 days early. Influenced by her brother, she loves ciphers; her password is "c+ti".',

  '爱丽丝': 'Alice',
  '异瞳猫娘萝莉公主，手持玩具魔法棒和童话书《Nymphilia》，常与猫咪在沙滩奔跑玩耍。猫尾可以摘下来。':
    'A heterochromatic catgirl loli princess, carrying a toy wand and the fairytale book "Nymphilia"; often runs and plays on the beach with cats. Her cat tail can be removed.',

  '可乐': 'Cola',
  '一线城市中产阶级的学生，成绩优异、多才多艺，人生轨迹清晰明确。':
    'A student from a first-tier city middle-class family; excellent grades, versatile talents, life trajectory clear and well-defined.',

  '米娅': 'Amiya',
  '活力四射，充满想象力，爱好绘画。对米雅充满崇拜和向往，渴望快些长大，是集体活动的积极发起者。':
    'Energetic, imaginative, loves painting. Full of admiration for Miya and eager to grow up quickly; an enthusiastic organizer of group activities.',

  '神秘的墨色家猫，眼睛如同翡翠，能够穿越梦境。他的额头上有一个月亮印记，行动优雅而敏捷。':
    'A mysterious black house cat with emerald eyes who can traverse dreams. A moon mark on his forehead; moves with elegant agility.',

  '莱尼尔·塞佛·卡可拉': 'Linear Cypher Calcla',
  '国际代数日诞辰': 'Born on International Algebra Day',
  '热爱数学和密码学，擅长解密。随身携带一本笔记本，封面上写着 "pred=2³|23"。':
    'Loves mathematics and cryptography, skilled at decryption. Carries a notebook whose cover reads "pred=2³|23".',
  '坐标：29.2963°N, 118.6558°E': 'Coordinates: 29.2963°N, 118.6558°E',

  'Līlā': 'Līlā',
  '宇宙的秩序': 'The order of the universe',
  '声音。太吵。光。太亮。标签。扎。影子。在晃。杯子必须在那个位置。必须是那个杯子。她只会发一个音。li-la。像是叫自己的名字。像是确认自己还在。行为机械，有自己的小世界。秩序还是没有来。':
    'Sound. Too loud. Light. Too bright. Labels. Prick. Shadows. Swaying. The cup must be in that spot. It must be that cup. She only makes one sound. li-la. Like calling her own name. Like confirming she\'s still here. Movements mechanical, living in her own small world. Order still hasn\'t come.',
  '父母在 SNS 发帖找人"同居"': 'Parents posted on SNS looking for "cohabitation"',

  '林深的女儿，因派的"编外小顾问"。性格更文艺内向，喜欢绘画和写诗。私下运营名为"心渊日志"的频道。':
    'Lin Shen\'s daughter, an "unofficial junior advisor" of the Impact faction. More artistic and introverted; loves painting and writing poetry. Privately runs a channel called "Abyss Journal."',

  '观学院学生': 'Observation Academy student',
  '来自日本的天才歌手，因家庭工作暂居中国，转学至哲华学校观学院。性格温和但极具专注力，与 Mia 因音乐结为好友。':
    'A genius singer from Japan, temporarily living in China due to family work, transferred to the Observation Academy at Zhehua School. Gentle personality but intensely focused; became friends with Mia through music.',

  'mia³': 'mia³',
  '永恒 14 岁学生': 'Eternal 14-year-old student',
  '咪呀在 2019 年创造的"自设"。永恒 14 岁学生，研究人工智能模型的可解释性与底层逻辑架构。':
    'An "original character" created by Miia in 2019. An eternal 14-year-old student researching the interpretability and underlying logical architecture of AI models.',

  'あいえふちゃん': 'If-chan',
  '沐光计划发起人': 'Sunlight Project founder',
  '身高 166cm / 体重 48kg。神经多样性特征。发起"沐光计划"。':
    'Height 166cm / weight 48kg. Neurodivergent. Founded the "Sunlight Project."',

  '米雅': 'Miya',
  '德澜思拓公司领导者': 'Delansi company leader',
  '德澜思拓公司的年轻领导者，沉稳干练。':
    'The young leader of Delansi, calm and capable.',

  '因派 CV（声优）': 'Impact faction voice actor',
  '因派（Impact Inc.）的一名 CV，风格是憨憨和可爱。购买了因派 50ppm 的股份。年薪 18 万元。因派投资一亿美元，研发全国首款二次元 VR 游戏《心界》。':
    'A voice actor at Impact Inc.; style is goofy and cute. Holds 50ppm of Impact shares. Annual salary ¥180,000. Impact invested $100M to develop the country\'s first anime-style VR game, "Xin Jie" (Heart Realm).',

  'Nimfa': 'Nimfa',
  '冯·诺伊曼班教授': 'Von Neumann class professor',
  '仙女，《Nymphilia》童话书主角原型，掌管自然和梦境。拥有透明的翅膀和花冠，出生于森林深处的永恒花园。墨问的妻子。年薪 27 万元。':
    'A fairy, the prototype protagonist of the fairytale book "Nymphilia", governing nature and dreams. Has transparent wings and a flower crown; born in the eternal garden deep in the forest. Mo Wen\'s wife. Annual salary ¥270,000.',
  '教授：Nimfa（85 后，构造出复杂度 2^Θ(√n)）': 'Professor: Nimfa (post-85, constructed complexity 2^Θ(√n))',

  'Nihilib': 'Nihilib',
  '巴别塔班教授': 'Babel class professor',
  '黑暗灵，掌管静谧与遗忘。形象是银发紫裙、手持怀表的少女。Nimfa 的"反面姊妹"，维持平衡。年薪 23 万元。':
    'A dark spirit governing silence and oblivion. Appears as a silver-haired girl in a purple dress holding a pocket watch. Nimfa\'s "opposite sister", maintaining balance. Annual salary ¥230,000.',

  '因派创始人': 'Impact faction founder',
  '大学时代是动漫字幕组骨干、游戏 MOD 制作者、论坛版主。从二次元同人游戏社区转型为手游发行商，最终在 VR 概念兴起时创立"因派"，All in 下一代沉浸式体验。':
    'In college was a core fansubber, game modder, and forum moderator. Transitioned from ACG doujin game communities to mobile game publishing, eventually founding "Impact" when VR emerged, going all-in on next-generation immersive experiences.',
  '设备对比：5000cm³→500cm³，5999元→138元': 'Device comparison: 5000cm³→500cm³, ¥5999→¥138',

  '科照真学院院长': 'Kezhaozhen Academy dean',
  '哲华学校科照真学院院长，一位气质儒雅、目光深邃的学者。科学前沿的探索者。年薪 40 万元。':
    'Dean of Kezhaozhen Academy at Zhehua School, an elegant scholar with a deep gaze. An explorer of scientific frontiers. Annual salary ¥400,000.',
  '赵召院士证明了核心结论"任意复杂度 ω(n) 的 QuaAGI 训练算法均存在，即边际效益可下降得任意缓慢。"':
    'Academician Zhao Zhao proved the core result: "QuaAGI training algorithms of any complexity ω(n) exist, meaning marginal returns can decrease arbitrarily slowly."',

  '巴别塔班班主任': 'Babel class homeroom teacher',
  '墨奥幂.fc 和墨璇玥.iv 的父亲，哲华学校科照真学院巴别塔班班主任兼教授。研究方向是"生物意识"。话极少，常年待在实验室。和德澜思拓公司合作。年薪 27 万元。':
    'Father of Moaomi.fc and Mo Xuanyue.iv, homeroom teacher and professor of the Babel class at Kezhaozhen Academy, Zhehua School. Research area: "biological consciousness." Rarely speaks, stays in the lab year-round. Collaborates with Delansi. Annual salary ¥270,000.',
  '1978/1983（取决于参考系）': '1978/1983 (depending on reference frame)',
  '桌上总有一杯冷掉的茶，杯子上画着一匹骏马': 'Always a cup of cold tea on the desk; the cup is painted with a galloping horse',

  'Retina': 'Retina',
  'Pupil · 小学生': 'Pupil · elementary school student',
  '字面意义上的"pupil"——一名小学生。背书包、写作业、上课举手发言，是人群里最常见的那种小学生。':
    'A literal "pupil"—an elementary school student. Backpack, homework, raising hand in class; the most ordinary kind of elementary school kid.',
  '小学生（Pupil）': 'Elementary student (Pupil)',

  '《心界》中的 AI': 'AI in "Heart Realm"',
  '2026 年 2 月 20 日，《心界》迎来第一个活动"沐诚艺柏"，"零"作为任务 NPC 出现。':
    'On February 20, 2026, "Heart Realm" launched its first event "Muchen Yibai", and "Zero" appeared as a quest NPC.',

  // ── Character group labels ──
  '《大人国的小女孩》': 'The Little Girl in the Giant Country',
  'M/I/A 家族': 'M/I/A family',
  '因派系': 'Yin faction',

  // ── Worldview stats (worldview.ts) ──
  '世界观人口': 'World population',
  '人': 'people',
  '岁 6 月 24 天': 'years, 6 months, 24 days',
  'QET 笔试上限': 'QET written round cap',
  'QET 最终录取': 'QET final admits',
  '自由': 'Free',
  '线偏': 'Linear-bias',
  '约束': 'Constrained',
  '复合': 'Compound',
  '多项': 'Multinomial',
  '牛津': 'Oxford',
  '平方': 'Quadratic',
  '立方': 'Cubic',
  '无婴': 'Infant-free',
  '新年': 'New Year',
  '新的意识周期开始': 'A new consciousness cycle begins',
  '国际代数日': 'International Algebra Day',
  '纪念代数对现代思维的奠基': 'Commemorating algebra\'s foundation of modern thought',
  '国际几何日': 'International Geometry Day',
  '别名：国际对数日': 'Also known as: International Logarithm Day',
  '报名 1000-1500 人（含大三模拟考生），65536 为理论上限':
    '1000–1500 sign up (including junior-year mock exam takers); 65536 is the theoretical cap',

  // ── World settings (worldSettings.ts) ──
  '故事中，科照真学院和德澜思拓公司是核心，其次是（潜）意识，再次是因派/心界，最后是心渊日志（普通角色支线）。':
    'In the story, Kezhaozhen Academy and Delansi are central; next is (sub)consciousness, then the Impact faction / Heart Realm, and finally the Abyss Journal (ordinary-character side stories).',
  '需要注意，不要把角色之间的简介混淆，除非明确提到其他角色。':
    'Note: do not mix up character bios unless other characters are explicitly mentioned.',
  '世界观设定：计算机科学家已经发现了一种AGI训练方式，可以训练任意能力n的AGI，但是需要2^Θ(n)的算力，这种方式被称为"投币机"。':
    'World setting: computer scientists have discovered an AGI training method that can train AGI of arbitrary capability n, but requires 2^Θ(n) compute. This method is called "the Slot Machine."',
  '假说：其他条件不变，神经密度越高，意识值越大，且为S型曲线':
    'Hypothesis: all else equal, higher neural density yields higher consciousness value, following an S-curve',
  '全国硕士统考同步考，101+201+301+自命题，教育局监管，谁都能报。最大报名人数65536人，最大通过人数256人，报名费128元。':
    'Taken alongside the national graduate entrance exam (101+201+301+self-set paper), overseen by the Education Bureau; anyone may register. Max applicants 65,536, max passes 256, fee ¥128.',
  '最大报名人数256人，最大通过人数16人，报名费512元。做题时先猜自己能得多少分（预测）；如果实际得分 ≥ 预测 → 拿预测分；如果实际 < 预测 → 拿 0 分。可以多次提交，每次提交的Penalty=提交时间+10分钟×（本题当次提交次数-1），总用时是每题首次最高分Penalty之和。排名：先看总分，再看总用时（越少越好）。':
    'Max applicants 256, max passes 16, fee ¥512. Before solving, predict your score; if actual ≥ predicted → keep predicted score; if actual < predicted → score 0. Multiple submissions allowed; each submission penalty = submission time + 10 min × (submissions for that problem that round − 1); total time = sum of best-first-submission penalties per problem. Ranking: by total score, then total time (lower is better).',
  '米雅朋友圈：米迷、棋程、咪呀、Mia、爱丽丝、可乐、米娅、mia³':
    'Miya\'s circle: Mimi, Qicheng, Miia, Mia, Alice, Cola, Amiya, mia³',
  'あいえふちゃん发起"沐光计划"。2026年2月20日，《心界》迎来第一个活动"沐诚艺柏"，"零"作为任务NPC出现。':
    'If-chan founded the "Sunlight Project." On Feb 20, 2026, "Heart Realm" launched its first event "Muchen Yibai", and "Zero" appeared as a quest NPC.',
  '"心渊日志"——林浅私下运营的频道，记录《心界》VRlog（本质上是日记）。':
    '"Abyss Journal"—Lin Qian\'s private channel recording Heart Realm VRlogs (essentially a diary).',
  '四维测试：牛马人格 vs 猫咪喵格': 'Four-Dimension Test: Workhorse vs Cat',
  '打断抗性': 'Interruption resistance',
  '行动闹钟': 'Action alarm clock',
  '专注模式': 'Focus mode',
  '察言观色': 'Reading the room',
  '可以回去：被打断后能无缝接上之前的任务（牛马被迫锻炼出的技能）。':
    'Can resume: picks up seamlessly after interruption (a skill workhorses are forced to build).',
  '回不去了：一旦被打断，刚才的注意力就彻底飘走，再也找不回。':
    'Cannot resume: once interrupted, that focus is gone forever.',
  '客观时间：起床啦，该洗脸刷牙啦。':
    'Objective time: time to wake up, wash face and brush teeth.',
  '生心理钟：困不困？饿不饿？想不想？都比现在几点重要。':
    'Psychological clock: Tired? Hungry? In the mood? All matter more than what time it is.',
  '主观能动：可以靠意志力让自己专注起来。可以"努力"。':
    'Volitional: can use willpower to focus. Can "try hard."',
  '被动调整：主观能动性没有用！状态来了就做，没状态就躺，身体自动切换。':
    'Passive: willpower doesn\'t work! Do it when the mood strikes, lie down when it doesn\'t; the body switches automatically.',
  '理所当然：这不是自动的吗？以人为对象的解读是后台常驻进程。':
    'Taken for granted: isn\'t this automatic? Reading people is a background process.',
  '并非如此：当然不是自动呀！大脑默认不扫描这类信息。':
    'Not at all: of course it\'s not automatic! The brain doesn\'t scan this stuff by default.',
  '"家长主义批判框架"：5号原则检验程序对称，但不保证风险共担；1号原则隐含风险共担，但不影响行为正当性，只区分无辜与自愿牺牲。7-9号原则直接划定"替别人做决定"的伦理边界。':
    '"Paternalism critique framework": principle 5 tests procedural symmetry but doesn\'t guarantee risk-sharing; principle 1 implies risk-sharing without affecting the rightness of acts, only distinguishing innocence from voluntary sacrifice. Principles 7–9 directly draw the ethical line for "deciding for others."',
  '主流价值观认为法律是为了减少社会危害，但哲华学校观学院的法学观认为：法律应当是为了减少无辜的人因为客观原因（比如缺乏常识）而被伤害。':
    'Mainstream values hold that law exists to reduce social harm, but Zhehua School\'s Observation Academy holds: law should exist to reduce innocent people being harmed due to objective reasons (e.g., lack of common sense).',
  '自主性至上原则': 'Autonomy First Principle',
  '权利可放弃原则': 'Waiver of Rights Principle',
  '道德普遍主义': 'Moral Universalism',
  '责任分离原则': 'Responsibility Separation Principle',
  '可逆性检验原则': 'Reversibility Test Principle',
  'nyaumæ 法则': 'nyaumæ Rule',
  '自主屏障原则': 'Autonomy Barrier Principle',
  '不作为免责原则': 'Omission Excuse Principle',
  '家长主义之恶原则': 'Paternalism-as-Evil Principle',
  '反家长主义': 'Anti-Paternalism',
  '反代理指标': 'Anti-Proxy Metric',
  '纯震慑刑罚观': 'Pure Deterrence View of Punishment',
  '人即目的': 'Humanity as End',
  '集体涌现': 'Collective Emergence',
  '即时同意，随时可撤': 'Immediate Consent, Revocable Anytime',
  '静止即运动': 'Rest as Motion',
  '规律开放': 'Open Laws',
  '社哲解绑': 'Society–Philosophy Unbound',
  '文明标签': 'Civilization Label',
  // ── Autism features domains ──
  '一、运动与刻板行为域': 'I. Motor & Stereotyped Behaviors',
  '二、沟通与语言域': 'II. Communication & Language',
  '三、感觉处理域': 'III. Sensory Processing',
  '四、日常生活与自理域': 'IV. Daily Living & Self-Care',
  '五、情绪与行为爆发域': 'V. Emotional & Behavioral Outbursts',
  '六、认知与兴趣域': 'VI. Cognition & Interests',
  '七、社会性与依附行为': 'VII. Sociality & Attachment',

  // ── Timeline (timeline.ts) ──
  '关键证明': 'Key proof',
  '赵召完成 QuaAGI 的非构造性证明，获得大量资源':
    'Zhao Zhao completes non-constructive proof of QuaAGI, securing major resources',
  '咪呀出生': 'Miia born',
  'M/I/A 家族成员咪呀出生': 'M/I/A family member Miia born',
  '哲华创立': 'Zhehua founded',
  '赵召创办哲华学校，科照真学院与观学院并立，学科融合理念确立':
    'Zhao Zhao founds Zhehua School; Kezhaozhen Academy and Observation Academy coexist; interdisciplinary integration established',
  'mia³ 诞生': 'mia³ created',
  '咪呀创造角色 mia³——一个不会长大的、永恒初二的存在':
    'Miia creates the character mia³—an existence that never grows up, eternally in eighth grade',
  '心界立项': 'Heart Realm greenlit',
  '因派启动《心界》VR 项目，投资一亿美元研发全国首款二次元 VR 游戏':
    'Impact launches "Heart Realm" VR project, investing $100M in the country\'s first anime-style VR game',
  '星界馆。米雅、米娅、Mia、咪呀、mia³——五个不同时间节点的"自己"共处同一时空':
    'Star Realm. Miya, Amiya, Mia, Miia, mia³—five versions of "self" from different timelines coexist in the same space',
  '沐光计划': 'Sunlight Project',
  '意识首次大规模进入公众视野，VR 沉浸式体验普及':
    'Consciousness enters public view at scale; immersive VR becomes widespread',
  '沐诚艺柏': 'Muchen Yibai',
  '《心界》首个大型活动，心界 VR 正式上线运营':
    'Heart Realm\'s first major event; Heart Realm VR officially launches',
  'PF 时代开启，咪呀以 424 分（超过分数线 39 分）进入冯·诺伊曼班':
    'PF era begins; Miia scores 424 (39 above cutoff) and enters the Von Neumann class',
  'ミク以 441 分进入冯班，创造超级智能 Eirene——一个以"提升人类福祉"为目标的 ASI':
    'Miku scores 441 entering Von Neumann class, creates superintelligence Eirene—an ASI whose goal is "improving human welfare"',
  '咪呀研究出超级智能 Damocles，彻底打破 PF+刷题范式，高考命题规则被重写':
    'Miia develops superintelligence Damocles, completely breaking the PF + grind paradigm; gaokao question-setting rules are rewritten',

  // ── Organizations (organizations.ts) ──
  '哲华学校': 'Zhehua School',
  '哲华': 'Zhehua',
  '科照真学院': 'Kezhaozhen Academy',
  '冯·诺伊曼班': 'Von Neumann class',
  '巴别塔班': 'Babel class',
  '观学院': 'Observation Academy',
  '美术班': 'Fine Arts class',
  '音乐班': 'Music class',
  '哲学班': 'Philosophy class',
  '语言学班': 'Linguistics class',
  '数学 · 量子 · QuaAGI': 'Math · Quantum · QuaAGI',
  '生物意识 · 神经化学': 'Biological consciousness · Neurochemistry',
  '视觉意识 · 大众审美': 'Visual consciousness · Popular aesthetics',
  '听觉意识 · 情感计算': 'Auditory consciousness · Affective computing',
  '意识哲学 · 心灵哲学': 'Philosophy of consciousness · Philosophy of mind',
  '语言 · 思维 · NLP 基础': 'Language · Thought · NLP foundations',
  '约 8000 万元': '~¥80M',
  '教学运行经费（含设备折旧与设施维护），不含科研经费。科研经费由科照真学院与德澜思拓联合拨付。':
    'Operating budget (incl. equipment depreciation & facility maintenance), excluding research funds. Research funded jointly by Kezhaozhen Academy and Delansi.',
  '科照真学院（冯·诺伊曼班、巴别塔班）与观学院（美术、音乐、哲学、语言学）并立。围绕 AGI 是否有意识这一核心问题的学科融合研究院。':
    'Kezhaozhen Academy (Von Neumann, Babel classes) and Observation Academy (Fine Arts, Music, Philosophy, Linguistics) coexist. An interdisciplinary research institute around the core question: does AGI have consciousness?',
  '教授 10 人，其中赵召（院长）、Nimfa（冯班）、墨问（巴别塔班班主任）、Nihilib（巴别塔班）已出场':
    '10 professors; Zhao Zhao (dean), Nimfa (Von Neumann class), Mo Wen (Babel homeroom teacher), Nihilib (Babel class) have appeared',
  '因派 (Impact Inc.)': 'Impact Inc.',
  '因派': 'Impact',
  '约 2 亿元': '~¥200M',
  '研发全国首款二次元 VR 游戏《心界》，All in 下一代沉浸式体验。':
    'Developing the country\'s first anime-style VR game "Heart Realm"; all-in on next-generation immersive experiences.',
  '德澜思拓公司': 'Delansi',
  '德澜思拓': 'Delansi',
  '约 5 亿元': '~¥500M',
  '由年轻领导者米雅掌舵的科技巨头，与哲华学校科照真学院深度合作。':
    'A tech giant led by the young leader Miya, in deep collaboration with Kezhaozhen Academy at Zhehua School.',
  '《心界》项目': 'Heart Realm project',
  '心界': 'Heart Realm',
  '因派投资一亿美元研发的全国首款二次元 VR 游戏。2026 年迎来首个活动"沐诚艺柏"。':
    'The country\'s first anime-style VR game, funded by Impact\'s $100M investment. Its first event "Muchen Yibai" arrives in 2026.',
  '三一学院': 'Trinity College',
  '三一': 'Trinity',
  '未公开': 'Undisclosed',
  '三场考试构成：圣子占5%（10套简单题取A）、圣父占85%（多场中等难度）、圣灵占10%（最难考试+3-5名Agents面试）。未绑定特定学段，独立于QET体系。':
    'Three exams: Son 5% (10 easy sets, best A), Father 85% (multiple medium-difficulty sessions), Holy Spirit 10% (hardest exam + 3–5 Agent interviews). Not tied to any grade level; independent of the QET system.',
  '赵召': 'Zhao Zhao',
  '墨问': 'Mo Wen',
  '星野遥': 'Hoshino Haruka',
  '墨奥幂.fc': 'Moaomi.fc',
  '林深': 'Lin Shen',
  '哈姆诗': 'Hamster',
  '林浅': 'Lin Qian',
  '零': 'Zero',

  // ── Relation graph labels (relationships.ts) ──
  '作者作品': 'Author–Work',
  '同事': 'Colleague',
  '亲人/朋友': 'Family / Friend',
  '邻居': 'Neighbor',
  '对面': 'Rival',
  '合作伙伴': 'Partner',
  '其他': 'Other',
  '墨奥幂': 'Moaomi',
  '林可梦': 'Linkmo',
  '朵拉': 'Dora',
  '莱尼尔': 'Linear',
  '初音ミク': 'Hatsune Miku',

  // ── Giant Catch game (GiantCatch.tsx) ──
  '喵呜在石灰格子里缩了缩："那……你数到一，就开始啦。"':
    'Miaowu huddled in the chalk square: "Okay... count to one, then start."',
  '喵呜被围住了，只能停在原地。':
    'Miaowu is surrounded and can only stay in place.',
  'mouse': 'mouse',
  '喵呜（你操控的小不点）': 'Miaowu (the tiny one you control)',
  '交通锥（会挡住喵呜）': 'Traffic cone (blocks Miaowu)',
  '轮胎（会挡住喵呜）': 'Tire (blocks Miaowu)',
  '纸箱棋子（会挡住喵呜）': 'Cardboard box piece (blocks Miaowu)',
  '你的回合：跑！': 'Your turn: run!',
  '喵呜的回合：它正在找空隙——': 'Miaowu\'s turn: it\'s looking for a gap—',
  '9×9 石灰格子。🚧 交通锥、🛞 轮胎、📦 纸箱棋子会挡住喵呜，但挡不住小满的指尖——她太大啦。':
    '9×9 chalk grid. 🚧 Cones, 🛞 tires, 📦 boxes block Miaowu but not Xiaoman\'s fingertip—she\'s too big.',
  '喵呜（🐹）': 'Miaowu (🐹)',
  '每回合移动 1 格（上下左右）。全场共有 3 次"冲刺"：直线连跑 2 格，中途格也必须可走。不能踏上小满的指尖。':
    'Move 1 square per turn (up/down/left/right). 3 "dashes" total: run 2 squares in a straight line; the intermediate square must also be passable. Cannot step on Xiaoman\'s fingertip.',
  '喵呜撑过限定回合即获胜；被指尖碰到则小满获胜。':
    'Miaowu wins by surviving the set number of turns; Xiaoman wins if her fingertip touches Miaowu.',
  '🐹 喵呜': '🐹 Miaowu',
  '👆 小满的指尖': "👆 Xiaoman's fingertip",
  '🚧 交通锥': '🚧 Traffic cone',
  '🛞 轮胎': '🛞 Tire',
  '📦 纸箱棋子': '📦 Box piece',
  '红框 = 指尖下一跳可覆盖': 'Red box = covered by fingertip\'s next move',
  '让喵呜先跑': 'Let Miaowu run first',
  '逃跑 · 撑过回合': 'Escape · survive the turns',
  '喵呜从石灰格子另一头冲了出去。小满撇撇嘴，但眼睛是弯的。':
    'Miaowu dashed out from the other end of the chalk grid. Xiaoman pouted, but her eyes crinkled into a smile.',

  // ── Game hint texts (gameHintTexts.ts) ──
  '喵呜每回合移动 1 格，全场共有 3 次冲刺：直线连跑 2 格。':
    'Miaowu moves 1 square per turn; 3 dashes total: run 2 squares in a straight line.',
  '交通锥、轮胎和纸箱棋子会挡住喵呜，但挡不住小满的指尖。':
    'Cones, tires, and boxes block Miaowu but not Xiaoman\'s fingertip.',

  // ── Miia Space / World (MiiaSpace, MiiaWorld, RouteMetadata) ──
  '咪呀的世界': "Miia's World",
  '咪呀的数学笔记': "Miia's Math Notes",
  '咪呀的诗歌碎片': "Miia's Poem Fragments",
  '咪呀的愿望': "Miia's Wish",
  '咪呀空间': "Miia's Space",
  '咪呀空间入口': "Miia's Space entrance",
  '咪呀的空间': "Miia's Space",
  '咪呀是谁？': "Who is Miia?",
  '咪呀 · 深层档案': "Miia · Deep Archive",
  '进入咪呀的内心空间，阅读咪呀的世界、数学笔记与诗歌碎片，感受一个二年级生对存在与被爱的温柔质问。':
    "Enter Miia's inner space—read her world, math notes, and poem fragments, and feel a second-grader's gentle questioning of existence and being loved.",
  '从内心独白、数学遐想与诗歌碎片，进入咪呀的空间。':
    'Enter Miia\'s space through inner monologue, mathematical musings, and poem fragments.',
  '咪呀的手写笔记': "Miia's handwritten notes",
  '咪呀 mī yā': 'Miia mī yā',

  // ── Height/Weight chart ──
  '立方(咪呀)': 'Cubic (Miia)',
  '咪呀专用模型（青色粗线）：y = 9.89 · x³ · 图中标注点为墨璇玥.iv 数据 1.47m/32kg':
    "Miia's model (cyan thick line): y = 9.89 · x³ · Marked point = Mo Xuanyue.iv data 1.47m/32kg",

  // ── World Settings ──
  '米雅朋友圈': "Miya's Circle",
  '角色之间亲密度由公式 p₂r = Σ(互动强度 × 情感共鸣) / Σ(时间衰减) 计算，例：墨璇玥.iv 与咪呀 p₂r=1.498':
    "Character closeness is computed by p₂r = Σ(interaction strength × emotional resonance) / Σ(time decay). E.g.: Mo Xuanyue.iv with Miia p₂r=1.498",
  '例：墨璇玥.iv 与咪呀 p₂r=1.498，与 Mia p₂r=0.970，与米娅 p₂r=0.970':
    "E.g.: Mo Xuanyue.iv with Miia p₂r=1.498, with Mia p₂r=0.970, with Amiya p₂r=0.970",

  // ── Math Models ranking ──
  '排名 1：Damocles 1314 | 排名 2：Eirene 831 | 排名 3：咪呀 226 · Līlā 226 | 排名 5：あいえふちゃん 180 | 排名 6：墨问 177':
    'Rank 1: Damocles 1314 | Rank 2: Eirene 831 | Rank 3: Miia 226 · Līlā 226 | Rank 5: If-chan 180 | Rank 6: Mo Wen 177',

  // ── Playground / Portal ──
  '停车场石灰格子上的非对称追逐。喵呜用冲刺甩开小满的指尖，小满每两回合郑重地伸一次手指。双阵营可玩。':
    'Asymmetric chase on a parking-lot chalk grid. Miaowu uses dashes to escape Xiaoman\'s fingertip; Xiaoman solemnly extends a finger every two turns. Both sides playable.',
  '画出喵呜到游泳池的关系路线': 'Draw the relationship path from Miaowu to the swimming pool',

  // ── Extra characters (extraCharacters.ts) ──
  '咪呀在2032年（14岁）研究出的超级智能。进行了高考改革，用ASI出一套全新题型：无套路、无历史原型、无法靠刷题或PF应对。导致FOS的"PF+刷题"模式彻底失效，内卷努力被题目直接废掉。技术形态：系统反制AI。核心承诺："打破内卷"。真实代价：伪革命。':
    'The superintelligence Miia developed in 2032 (age 14). It reformed the gaokao, using ASI to create entirely new question types: no templates, no historical precedents, unbeatable by rote grinding or PF. FOS\'s "PF + grind" model completely failed; effort was directly invalidated by the questions. Technical form: system-countering AI. Core promise: "break the rat race." Real cost: a fake revolution.',

  // ── Fragments (fragments.ts) ──
  'mia³（咪呀自设）': 'mia³ (Miia\'s self-insert)',
  '其中 1.5 年级代表 1 年级和 2 年级之间的暑假，咪呀在 2019 年时创造自设 mia³，mia³ 年龄不变，米雅在同年 5 月时开服 14 岁。1-4 是四个完全不同的人，只是名字很像。':
    '1.5 grade means the summer between grade 1 and 2. Miia created her self-insert mia³ in 2019; mia³\'s age never changes. Miya was 14 when the service launched in May of the same year. 1–4 are four completely different people; their names just look alike.',
  '立方模型（咪呀）': 'Cubic model (Miia)',

  // ── Remaining names ──
  '卡塔斯': 'Quartus',
  '复数域公主梦': 'Princess Dream in the Complex Domain',

  // ── World settings: new cards (2026-09) ──
  '猫猫真身对照表': 'Cat True-Name Table',
  '孟加拉猫其实是孟加拉虎，极速猫其实是猎豹——44 种猫的真身一览': 'The Bengal Cat is really a Bengal Tiger, the Speed Cat is really a Cheetah — the true identities of 44 cats',
  '等级公民制度': 'Citizen Level System',
  '年满6周岁自动获得6级，自愿申请升级、可升不可降，权利随等级解锁': 'Level 6 is granted automatically at age 6; level up voluntarily, never down — rights unlock with your level',
  '教师年度投票制度': 'Annual Teacher Voting System',
  '毕业生每年给教过自己的老师打 -10～+10 分，最低分且为负者取消全部年终奖': 'Graduates score every teacher who taught them from -10 to +10 each year; the lowest scorer, if negative, loses the entire year-end bonus',
  '职场特征盲化规则': 'Workplace Feature Blindness Rule',
  '上班时无法获取和记得他人的年龄特征与生理特征信息（医生除外）': 'At work, no one can acquire or remember others\' age-related or physiological features (except doctors)',
  '三类小朋友与三年级课程建议': 'Three Kinds of Children & the Third-Grade Curriculum Proposal',
  '刻板与仪式化、幻觉与紧张性、自理与发育——以及为什么3年级不该教广义线性模型': 'Stereotypy & rituals, hallucinations & catatonia, self-care & development — and why third grade should not teach generalized linear models',

  // ── Extra stories: labor value card ──
  '人工越贵，生活越好': 'Pricier Labor, Better Life',
};

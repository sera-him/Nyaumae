# 死代码登记表

本仓库的原则：**不删代码**。死代码不是垃圾，而是「意图已经写下、但接线没接通」的证据，
删掉就丢了这条意图。所以这里的处理方式是三选一，并且必须落到其中之一：

| 处置 | 含义 | 验收标准 |
|---|---|---|
| **接通** | 让代码真正可达并生效 | 有运行时行为，能被观察到 |
| **纳入规则表** | 让代码成为规则的唯一声明处，消灭并行副本 | 规则表有 ≥2 个消费方 |
| **标注** | 明确写下「为什么它无效、修复时应改哪里」 | 代码里有指向真实实现的注释 |

登记表记录当前仍处于「标注」状态的项。每修好一项，请把它从这里移走，
不要留在表里装作已经处理过。

---

## 已处理（不再列在此表中）

| 位置 | 问题 | 处置 |
|---|---|---|
| `src/pages/CatMouseGame.tsx` `Frame.catAim` | 每回合都写入、从不读取，「完整复盘」是假的 | 接通：复盘显示推断点、推断误差、诱饵偏移，并把抽稀后的信念云一起存进 Frame |
| `src/sections/CatMachine.tsx` `cat-machine:best-score` | reset 时删除，但没有任何地方写入，键永远不存在 | 接通：`BEST_SCORE_KEY` 提升为导出常量，写入 + 显示 |
| `src/game/engine.ts` `lowestHpWeaponLevel` | 初始化为 `Infinity` 后从不写入 → 第三星永不可达 → 符文系统从不发放 | 接通：开火时记录本局用过的最低武器等级 |
| `src/game/ttt3/engine.ts` `fear` | 只有 `= false`，`canUseSkill` 的恐惧分支与 UI 标记全不可达 | 接通：`暴君之握` 施加；清除点从 `startOfTurn` 移到 `endTurn`（原本会被立刻抹掉） |
| `src/game/chess/engine.ts` 破译 | `getPiece({row:-1,col:-1})` 先于解密分支执行 → `return state`，整个 1→2→3 状态机不可达；同时构成计时器漏洞 | 接通：解密分支移到取子之前 |
| `src/game/chess/moves.ts` `getMoves` / `getCaptures` | 与 `getRawMoves` 平行的第二份 switch，绕过 `filterMovesByPoison` | 改为按 `getRawMoves` 过滤（保留导出） |
| `src/game/chess/types.ts` `CRITICAL_PIECES` / `UNBLOCKABLE` / `IMMOBILE_PIECES` | 三张规则表只有定义、无人引用，实际规则散落成硬编码字面量 | 纳入规则表：`findCriticalPieces`、`getAttackRange`、`getRawMoves` 改为查表 |
| `src/game/chess/engine.ts` 被吃子毒层泄漏 | 只删移动方 key，被吃方毒层留在表里 | 接通：capture 时删除 `capturedKey` |
| `src/game/chess/engine.ts` 巨鲸清场未纳入安全判定 | `whaleCleanse` 走完才结算，合法性模拟不含它 → 国王可停在必被吃掉的格子 | 接通：`isKingSafeAfterMove` 一并模拟 |
| `src/game/hellMaze/types.ts` `DIR_NAMES` | 箭头相对 `DIRECTIONS` 整体错位一格，且 UI 另有一份副本 | 接通：修正 + UI 改为 import |
| `src/game/hellMaze/types.ts` `hexDistance` | 从未引用；S/A/B/C 评级只比半径，跨难度不可比 | 接通：`shortestPathLength` 计算真实最短路，评级改为 `steps/par` |
| `src/game/neuralClash/engine.ts` `internalEnhanced` | 参与决胜判定却从不在结算面板显示 | 接通：结算面板显示 |
| `src/data/fullSearchIndex.ts` `fractal-rules` | 内容整条是神经回响的机制（三根子枝/6px 剪枝/16 生长点），却挂在递归回响的标题与路由下 | 接通：改写为递归回响的真实规则（3×3 同坐标广播、Thue–Morse 分方、根盘 5 票），中英各一条 |
| `src/data/fullSearchIndex.ts` `game-cat-mouse` | 关键词停在旧版机制（未提同速、半径 4、人机对战） | 接通：按新的真实规则重写，中英各一条 |
| `src/data/gameHintTexts.{ts,en.ts}` | 提示写「追逐从 A8 与 B2 开始」，而 `GIANT_START` 是 `{x:8,y:1}` → `coordLabel` 渲染为 `I2` | 接通：改为 A8 与 I2（游戏内规则面板本来就对，只有站内提示错） |
| `src/sections/GiantCatch.tsx` | `resolveMouseMove` 里检查「踏上指尖格」、`cellIcon` 里第二次检查巨型格，两处都不可达 | 标注：写明不可达原因与真正的捕获判定在 `resolveGiantMove`，防止有人重复加检查 |
| `public/super24.html` | 886 行无人引用的完整副本，与 `src/sections/Super24.tsx` 双轨 | 标注：文件头加双语声明，禁止分叉 |

### 核实后判定为「文案正确、无需修改」

| 位置 | 疑点 | 结论 |
|---|---|---|
| `src/sections/NeuralEcho.tsx:299` + `fullSearchIndex` `neural-rules` | 文案说「回声在第9、17、25轮补充」，而代码是 `[16, 32, 48].includes(turnIndex + 1)`，看似差一轮 | **文案是对的**。`turnIndex+1 = 16` 时回合变为 16，`round = floor(16/2)+1 = 9`；32→17、48→25 ���理同。搜索索引与游戏内文案一致 |
| `NeuralEcho` 规则「第17轮起最多保留一根」 | 与 `phaseFor` 的 `round <= 24 → maxTips: 1` 是否矛盾 | 一致。收束阶段从第 17 轮开始 |
| `NeuralEcho` 规则「新枝端点距对手枝条不足 6px 时剪去」 | 与 `round >= 5` 才启用剪枝是否矛盾 | 文案未提起始轮次，属省略而非错误。若要精确可补「第5轮起开放剪枝」 |

### 曾经误判、已纠正

一次委派把「神经回响回声回合差一轮」当成 bug 报告。手工核对 `round` 与 `turnIndex`
的换算后确认是误判（见上表）。教训：跨文件的回合数换算必须自己算一遍，
不能只读字面量对比。

### 仍然说谎的文案（与死代码同源：文案和实现各走各的）

| 位置 | 宣称 | 实际 |
|---|---|---|
| `src/pages/Playground.tsx` `compound-chess` | 「传统象棋…立体空间、相位变换」 | 12×12 棋盘、`Board` 是纯二维、全仓库 0 处相位实现；中式规则只有炮架一条 |
| `src/pages/Playground.tsx` `skill-tic-tac-toe` | 「每个棋子都有独特技能…突进、击退」 | `CellValue = 0｜1｜2`，代码里没有棋子实体；「突进」「击退」全仓库 0 命中 |
| `src/pages/Playground.tsx` `super-24` 标题 | 「超级24点」 | 数字 3–42 个，目标值是用这些数字生成的隐藏表达式的值，从不是 24 |
| `src/pages/Playground.tsx` `quiz` | 「语段和题项两部分…选择最合适的答案」 | 24 题里 0 个语段、1 个有选项，其余 50 格自由填空；提交后零判分 |
| `src/pages/Playground.tsx` `stellar` | 「十武器即时切换」 | 只有 5 把武器，10 个槽位不允许重复 |

`tests/dead-code.test.mjs` 已经把修好的那几张（猫鼠、递归回响）钉住防止回归；
上面这五张还没改，因此测试只对已修项断言。

---

## 仍在表内（已标注，未修复）

### 1. `src/stores/ttt3Store.ts` `skipTurn`
zustand action 已实现，但 UI 没有入口。棋盘填满且无三连时游戏会死锁
（`getLegalMoves` 返回空、AI 返回 `move: -1` 被 effect 丢弃），
而 `skipTurn` 本来正是那个逃生口。
**修法**：在无可走格时给玩家一个「弃权」按钮，或在 `endTurn` 里检测死锁并自动弃权。

### 2. `src/pages/CityBuilderGame.tsx` 未使用 `runAutomatedCityStep`
引擎导出了可托管任意城市（含人类那座）的自动步进函数，冒烟测试用它来
自动对局，但正式 UI 没有「自动代打」按钮，于是这个导出对生产代码而言是死的。
**修法**：加一个「托管本城」开关，复用引擎已有的 `styleOverride`。

### 3. `src/game/data.ts` `generateWeaponForEnemy`
能按敌人弱点生成对应武器，但没有任何调用点；`weaponInventory` 恒为 5 把初始武器。
后果：第 6 关起生成的 `enemy_N` 没有克制武器，弱点与连招主循环被削弱。
**修法**：在关卡结算里按 `getStageRoster` 补发武器，或删掉这个「生成」概念并在文案里写明只有 5 把。

### 4. `src/game/store` 成长系统（`unlockWeapon` / `upgradeWeapon` / `evolveWeapon` / `equipRune` / `upgradeShip`）
共 5 个 action 已实现、UI 无入口。第三星修好之后 `addRune` 终于能触发，
但「装备符文 / 升级飞船」依然无处可点。
**修法**：在结算面板加符文装备槽与武器升级页。

### 5. `src/types/howler.d.ts`
`grep` 全仓库 0 命中。

### 6. `src/game/chess/engine.ts` `hasNoLegalMoves` 只遍历走法
将死/逼和判定只看棋子走法，忽略女巫技能、Q↔O 变身、天线推动、部署星舰、
破译等非走法行动。只剩女巫的玩家可能被判将死，而实际上还有技能可用。
**注意**：这是规则正确性问题，不只是死代码。修它需要先定义「非走法行动是否计入
可行动集合」，属于规则设计决策。

### 7. `src/game/chess/moves.ts` 老鼠中毒表与文档不符
`poisonCount < 6` 的守卫同时禁掉了马步与直线滑行，而规则文档说 6 级只是「无法走马步」；
中毒 ≥1 时只保留 `KNIGHT_MOVES[0]` 却沿该方向无限滑动，文档说「马步只能走一个日字」。
另：G（猫娘）静默免疫中毒，但 `POISON_IMMUNE` 未声明、相关函数也无分支——
决定胜负的关键棋子无法被毒掉。
**修法**：以文档为准修 `moves.ts`，并把 `'G'` 补进 `POISON_IMMUNE`。

---

## 怎么防止再次腐化

新增死代码时，请在同一处写下「它为什么无效、修复时改哪里」，
并在本文件加一行。不要留下无注释的孤儿导出——那正是本次全部问题的成因。
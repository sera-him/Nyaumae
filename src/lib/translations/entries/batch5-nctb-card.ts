// Render-time zh-CN -> en for NCTB report card / trials / NctbPage.
export const BATCH5_NCTB_CARD: Record<string, string> = {
  // ReportCard.tsx
  "· 补充指数": "· ancillary index",
  "（备选）": "(alternate)",
  "✓计入": "✓ counted",
  "把你的综合标准分当作 FSIQ 代入 Neural Connection 角色世界观的排名公式。这条曲线在 100 处最低，离均值越远（无论偏高还是偏低）数值越高——在世界观里，它衡量的不是聪明程度，而是「内在独特性」。85 起步、235 满格、超出即 EX 溢出。":
    "Plug your composite standard score in as FSIQ into the Neural Connection character-worldview ranking formula. This curve bottoms out at 100: the farther from the mean (whether above or below), the higher the value — within the worldview it measures not intelligence but inner uniqueness. It starts at 85, tops out at 235, and anything beyond overflows as EX.",
  "标准分仿照韦氏量表的显示格式（均值 100、标准差 15，范围 55–145），但只由本机的考试与互动分测验数据换算，没有年龄常模，不是临床 IQ 分数。同一指数内完成任意一项互动分测验即可计入，取最佳成绩。":
    "Standard scores follow the Wechsler display format (mean 100, SD 15, range 55–145), but are derived solely from this device's exam and interactive subtest data, with no age norms; they are not clinical IQ scores. Within an index, completing any single interactive subtest counts, and the best result is taken.",
  "查看 FSIII 角色排名": "View FSIII character ranking",
  "待观察领域": "area to watch",
  "分测验": "subtest",
  "分测验明细": "subtest details",
  "个世界观角色中约排第": "worldview characters, roughly",
  "还没有任何证据：先完成一次正式考试或任意互动分测验。":
    "No evidence yet: first complete one formal exam or any interactive subtest.",
  "级": "tier",
  "计入": "counted",
  "已并入最近一次正式考试": "folded into the most recent formal exam",
  "身旁是": "next to",
  "尚未完成正式考试，成绩单仅基于互动分测验":
    "No formal exam completed yet; the scorecard is based on interactive subtests only",
  "试炼": "trial",
  "完成任意分测验后生成": "generated after any subtest is completed",
  "完成正式考试或任意一项该指数的互动分测验后计入。":
    "Counted once you complete the formal exam or any interactive subtest in this index.",
  "相对优势": "relative strength",
  "原始分": "raw score",
  "在": "of",
  "正式考试": "formal exam",
  "指数": "index",
  "综合标准分": "composite standard score",
  "FSIII · 全量内在智力指数": "FSIII · Full-scale Inner Intelligence Index",
  "FSIII 世界观联动": "FSIII worldview link",
  "量表分": "scale score",
  "量表分仿韦氏格式（均值 10、标准差 3，范围 1–19）；标 ✓ 的是计入指数的证据，其余为备选。":
    "Scale scores follow the Wechsler format (mean 10, SD 3, range 1–19); items marked ✓ are the evidence counted toward the index, the rest are alternates.",
  "前一名是": "one rank above:",
  "世界观联动彩蛋：FSIII 是故事设定中的排名公式，与心理测量无关，也不影响上方任何考试分数。":
    "Worldview easter egg: FSIII is the ranking formula from the story setting, unrelated to psychometrics, and does not affect any of the exam scores above.",
  "能力成绩单": "ability scorecard",
  "能力成绩单把正式考试（十维题库）与互动分测验（反应、记忆、译码等网页任务）汇总成五大指数与综合标准分，结构与显示格式参考 WAIS-IV / WISC-V，但不是经过心理测量标定的测验，不能用于医疗、心理、智力或教育诊断。":
    "The ability scorecard combines the formal exam (the ten-dimension item bank) with interactive subtests (web tasks for reaction, memory, coding, and so on) into five indices and a composite standard score; its structure and display format reference WAIS-IV / WISC-V, but it is not a psychometrically calibrated test and must not be used for medical, psychological, intellectual, or educational diagnosis.",

  // nctb/interactive/InteractiveTrials.tsx
  "1 项分测验": "1 subtest",
  "查看 FSIQ 风格成绩单": "View the FSIQ-style report card",
  "返回分测验": "Back to subtests",
  "仿照韦氏智力量表的分测验结构：每个指数提供若干互动分测验，任选其一完成即可计入该指数，全部成绩只保存在本机，并汇入 FSIQ 风格成绩单。":
    "Modeled on the Wechsler intelligence scale's subtest structure: each index offers several interactive subtests; completing any one of them counts toward that index. All scores stay on this device only and feed into the FSIQ-style report card.",
  "分测验成绩只保存在本机，可反复挑战刷新最佳分；同一指数内任选其一完成即可计入成绩单。":
    "Subtest scores are saved locally only; you can retry as often as you like to refresh your best score. Within the same index, completing any one item counts toward the scorecard.",
  "汇总考试维度与互动分测验，生成指数标准分与综合标准分":
    "Aggregate exam dimensions and interactive subtests into index standard scores and a composite standard score",
  "开始": "Start",
  "开始分测验": "Start subtest",
  "未挑战": "not attempted",
  "尚未挑战": "not yet attempted",
  "试炼分": "trial score",
  "已计入": "counted",
  "由考试维度覆盖": "covered by exam dimensions",
  "互动分测验": "interactive subtest",

  // pages/NctbPage.tsx (near-duplicate English, verbatim minus trailing spaces)
  "· 目标参考": "· target ref",
  "· 启动友好模式": " · friendly mode on",
  "· 友好": " · friendly",
  "本题有效用时": "Effective time on this item",
  "点击后序列只显示约": "The sequence stays visible for about",
  "题 ·": "items ·",
  "正确 ·": "correct ·",
  "正确率 95% CI": "accuracy 95% CI",
  "中位用时": "median time",
  "总进度": "Overall progress",
  "五大指数标准分": "Five-index standard score",
};

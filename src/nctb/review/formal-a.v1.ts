import type { NctbEditorialReview } from '../types.ts';

function review(
  questionId: string,
  constructMeasured: string,
  difficultyReason: string,
  distractorLogic: [string, string, string],
): NctbEditorialReview {
  return {
    questionId,
    constructMeasured,
    difficultyReason,
    distractorLogic,
    authorStatus: 'sol-authored',
    approvalStatus: 'expert-review-required',
  };
}

/**
 * Editorial evidence is deliberately not imported by the browser runtime.
 * "expert-review-required" means these are frozen pilot items, not calibrated
 * or professionally approved psychological-test items.
 */
export const FORMAL_A_V1_EDITORIAL_REVIEWS: readonly NctbEditorialReview[] = [
  review('formal-a-v1-pattern-01', '识别长度为 3 的周期，而非计算数值。', '单规则、低工作记忆负荷。', ['延续最近符号', '改用新形状', '把组尾当周期起点']),
  review('formal-a-v1-pattern-02', '组合倒序与空实互换两种变换。', '需要维持并按序执行两条规则。', ['只倒序', '只互换部分形状', '未倒序但互换']),
  review('formal-a-v1-pattern-03', '递归应用逐格异或关系。', '必须推导中间行后再次应用抽象规则。', ['只给中间行', '把不同误作相同', '把规则误作全局多数']),
  review('formal-a-v1-memory-01', '项目与标签的短时绑定。', '四个低相似绑定，单次提取。', ['邻近绑定替换', '首项偏好', '末项偏好']),
  review('formal-a-v1-memory-02', '在保持序列时连续删除、移动和追加。', '三次更新且操作类型切换。', ['漏做删除', '漏做移动', '把追加误作前插']),
  review('formal-a-v1-memory-03', '在高度相似干扰表中保持目标绑定。', '目标与干扰共享全部项目和数值，仅配对不同。', ['报告干扰绑定', '跨表混合绑定', '只保留一个目标绑定']),
  review('formal-a-v1-space-01', '以坐标表示执行物体心理旋转。', '一次明确旋转、三个相连位置。', ['逆时针旋转', '关于横轴镜像', '只旋转部分坐标']),
  review('formal-a-v1-space-02', '多次转向后的路径整合。', '四步位移含两次朝向变化与抵消。', ['遗漏最后位移', '把相对转向当绝对方向', '只计算水平位移']),
  review('formal-a-v1-space-03', '连续两次正交折叠后的对称展开。', '必须同时恢复水平与垂直两组镜像。', ['只展开一次', '只恢复纵向镜像', '把孔保留在单层']),
  review('formal-a-v1-quantity-01', '比较单位时间产出率。', '一次表示转换，无无关信息。', ['比较总产量', '比较总时间', '拒绝可计算信息']),
  review('formal-a-v1-quantity-02', '串联相对量变换并识别基数变化。', '两步百分比使用不同参照量。', ['直接相加百分比', '把少与多方向颠倒', '误判信息不足']),
  review('formal-a-v1-quantity-03', '跨两种交换关系进行数量变换。', '两段比例链且需要保持单位。', ['只完成第一段', '把比率倒置', '将两个系数相加']),
  review('formal-a-v1-language-01', '理解条件句并进行逆否推理。', '单条件、受控词汇。', ['加入未给出的公开属性', '混淆物品与钥匙状态', '加入内容假设']),
  review('formal-a-v1-language-02', '解析“并非所有”的量词范围。', '否定作用于全称量词而非谓词本身。', ['把并非所有误作无人', '否定前件集合', '臆造集合大小']),
  review('formal-a-v1-language-03', '结合“除非”与“只有…才…”的指令语义。', '两种条件表达叠加，且需区分许可与必然事实。', ['把解除禁止当作许可', '把可能动作当已发生', '外推未来状态']),
  review('formal-a-v1-attention-01', '在竞争项目中按特征合取选择目标并抑制标记项。', '单一目标规则加一条优先抑制规则。', ['只匹配数字', '只匹配形状', '忽略抑制标记']),
  review('formal-a-v1-attention-02', '在逐行切换选择规则时维持偶数目标。', '五次规则读取、四次切换且干扰数字相似。', ['固定使用较小规则', '固定使用较大规则', '漏计一次切换结果']),
  review('formal-a-v1-attention-03', '在相反侧翼干扰下读取中央方向并执行整行抑制。', '中央目标与侧翼冲突，同时存在 no-go 标记。', ['跟随侧翼方向', '选择相反中央方向', '忽略 no-go 标记']),
  review('formal-a-v1-speed-01', '低推理的快速二分类。', '短刺激、规则单一，用时而非推理区分。', ['漏扫一个目标', '把奇数误归类', '重复计入目标']),
  review('formal-a-v1-speed-02', '在高相似字符串中快速定位完全匹配。', '四个选项各仅一字符差异。', ['混淆 M/N', '混淆 2/Z', '混淆 Q/O']),
  review('formal-a-v1-speed-03', '快速扫描首尾特征是否一致。', '六组相似刺激增加扫描量，但不增加推理步骤。', ['漏核一组', '把中间字符纳入规则', '将近似字符误作相同']),
  review('formal-a-v1-causality-01', '在简单因果链中推断阻断干预结果。', '单路径、一次干预。', ['忽略阻断', '颠倒因果方向', '质疑已明确的干预']),
  review('formal-a-v1-causality-02', '识别年龄混杂并选择随机干预证据。', '需比较四种证据设计的因果识别强度。', ['选择结果偏差样本', '混用时间变化', '只增加样本不处理混杂']),
  review('formal-a-v1-causality-03', '区分共同必要条件与两个各自充分但非必要的条件。', '同时维护必要、充分和观察结果，但不假设因果集合穷尽。', ['把充分条件 L 误作必要', '把充分条件 C 误作必要', '把两个充分条件都误作必要']),
  review('formal-a-v1-planning-01', '在前后与相邻约束下选择可行顺序。', '三个竞争约束、短搜索空间。', ['违反首位限制', '违反相邻限制', '违反先后限制']),
  review('formal-a-v1-planning-02', '共享资源与依赖任务的并行调度。', '必须发现机器串行与 C 可并行的组合。', ['采用较慢机器顺序', '违反独占资源', '违反 C 的前置条件']),
  review('formal-a-v1-planning-03', '资源故障后的依赖保持与并行重规划。', '替代资源变慢、独立子任务可并行、截止约束仍在。', ['破坏质量依赖', '不利用可并行任务', '删除必要目标']),
  review('formal-a-v1-transfer-01', '把循环依赖结构映射到不同表面任务。', '共同关系直接但名词完全不同。', ['关注数量表面', '只看名称差异', '把诊断误作删除方案']),
  review('formal-a-v1-transfer-02', '把串联瓶颈的节流策略远迁移到数据队列。', '跨物理与信息领域映射下游容量关系。', ['强化上游导致积压', '只迁移表面标签', '用破坏性随机策略']),
  review('formal-a-v1-transfer-03', '迁移策略同时识别适用边界与规则切换。', '共同规律只在阈值前成立，需要保留局部策略并重构后段。', ['无视边界机械迁移', '因边界放弃全部有效信息', '复制旧答案而非策略']),
  review('formal-a-v1-foundation-pattern-01', '识别交替行构成的周期覆盖。', '单一周期规则、低工作记忆负荷。', ['重复相邻行', '改变周期长度', '把行内顺序倒置']),
  review('formal-a-v1-foundation-pattern-02', '按序执行同时替换规则。', '需要连续保持中间状态并进行三步递归。', ['只替换第一项', '异步替换同一步字符', '少执行一步']),
  review('formal-a-v1-foundation-memory-01', '短时保持项目序列。', '四项低复杂度序列的即时提取。', ['交换中间两项', '首尾倒置', '把最后一项提前']),
  review('formal-a-v1-foundation-memory-02', '在连续操作中更新工作记忆内容。', '先数值更新再交换位置，操作类型发生切换。', ['遗漏首项更新', '交换前后项错误', '把更新结果当作初始输入']),
  review('formal-a-v1-foundation-space-01', '整合水平与垂直位移。', '三步坐标移动包含一组相互抵消的方向。', ['只累计垂直位移', '把起点坐标加错轴', '忽略最后一步']),
  review('formal-a-v1-foundation-space-02', '恢复折叠后的镜像对应关系。', '一次折叠、四格位置映射，需保持折线两侧对称。', ['把折线两格视为同一格', '只保留一侧孔位', '把镜像方向反转']),
  review('formal-a-v1-foundation-quantity-01', '把比例分配转换为单位份数。', '单步比例计算、数值规模较小。', ['用总份数乘错比例', '把较多一侧当作较少一侧', '直接相减比例']),
  review('formal-a-v1-foundation-quantity-02', '串联不同基数下的相对量关系。', '需要避免直接相加百分比并恢复参照量。', ['直接相加两个百分比', '颠倒增加与减少方向', '忽略中间变量']),
  review('formal-a-v1-foundation-language-01', '按优先级解释相互覆盖的分类规则。', '两条规则同时适用且存在明确后置优先级。', ['只执行第一条规则', '把卡片放入两个盒', '把优先级当作排除条件']),
  review('formal-a-v1-foundation-language-02', '识别自然语言指代的不确定性。', '句法线索不足，需要拒绝无依据的唯一化推断。', ['默认指向主语', '默认指向最近名词', '把老师排除在指代外']),
  review('formal-a-v1-foundation-attention-01', '按合取目标规则并执行抑制标记。', '形状、数值和 no-go 标记同时竞争注意资源。', ['只匹配形状', '只匹配偶数', '忽略抑制标记']),
  review('formal-a-v1-foundation-attention-02', '在序列中保持反应抑制规则。', '五次试次需要记住相邻条件并逐次切换反应。', ['对所有 A 都反应', '把 X 当作反应项', '漏掉末次 A']),
  review('formal-a-v1-foundation-speed-01', '快速执行逐字符同异分类。', '短刺激、无推理转换，主要考察扫描速度与准确性。', ['漏查一组', '把相似字符算作相同', '重复计数同一组']),
  review('formal-a-v1-foundation-speed-02', '快速核对符号到数字的逐位编码。', '多组短字符串仅有局部差异，强调视觉比对。', ['只核对首位', '把符号顺序倒置', '将近似数字视为相同']),
  review('formal-a-v1-foundation-causality-01', '控制混杂变量以提升因果比较。', '识别肥料与浇水同时变化这一单一混杂因素。', ['增加同一组测量次数', '直接接受观察差异', '同时改变更多变量']),
  review('formal-a-v1-foundation-causality-02', '从必要条件推出结果发生时的条件状态。', '需要正确解析“只有在 A 且 B 时才 C”的必要性。', ['只推出一个条件', '把必要条件当充分条件', '否定两个条件']),
  review('formal-a-v1-foundation-planning-01', '在前置依赖与互斥资源下安排顺序。', '两个前置任务必须串行并共同先于目标任务。', ['先执行目标任务', '错误地并行共享机器', '只完成一个前置任务']),
  review('formal-a-v1-foundation-planning-02', '同时满足资源总量和任务先后约束。', '需先核对总电量，再检查上传依赖扫描。', ['超出总资源', '违反扫描前置', '遗漏贴标任务']),
  review('formal-a-v1-foundation-transfer-01', '把周期结构策略迁移到不同表面材料。', '保留深层周期关系，同时重新验证新材料的周期。', ['复制旧题答案', '只比较表面颜色', '完全放弃旧策略']),
  review('formal-a-v1-foundation-transfer-02', '在跨领域任务中保持多种关系结构。', '需要同时映射先后、资源冲突和替代三类关系。', ['只保持先后关系', '要求名称和位置相同', '复制旧任务的具体时间']),
];

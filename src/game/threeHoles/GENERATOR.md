# 狡兔三窟：唯一题生成与认证

网页不再即时运行启发式求解器。题目由
`scripts/three_holes_unique_generator.py` 离线生成，认证结果写入
`puzzles.generated.json`；浏览器只负责加载、校验、旋转或镜像题面。

## 精确模型

每格对应一个 CP-SAT 布尔变量。模型包含：

1. 每行恰好 `k` 个兔洞；
2. 每列恰好 `k` 个兔洞；
3. 每区恰好 `k` 个兔洞；
4. 任意八邻域中的两个格不能同时是兔洞；
5. 若题面有已知兔洞，则对应变量固定为 1。

找到目标解 `S` 后，生成器加入：

```text
sum(x[v] for v where S[v] = 1) <= n*k - 1
```

任意合法解共有 `n*k` 个兔洞，因此这条约束只排除 `S`。只有新模型被
CP-SAT 严格证明为 `INFEASIBLE`，题目才会写入题库；`UNKNOWN` 和超时均不通过。

## 区域生成

生成器先求一个满足行、列和不相邻约束的隐藏解，再沿 Hilbert 路径（2 的幂
盘面）或蛇形 Hamilton 路径（其他盘面）按每 `k` 个目标兔洞切成连通区域。
随后只进行保持目标解的边界交换或空格移动，并在每一步检查区域连通性。

局部区域编辑并不保证在有限步内得到唯一题。达到迭代上限时，生成器会加入
“已知兔洞”来排除当前第二解；每个不同解必然遗漏至少一个目标兔洞，所以该
过程最坏在固定全部目标兔洞后终止。最后会尝试逐一删除冗余提示，并再次从头
建立屏蔽模型做唯一性证明。

## 复核

安装固定版本的 OR-Tools 后可重新验证整个题库：

```powershell
python -m pip install -r scripts/requirements-three-holes.txt
python scripts/three_holes_unique_generator.py `
  --verify src/game/threeHoles/puzzles.generated.json `
  --unique-time 360
```

前端加载时还会检查尺寸、区域连通性、目标解的行/列/区计数、不相邻规则，
以及所有已知兔洞是否属于目标解。旋转、镜像和区域编号置换都是双射，因此
保持合法性与唯一性。

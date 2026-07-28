// ============================================================
// 概率三子棋 — 概率生成算法（从 C++ TTT3.cpp 严格移植）
// 目标：每一个步骤、每一个常量、每一个随机数生成方式都与 C++ 一致
// ============================================================

import { BASE_R } from './types';

const DEFAULT_N = 2000000;   // C++: const int N = 2000000;
const DEFAULT_D = 1.0 / 120000.0; // C++: const double d = 1.0 / 120000.0;
const PI = Math.PI;

// ============================================================
// MSVC 风格 rand() / srand()（与 C++ 标准库行为一致）
// C++ main(): srand(static_cast<unsigned>(time(nullptr)));
// ============================================================

let holdrand = 1;

/** 设置 rand() 种子（对应 C++ srand） */
export function srand(seed: number): void {
  holdrand = seed >>> 0;
}

/** MSVC 风格 rand()：返回 0 ~ 32767 */
export function rand(): number {
  holdrand = (holdrand * 214013 + 2531011) >>> 0;
  return (holdrand >> 16) & 0x7fff;
}

/** C++ 中常用的 (rand() / 32768.0 + rand()) / 32768.0，范围 [0, ~1) */
export function randDouble(): number {
  return (rand() / 32768.0 + rand()) / 32768.0;
}

/** C++ rand() % m */
export function randMod(m: number): number {
  return rand() % m;
}

// ============================================================
// 概率分布缓存
// ============================================================

let cachedProbP: Float64Array | null = null;
let cachedProbNN: Float64Array | null = null;
let cacheN = 0;
let cacheD = 0;

/** 初始化概率分布（惰性计算 + 缓存） */
function initProbDist(n: number, d: number): { probP: Float64Array; probNN: Float64Array } {
  if (cachedProbP && cachedProbNN && cacheN === n && cacheD === d) {
    return { probP: cachedProbP, probNN: cachedProbNN };
  }
  const probP = new Float64Array(n + 1);
  const probNN = new Float64Array(n + 1);
  const exp11_16 = 11.0 / 16.0;
  const dd2 = d * d / 2.0;
  const sqrt2pi = Math.sqrt(2.0 * PI);

  for (let i = 1; i <= n; i++) {
    probP[i] = Math.pow(i, exp11_16);
    probNN[i] = Math.exp(-i * i * dd2) / sqrt2pi;
  }

  cachedProbP = probP;
  cachedProbNN = probNN;
  cacheN = n;
  cacheD = d;
  return { probP, probNN };
}

// ============================================================
// sampleFromDist —— 与 C++ 完全一致
// ============================================================

function sampleFromDist(n: number, _dd: number, pP: Float64Array): number {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += pP[i];
  }
  // C++: sum *= (rand() / 32768.0 + rand()) / 32768.0;
  sum *= randDouble();
  let idx = 0;
  while (sum > 0 && idx < n) {
    idx++;
    if (idx <= n) {
      sum -= pP[idx];
    }
  }
  return idx;
}

// ============================================================
// generateProbabilities —— 与 C++ 完全一致
// ============================================================

export function generateProbabilities(n: number = DEFAULT_N, d: number = DEFAULT_D): number[] {
  const { probP, probNN } = initProbDist(n, d);

  // 复制 temp_p
  const tempP = new Float64Array(probP);
  const res = new Int32Array(10); // C++: int res[10]; (索引 1~9 或 0~8，C++ 用 res[0..8])

  // 9 次带排斥采样
  for (let idx = 8; idx >= 0; idx--) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
      sum += tempP[i];
    }

    // C++: sum *= (rand() / 32768.0 + rand()) / 32768.0;
    sum *= randDouble();

    // C++: res[idx] = 0; while (sum > 0 && res[idx] < n) { res[idx]++; if (res[idx] <= n) sum -= temp_p[res[idx]]; }
    res[idx] = 0;
    while (sum > 0 && res[idx] < n) {
      res[idx]++;
      if (res[idx] <= n) {
        sum -= tempP[res[idx]];
      }
    }

    // 排斥衰减
    for (let i = 1; i <= n; i++) {
      const diff = Math.abs(i - res[idx]);
      if (diff <= n) {
        tempP[i] /= (1.0 + probNN[diff]);
      }
    }
  }

  // 随机分配 res[0..8] 到 9 个格子
  // C++:
  // for (int i = 0; i < 9; i++) {
  //   int x = rand() % 9;
  //   while (x >= 9 || res[x] <= 0) x = rand() % 9;
  //   gs.true_r[i] = base_r[i] * res[x] * dd;
  //   res[x] = 0;
  // }
  const trueR = new Array(9).fill(0);
  for (let i = 0; i < 9; i++) {
    let x = randMod(9);
    while (x >= 9 || res[x] <= 0) {
      x = randMod(9);
    }
    let val = BASE_R[i] * res[x] * d;
    if (val > 99.99) val = 99.99;
    if (val < 0.01) val = 0.01;
    trueR[i] = val;
    res[x] = 0;
  }

  return trueR;
}

// ============================================================
// generateCellProb —— 与 C++ 完全一致
// ============================================================

export function generateCellProb(pos: number, n: number = 2000, d: number = 1.0 / 120.0): number {
  const pP = new Float64Array(n + 5);
  for (let i = 1; i <= n; i++) {
    pP[i] = Math.pow(i * 1.0, 11.0 / 16.0);
  }

  const idx = sampleFromDist(n, d, pP);

  let val = BASE_R[pos] * idx * d;
  if (val > 99.99) val = 99.99;
  if (val < 0.01) val = 0.01;
  return val;
}

// ============================================================
// 工具函数
// ============================================================

/** 四舍五入到 5%（C++ roundTo5） */
export function roundTo5(p: number): number {
  return Math.round(p / 5.0) * 5.0;
}

/** 获取格子补偿值（C++ getCompensation） */
export function getCompensation(pos: number): number {
  if (pos === 4) return 3; // 中心
  if (pos === 0 || pos === 2 || pos === 6 || pos === 8) return 4; // 角
  return 6; // 边
}

/** 判断格子类型 */
export function isCorner(pos: number): boolean {
  return pos === 0 || pos === 2 || pos === 6 || pos === 8;
}
export function isSide(pos: number): boolean {
  return pos === 1 || pos === 3 || pos === 5 || pos === 7;
}
export function isCenter(pos: number): boolean {
  return pos === 4;
}

// 模拟 C++ main() 中的 srand(static_cast<unsigned>(time(nullptr)));
// 只在模块加载时执行一次，多局游戏共享同一个 rand() 状态
srand(Math.floor(Date.now() / 1000));

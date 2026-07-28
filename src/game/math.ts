// ============================================================
// LValue - Logarithmic value system (never overflows)
// Represents a number as { mantissa, exponent } where value = b * 10^e
// ============================================================

export type LValue = {
  b: number; // mantissa: [1.0, 9.999...)
  e: number; // exponent: integer
};

export const L_ONE: LValue = { b: 1.0, e: 0 };
export const L_ZERO: LValue = { b: 0, e: 0 };

/** Create LValue from a plain integer */
export function lFromInt(n: number): LValue {
  if (n <= 0) return L_ZERO;
  const e = Math.floor(Math.log10(n));
  const b = n / 10 ** e;
  return normalize({ b, e });
}

/** Create LValue from a float like 3.5e45 */
export function lFromSci(b: number, e: number): LValue {
  return normalize({ b, e });
}

/** Normalize mantissa into [1.0, 10) */
function normalize(v: LValue): LValue {
  if (v.b === 0) return L_ZERO;
  if (v.b < 0) return L_ZERO; // no negative
  const extraE = Math.floor(Math.log10(v.b));
  return {
    b: v.b / 10 ** extraE,
    e: v.e + extraE,
  };
}

/** a + b (only used for resource accumulation) */
export function lAdd(a: LValue, b: LValue): LValue {
  if (a.b === 0) return { ...b };
  if (b.b === 0) return { ...a };
  // Convert both to real, add, then normalize
  const va = a.b * 10 ** a.e;
  const vb = b.b * 10 ** b.e;
  const sum = va + vb;
  if (!isFinite(sum)) return { b: 9.99, e: 1e15 }; // soft cap
  const e = Math.floor(Math.log10(sum));
  return normalize({ b: sum / 10 ** e, e });
}

/** a * b */
export function lMul(a: LValue, b: LValue): LValue {
  if (a.b === 0 || b.b === 0) return L_ZERO;
  const res = normalize({ b: a.b * b.b, e: a.e + b.e });
  if (!isFinite(res.b) || !isFinite(res.e)) return { b: 9.99, e: 1e15 };
  return res;
}

/** a * scalar (number) */
export function lMulScalar(v: LValue, s: number): LValue {
  if (v.b === 0 || s === 0) return L_ZERO;
  const res = normalize({ b: v.b * s, e: v.e });
  if (!isFinite(res.b) || !isFinite(res.e)) return { b: 9.99, e: 1e15 };
  return res;
}

/** min(a, b) */
export function lMin(a: LValue, b: LValue): LValue {
  if (lCompare(a, b) <= 0) return { ...a };
  return { ...b };
}

/** Compare: -1 if a<b, 0 if equal, 1 if a>b */
export function lCompare(a: LValue, b: LValue): number {
  if (a.b === 0 && b.b === 0) return 0;
  if (a.b === 0) return -1;
  if (b.b === 0) return 1;
  if (a.e !== b.e) return a.e < b.e ? -1 : 1;
  if (Math.abs(a.b - b.b) < 1e-10) return 0;
  return a.b < b.b ? -1 : 1;
}

/** a >= b */
export function lGte(a: LValue, b: LValue): boolean {
  return lCompare(a, b) >= 0;
}

/** a > b */
export function lGt(a: LValue, b: LValue): boolean {
  return lCompare(a, b) > 0;
}

/** Format LValue for UI display */
export function lFormat(v: LValue): string {
  if (v.b === 0) return "0";
  if (v.e < 3) {
    const real = Math.round(v.b * 10 ** v.e);
    return real.toLocaleString();
  }
  if (v.e < 6) return `${(v.b * 10 ** (v.e % 3)).toFixed(1)}${["", "K", "M"][v.e % 3]}`;
  if (v.e < 9) return `${(v.b * 10 ** (v.e % 3)).toFixed(1)}${["", "K", "M", "B", "T", "Qa"][v.e % 3 + (Math.floor(v.e / 3) - 2) * 0] || ""}`;
  return `${v.b.toFixed(2)}e${v.e}`;
}

/** Simpler suffix formatter */
export function lFormatCompact(v: LValue): string {
  if (v.b === 0) return "0";
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const idx = Math.floor(v.e / 3);
  if (idx < suffixes.length) {
    const scaled = v.b * 10 ** (v.e % 3);
    return `${scaled.toFixed(1)}${suffixes[idx]}`;
  }
  return `${v.b.toFixed(2)}e${v.e}`;
}

// ============================================================
// Upgrade cost formula: 100 * 1.5^(level-1)
// ============================================================
export function upgradeCost(level: number): LValue {
  if (level <= 0) return L_ZERO;
  const e = (level - 1) * 0.176; // log10(1.5) ≈ 0.176
  return normalize({ b: 1.0, e: Math.floor(e + 2) }); // base 100
}

// Total cost to reach level n from 1
export function totalUpgradeCost(targetLevel: number): LValue {
  let sum = L_ZERO;
  for (let i = 1; i < targetLevel; i++) {
    sum = lAdd(sum, upgradeCost(i));
  }
  return sum;
}

// ============================================================
// Enemy HP formula: base * 10^(stageId * 0.3)
// ============================================================
export function enemyHP(stageId: number): LValue {
  const growth = stageId * 0.035;
  const exponent = Math.floor(growth);
  const mantissa = (2.0 + Math.random() * 0.5) * 10 ** (growth - exponent);
  return normalize({ b: mantissa, e: exponent });
}

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── SuperNumber (arbitrary precision) ─── */

const MAX_EXP = 10n ** 10000n;

type SNType = 'NORMAL' | 'ZERO' | 'INF' | 'INVALID';

class SuperNumber {
  type: SNType; sign: number; mantissa: number; exponent: bigint; reason: string;
  constructor(type: SNType, sign = 1, mantissa = 1, exponent = 0n, reason = '') {
    this.type = type; this.sign = sign; this.mantissa = mantissa; this.exponent = exponent; this.reason = reason;
    if (type === 'NORMAL') this.normalize();
  }
  static fromNumber(n: number) {
    if (!isFinite(n)) return n === Infinity ? new SuperNumber('INF', 1) : n === -Infinity ? new SuperNumber('INF', -1) : SuperNumber.invalid('NaN');
    if (n === 0) return new SuperNumber('ZERO');
    const sign = n < 0 ? -1 : 1, absN = Math.abs(n);
    const log10 = Math.log10(absN), exp = BigInt(Math.floor(log10)), mant = absN / (10 ** Number(exp));
    return new SuperNumber('NORMAL', sign, mant, exp);
  }
  static fromBigInt(n: bigint) {
    if (n === 0n) return new SuperNumber('ZERO');
    const sign = n < 0n ? -1 : 1, absN = n < 0n ? -n : n, str = absN.toString(), len = str.length;
    const digits = str.slice(0, 15), mant = parseFloat(digits) / (10 ** (digits.length - 1)), exp = BigInt(len - 1);
    return new SuperNumber('NORMAL', sign, mant, exp);
  }
  normalize() {
    if (this.type !== 'NORMAL') return this;
    if (!isFinite(this.mantissa)) {
      if (this.mantissa === Infinity || this.mantissa === -Infinity) { this.type = 'INF'; this.sign = this.mantissa > 0 ? 1 : -1; this.mantissa = 1; this.exponent = 0n; }
      else { this.type = 'INVALID'; this.reason = '非法数值 (NaN)'; }
      return this;
    }
    if (this.mantissa === 0) { this.type = 'ZERO'; this.sign = 1; this.mantissa = 1; this.exponent = 0n; return this; }
    if (this.mantissa < 0) { this.sign = -this.sign; this.mantissa = -this.mantissa; }
    const log10 = Math.log10(this.mantissa);
    if (!isFinite(log10)) { this.type = 'INVALID'; this.reason = '非法数值'; return this; }
    const adj = Math.floor(log10);
    if (adj !== 0) { this.mantissa /= 10 ** adj; this.exponent += BigInt(adj); }
    if (this.exponent > MAX_EXP) { this.type = 'INF'; this.sign = this.sign > 0 ? 1 : -1; this.mantissa = 1; this.exponent = 0n; return this; }
    if (this.exponent < -MAX_EXP) { this.type = 'ZERO'; this.sign = 1; this.mantissa = 1; this.exponent = 0n; return this; }
    while (this.mantissa >= 10) { this.mantissa /= 10; this.exponent += 1n; }
    while (this.mantissa < 1 && this.mantissa > 0) { this.mantissa *= 10; this.exponent -= 1n; }
    return this;
  }
  toNumber() {
    if (this.type === 'ZERO') return 0;
    if (this.type === 'INF') return this.sign > 0 ? Infinity : -Infinity;
    if (this.type === 'INVALID') return NaN;
    const expNum = Number(this.exponent);
    if (!isFinite(expNum) || expNum > 300 || expNum < -300) return this.sign > 0 ? Infinity : -Infinity;
    return this.sign * this.mantissa * (10 ** expNum);
  }
  display() {
    if (this.type === 'ZERO') return '0';
    if (this.type === 'INF') return this.sign > 0 ? '∞' : '-∞';
    if (this.type === 'INVALID') return '错误: ' + this.reason;
    const expNum = Number(this.exponent);
    if (this.exponent >= -6n && this.exponent <= 15n && isFinite(expNum)) {
      const val = this.toNumber();
      if (isFinite(val)) {
        let str = Math.abs(val).toPrecision(12);
        str = str.replace(/\.?0+(?=$|e)/, '').replace(/(?<=\.\d+)0+(?=$|e)/, '');
        if (!str.includes('e')) return (this.sign < 0 ? '-' : '') + str;
      }
    }
    return `${this.sign < 0 ? '-' : ''}${this.mantissa.toPrecision(6)}×10^${this.exponent.toString()}`;
  }
  static invalid(reason: string) { return new SuperNumber('INVALID', 1, 0, 0n, reason); }
  isInteger() {
    if (this.type === 'ZERO') return true;
    if (this.type !== 'NORMAL') return false;
    if (this.exponent < 0n) return false;
    if (this.exponent === 0n) return Math.abs(this.mantissa - Math.round(this.mantissa)) < 1e-10;
    const expNum = Number(this.exponent);
    if (!isFinite(expNum)) return true;
    if (expNum > 300) return true;
    const val = this.mantissa * (10 ** expNum);
    if (!isFinite(val)) return true;
    return Math.abs(val - Math.round(val)) < 1e-10;
  }
  toBigInt() {
    if (this.type === 'ZERO') return 0n;
    if (this.exponent < 0n) return 0n;
    if (this.exponent === 0n) return BigInt(Math.round(this.mantissa));
    const expNum = Number(this.exponent);
    if (isFinite(expNum) && expNum < 20) { const num = this.toNumber(); if (isFinite(num)) return BigInt(Math.round(num)); }
    return 10n ** this.exponent;
  }
  neg() {
    if (this.type === 'ZERO') return this;
    if (this.type === 'INF') return new SuperNumber('INF', -this.sign);
    return new SuperNumber('NORMAL', -this.sign, this.mantissa, this.exponent);
  }
  add(other: SuperNumber) {
    if (this.type === 'INVALID' || other.type === 'INVALID') return SuperNumber.invalid('运算中有非法值');
    if (this.type === 'ZERO') return other;
    if (other.type === 'ZERO') return this;
    if (this.type === 'INF' || other.type === 'INF') {
      if (this.type === 'INF' && other.type === 'INF' && this.sign !== other.sign) return SuperNumber.invalid('正负无穷相加不确定');
      return this.type === 'INF' ? this : other;
    }
    const diff = this.exponent - other.exponent;
    if (diff > 20n) return new SuperNumber('NORMAL', this.sign, this.mantissa, this.exponent);
    if (diff < -20n) return new SuperNumber('NORMAL', other.sign, other.mantissa, other.exponent);
    const diffNum = Number(diff);
    let a = this.sign * this.mantissa, b = other.sign * other.mantissa;
    if (diff > 0n) b *= 10 ** (-diffNum);
    else if (diff < 0n) a *= 10 ** diffNum;
    const sum = a + b;
    if (sum === 0) return new SuperNumber('ZERO');
    return new SuperNumber('NORMAL', Math.sign(sum), Math.abs(sum), diff > 0n ? this.exponent : other.exponent);
  }
  sub(other: SuperNumber) { return this.add(other.neg()); }
  mul(other: SuperNumber) {
    if (this.type === 'INVALID' || other.type === 'INVALID') return SuperNumber.invalid('运算中有非法值');
    if (this.type === 'ZERO' || other.type === 'ZERO') return new SuperNumber('ZERO');
    if (this.type === 'INF' || other.type === 'INF') return new SuperNumber('INF', this.sign * other.sign);
    return new SuperNumber('NORMAL', this.sign * other.sign, this.mantissa * other.mantissa, this.exponent + other.exponent);
  }
  div(other: SuperNumber) {
    if (this.type === 'INVALID' || other.type === 'INVALID') return SuperNumber.invalid('运算中有非法值');
    if (other.type === 'ZERO') return SuperNumber.invalid('除以零');
    if (this.type === 'ZERO') return new SuperNumber('ZERO');
    if (this.type === 'INF' && other.type === 'INF') return SuperNumber.invalid('无穷除以无穷不确定');
    if (this.type === 'INF') return this;
    if (other.type === 'INF') return new SuperNumber('ZERO');
    return new SuperNumber('NORMAL', this.sign * other.sign, this.mantissa / other.mantissa, this.exponent - other.exponent);
  }
  pow(other: SuperNumber) {
    if (this.type === 'INVALID' || other.type === 'INVALID') return SuperNumber.invalid('运算中有非法值');
    if (other.type === 'ZERO') return new SuperNumber('NORMAL', 1, 1, 0n);
    if (this.type === 'ZERO') { if (other.sign < 0) return SuperNumber.invalid('0的负数次幂'); return new SuperNumber('ZERO'); }
    if (this.type === 'INF') { if (other.sign < 0) return new SuperNumber('ZERO'); return new SuperNumber('INF', this.sign > 0 ? 1 : -1); }
    if (this.sign < 0 && !other.isInteger()) return SuperNumber.invalid('负数的非整数次幂');
    if (other.isInteger()) {
      const bigN = other.toBigInt();
      if (bigN > 9007199254740991n || bigN < -9007199254740991n) {
        let log10a: SuperNumber;
        const expNum = Number(this.exponent);
        if (isFinite(expNum) && Math.abs(expNum) < 1000) log10a = SuperNumber.fromNumber(Math.log10(this.mantissa) + expNum);
        else log10a = new SuperNumber('NORMAL', 1, 1, this.exponent);
        const resultLog10 = log10a.mul(other);
        return pow10(resultLog10);
      }
      const n = Number(bigN), sign = (n % 2 === 0) ? 1 : this.sign;
      const mant = this.mantissa ** n, exp = this.exponent * BigInt(n);
      return new SuperNumber('NORMAL', sign, mant, exp);
    }
    let log10a: SuperNumber;
    const expNum = Number(this.exponent);
    if (isFinite(expNum) && Math.abs(expNum) < 1000) log10a = SuperNumber.fromNumber(Math.log10(this.mantissa) + expNum);
    else log10a = new SuperNumber('NORMAL', 1, 1, this.exponent);
    return pow10(log10a.mul(other));
  }
  factorial() {
    if (this.type === 'INVALID') return this;
    if (this.type === 'INF') return new SuperNumber('INF', 1);
    if (this.type === 'ZERO') return new SuperNumber('NORMAL', 1, 1, 0n);
    if (this.sign < 0) return SuperNumber.invalid('负数阶乘');
    if (!this.isInteger()) return SuperNumber.invalid('阶乘仅对非负整数有效');
    if (this.exponent === 0n) {
      const n = Math.round(this.mantissa);
      if (n <= 10000) { let result = 1n; for (let i = 2n; i <= BigInt(n); i++) result *= i; return SuperNumber.fromBigInt(result); }
      const log10N = Math.log10(n), mainTerm = n * (log10N - Math.LOG10E), corrTerm = 0.5 * Math.log10(2 * Math.PI * n);
      return pow10(SuperNumber.fromNumber(mainTerm + corrTerm));
    }
    const expNum = Number(this.exponent);
    if (!isFinite(expNum)) return new SuperNumber('INF', 1);
    const log10N = Math.log10(this.mantissa) + expNum, factor = log10N - Math.LOG10E;
    const mainMant = this.mantissa * factor, mainTerm = new SuperNumber('NORMAL', mainMant < 0 ? -1 : 1, Math.abs(mainMant), this.exponent);
    const corr = 0.5 * (Math.log10(2 * Math.PI * this.mantissa) + expNum);
    return pow10(mainTerm.add(SuperNumber.fromNumber(corr)));
  }
  sqrt() {
    if (this.type === 'INVALID') return this;
    if (this.type === 'ZERO') return new SuperNumber('ZERO');
    if (this.sign < 0) return SuperNumber.invalid('负数的平方根');
    if (this.type === 'INF') return new SuperNumber('INF', 1);
    let mant = Math.sqrt(this.mantissa), exp = this.exponent;
    if (exp % 2n !== 0n) { mant *= Math.sqrt(10); exp -= 1n; }
    exp /= 2n;
    return new SuperNumber('NORMAL', 1, mant, exp);
  }
}

function pow10(superNum: SuperNumber): SuperNumber {
  if (superNum.type === 'ZERO') return new SuperNumber('NORMAL', 1, 1, 0n);
  if (superNum.type === 'INF') return new SuperNumber('INF', superNum.sign > 0 ? 1 : -1);
  if (superNum.type === 'INVALID') return superNum;
  if (superNum.sign < 0) {
    const positive = superNum.neg();
    const result = pow10(positive);
    if (result.type === 'INVALID' || result.type === 'ZERO') return SuperNumber.invalid('10的负数次幂导致除以零');
    return new SuperNumber('NORMAL', 1, 1, 0n).div(result);
  }
  if (superNum.exponent <= 0n) { const val = superNum.toNumber(); if (!isFinite(val)) return SuperNumber.invalid('非法指数'); return SuperNumber.fromNumber(10 ** val); }
  if (superNum.exponent >= 15n) {
    const mantissaStr = superNum.mantissa.toPrecision(15).replace('.', '');
    const leadingDigits = BigInt(mantissaStr), expAdj = BigInt(mantissaStr.length - 1);
    const intPart = leadingDigits * (10n ** (superNum.exponent - expAdj));
    if (intPart > MAX_EXP) return new SuperNumber('INF', 1);
    return new SuperNumber('NORMAL', 1, 1, intPart);
  }
  const val = superNum.toNumber(), intPart = BigInt(Math.floor(val)), frac = val - Number(intPart);
  return new SuperNumber('NORMAL', 1, 10 ** frac, intPart);
}

/* ─── ExpressionParser ─── */

class ExpressionParser {
  text: string; pos: number;
  constructor(text: string) { this.text = text.replace(/\s/g, ''); this.pos = 0; }
  parse(): SuperNumber {
    const result = this.expr();
    if (this.pos < this.text.length) throw new Error(`解析错误：位置 ${this.pos} 处有多余字符"${this.text.slice(this.pos)}"`);
    return result;
  }
  peek() { return this.pos < this.text.length ? this.text[this.pos] : '\0'; }
  consume() { return this.text[this.pos++]; }
  match(ch: string) { if (this.peek() === ch) { this.pos++; return true; } return false; }
  matchString(str: string) { if (this.text.slice(this.pos, this.pos + str.length) === str) { this.pos += str.length; return true; } return false; }
  expr(): SuperNumber { return this.addSub(); }
  addSub(): SuperNumber {
    let left = this.mulDiv();
    while (true) { if (this.match('+')) left = left.add(this.mulDiv()); else if (this.match('-')) left = left.sub(this.mulDiv()); else break; }
    return left;
  }
  mulDiv(): SuperNumber {
    let left = this.power();
    while (true) { if (this.match('*') || this.match('×')) left = left.mul(this.power()); else if (this.match('/') || this.match('÷')) left = left.div(this.power()); else break; }
    return left;
  }
  power(): SuperNumber {
    let left = this.unary();
    if (this.match('^')) { const right = this.power(); left = left.pow(right); }
    return left;
  }
  unary(): SuperNumber {
    if (this.match('√')) return this.unary().sqrt();
    if (this.matchString('sqrt(')) { const val = this.expr(); if (!this.match(')')) throw new Error(`位置 ${this.pos}: sqrt 缺少右括号`); return val.sqrt(); }
    if (this.match('-')) return this.unary().neg();
    return this.postfix();
  }
  postfix(): SuperNumber {
    let val = this.primary();
    while (this.match('!')) val = val.factorial();
    return val;
  }
  primary(): SuperNumber {
    const ch = this.peek();
    if (ch === '(') { this.consume(); const val = this.expr(); if (!this.match(')')) throw new Error(`位置 ${this.pos}: 缺少右括号`); return val; }
    if (ch >= '0' && ch <= '9') return this.number();
    throw new Error(`位置 ${this.pos}: 意外的字符"${ch}"`);
  }
  number(): SuperNumber {
    const start = this.pos;
    while (this.peek() >= '0' && this.peek() <= '9') this.consume();
    if (this.match('.')) { while (this.peek() >= '0' && this.peek() <= '9') this.consume(); }
    const numStr = this.text.slice(start, this.pos), num = parseFloat(numStr);
    if (!isFinite(num)) throw new Error(`位置 ${start}: 数字过大`);
    return SuperNumber.fromNumber(num);
  }
}

/* ─── TargetGenerator ─── */

class TargetGenerator {
  minNum: number; maxNum: number;
  constructor(minNum = 1, maxNum = 20) { this.minNum = minNum; this.maxNum = maxNum; }
  generateNumbers(count: number) { return Array.from({ length: count }, () => Math.floor(Math.random() * (this.maxNum - this.minNum + 1)) + this.minNum); }
  generateExpression(numbers: number[]) {
    const nums = [...numbers];
    for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; }
    return this.buildExpr(nums);
  }
  buildExpr(nums: number[]): string {
    if (nums.length === 1) {
      let expr = nums[0].toString();
      const r = Math.random();
      if (r < 0.15 && nums[0] >= 0) expr = `√(${expr})`;
      else if (r < 0.25 && nums[0] >= 0 && nums[0] <= 6) expr += '!';
      return expr;
    }
    const split = Math.floor(Math.random() * (nums.length - 1)) + 1;
    const left = this.buildExpr(nums.slice(0, split)), right = this.buildExpr(nums.slice(split));
    const ops = ['+', '-', '*', '/', '^'], weights = [25, 25, 20, 15, 15];
    let total = weights.reduce((a, b) => a + b, 0), rnd = Math.random() * total;
    let op = ops[0];
    for (let i = 0; i < ops.length; i++) { rnd -= weights[i]; if (rnd <= 0) { op = ops[i]; break; } }
    if (op === '/' && this.isZeroExpr(right)) op = '+';
    const needsParen = (str: string) => !/^\d+!?$/.test(str) && !/^√\(.+\)$/.test(str);
    const parenProb = 0.3;
    const l = Math.random() < parenProb && needsParen(left) ? `(${left})` : left;
    const r = Math.random() < parenProb && needsParen(right) ? `(${right})` : right;
    return `${l}${op}${r}`;
  }
  isZeroExpr(expr: string): boolean {
    if (expr === '0' || expr === '0!' || expr === '(0)' || expr === '√(0)' || expr === 'sqrt(0)') return true;
    try { const parser = new ExpressionParser(expr); const result = parser.parse(); return result.type === 'ZERO'; } catch { return false; }
  }
  generateTarget(numCount: number, maxAttempts = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const numbers = this.generateNumbers(numCount);
      const expr = this.generateExpression(numbers);
      try {
        const parser = new ExpressionParser(expr), result = parser.parse();
        if (result.type !== 'INVALID' && result.type !== 'INF') {
          const expNum = Number(result.exponent);
          if (result.type === 'ZERO' || (isFinite(expNum) && Math.abs(expNum) < 100)) return { numbers, expr, target: result };
        }
      } catch {}
    }
    const numbers = this.generateNumbers(numCount);
    const expr = numbers.join('+');
    const parser = new ExpressionParser(expr);
    return { numbers, expr, target: parser.parse() };
  }
}

/* ─── Super24Game ─── */

interface HistoryEntry { expr: string; score: number; result: string; target: string; }

class Super24Game {
  generator = new TargetGenerator();
  numbers: number[] = [];
  hiddenExpr = '';
  target: SuperNumber | null = null;
  history: HistoryEntry[] = [];
  difficulty = 8;
  newGame(numCount?: number) {
    this.difficulty = numCount || this.difficulty;
    const result = this.generator.generateTarget(this.difficulty);
    this.numbers = result.numbers;
    this.hiddenExpr = result.expr;
    this.target = result.target;
    this.history = [];
  }
  validateNumbers(playerExpr: string): { valid: boolean; msg?: string } {
    const foundNumbers: number[] = [];
    const expr = playerExpr.replace(/\s/g, '');
    let i = 0;
    while (i < expr.length) {
      if (expr[i] >= '0' && expr[i] <= '9') {
        let j = i;
        while (j < expr.length && expr[j] >= '0' && expr[j] <= '9') j++;
        const num = parseInt(expr.slice(i, j));
        const prev = i > 0 ? expr[i - 1] : '';
        const next = j < expr.length ? expr[j] : '';
        if (prev === '.' || next === '.') return { valid: false, msg: `不能使用小数点拼接数字（发现 ${num} 与小数点相邻）` };
        foundNumbers.push(num);
        i = j;
      } else i++;
    }
    const expected = [...this.numbers].sort((a, b) => a - b);
    const found = [...foundNumbers].sort((a, b) => a - b);
    if (expected.length !== found.length) return { valid: false, msg: `必须使用数字 [${this.numbers.join(', ')}] 各恰好一次，你使用了 [${foundNumbers.join(', ')}]（共 ${foundNumbers.length} 个，需 ${expected.length} 个）` };
    for (let k = 0; k < expected.length; k++) if (expected[k] !== found[k]) return { valid: false, msg: `必须使用数字 [${this.numbers.join(', ')}] 各恰好一次，你使用了 [${foundNumbers.join(', ')}]` };
    return { valid: true };
  }
  evaluate(playerExpr: string) {
    const validation = this.validateNumbers(playerExpr);
    if (!validation.valid) return { result: SuperNumber.invalid(validation.msg!), error: validation.msg! };
    try { const parser = new ExpressionParser(playerExpr); return { result: parser.parse(), error: '' }; }
    catch (e: any) { return { result: SuperNumber.invalid(e.message), error: e.message }; }
  }
  compare(player: SuperNumber, target: SuperNumber) {
    if (target.type === 'ZERO') {
      if (player.type === 'ZERO') return { score: 100, info: '🎉 完美！结果等于 0！100分！', perfect: true };
      const pNum = player.toNumber();
      if (!isFinite(pNum)) return { score: 0, info: '❌ 结果无效' };
      const absDiff = Math.abs(pNum), score = Math.min(100, 100 * Math.exp(-5 * absDiff));
      const rounded = Math.round(score * 1000) / 1000;
      return { score: rounded, info: `目标: 0 | 你的结果: ${player.display()} | 绝对差值: ${absDiff.toPrecision(4)} | 得分: ${rounded.toFixed(3)}` };
    }
    if (player.type === 'ZERO') {
      const tNum = target.toNumber();
      if (!isFinite(tNum) || tNum === 0) return { score: 0, info: '❌ 无法比较' };
      const score = 100 * Math.exp(-5);
      return { score: Math.round(score * 1000) / 1000, info: `💔 差太远了 | 目标: ${target.display()} | 你的结果: 0 | 得分: ${(100 * Math.exp(-5)).toFixed(3)}` };
    }
    const tNum = target.toNumber(), pNum = player.toNumber();
    if (isFinite(tNum) && isFinite(pNum) && Math.abs(tNum) > 1e-300) {
      const relErr = Math.abs((pNum - tNum) / tNum), score = Math.min(100, 100 * Math.exp(-5 * relErr));
      const rounded = Math.round(score * 1000) / 1000;
      if (rounded >= 100) return { score: 100, info: '🎉 完美！极其接近目标！100分！', perfect: true };
      const grade = score >= 90 ? '🌟 极接近！' : score >= 70 ? '✨ 很接近！' : score >= 50 ? '👍 还不错' : score >= 20 ? '😐 有点远' : '💔 差太远了';
      return { score: rounded, info: `${grade} | 目标: ${target.display()} | 你的结果: ${player.display()} | 相对误差: ${(relErr * 100).toPrecision(3)}% | 得分: ${rounded.toFixed(3)}` };
    }
    const log10T = Math.log10(target.mantissa) + Number(target.exponent), log10P = Math.log10(player.mantissa) + Number(player.exponent);
    if (!isFinite(log10T) || !isFinite(log10P)) return { score: 0, info: '❌ 数值过大，无法比较' };
    const logDiff = Math.abs(log10T - log10P), score = Math.min(100, 100 * Math.exp(-0.5 * logDiff));
    const rounded = Math.round(score * 1000) / 1000;
    const grade = score >= 90 ? '🌟 极接近（对数尺度）！' : score >= 70 ? '✨ 很接近（对数尺度）！' : score >= 50 ? '👍 还不错' : score >= 20 ? '😐 有点远' : '💔 差太远了';
    return { score: rounded, info: `${grade} | 目标: ${target.display()} | 你的结果: ${player.display()} | log10差值: ${logDiff.toPrecision(4)} | 得分: ${rounded.toFixed(3)}` };
  }
  score(playerExpr: string) {
    const { result, error } = this.evaluate(playerExpr);
    if (error) return { score: 0, info: `❌ 表达式错误: ${error}`, result, perfect: false };
    if (result.type === 'INVALID') return { score: 0, info: `❌ 非法结果: ${result.reason}`, result, perfect: false };
    if (result.type === 'INF') return { score: 0, info: '❌ 结果溢出（∞），得0分', result, perfect: false };
    const comparison = this.compare(result, this.target!);
    this.history.push({ expr: playerExpr, score: comparison.score, result: result.display(), target: this.target!.display() });
    return { score: comparison.score, info: comparison.info, result, perfect: comparison.perfect || false };
  }
}

export default function Super24() {
  const [game] = useState(() => new Super24Game());
  const [, forceUpdate] = useState(0);
  const [difficulty, setDifficulty] = useState(8);
  const [input, setInput] = useState('');
  const [resultInfo, setResultInfo] = useState('');
  const [resultCls, setResultCls] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const rerender = useCallback(() => forceUpdate(n => n + 1), []);

  const newGame = useCallback((diff?: number) => {
    const d = diff ?? difficulty;
    game.newGame(d);
    setDifficulty(d);
    setInput('');
    setResultInfo('');
    setResultCls('');
    setScore(null);
    setShowAnswer(false);
    setHistory([]);
    rerender();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [game, difficulty, rerender]);

  useEffect(() => { newGame(); }, []);

  function submitExpr() {
    const expr = input.trim();
    if (!expr) return;
    const { score: s, info } = game.score(expr);
    setScore(s);
    setResultInfo(info);
    setResultCls(s >= 90 ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : s > 0 ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-red-500/30 bg-red-500/10 text-red-400');
    setHistory([...game.history]);
    setInput('');
    rerender();
    if (s >= 100) setTimeout(() => { if (confirm('🎉 恭喜通关！再来一局？')) newGame(); }, 500);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center mb-1" style={{ background: 'linear-gradient(90deg, #00d4ff, #7b2cbf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>超级24点游戏</h2>
      <p className="text-center text-sm text-nc-text-muted mb-6">Super 24 Point — 超越极限的数学挑战</p>

      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-5 mb-4">
        <div className="text-sm font-medium mb-3" style={{ color: '#00d4ff' }}>🎮 难度选择</div>
        <div className="flex gap-2 justify-center flex-wrap">
          {[3, 5, 8, 12, 20, 30, 42].map(n => (
            <button key={n} onClick={() => newGame(n)} className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${difficulty === n ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-nc-text-muted hover:text-nc-text'}`} style={{ borderWidth: '2px', background: difficulty === n ? 'rgba(0,212,255,0.1)' : 'rgba(0,0,0,0.2)' }}>{n}个数字</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-5 mb-4">
        <div className="text-sm font-medium mb-3" style={{ color: '#00d4ff' }}>🎯 当前挑战</div>
        <div className="text-center text-xl font-bold py-3 px-4 rounded-xl mb-3" style={{ color: '#ffcc00', background: 'rgba(255,204,0,0.1)', border: '1px solid rgba(255,204,0,0.3)', wordBreak: 'break-all' }}>
          目标值: {game.target?.display() ?? '--'}
        </div>
        <div className="flex gap-3 justify-center flex-wrap my-4">
          {game.numbers.map((n, i) => (
            <div key={i} className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 8px 32px rgba(102,126,234,0.3)' }}>{n}</div>
          ))}
        </div>

        <div className="flex gap-2 justify-center flex-wrap mb-3">
          {['√', '^', '!', '(', ')', 'sqrt('].map(s => (
            <button key={s} onClick={() => {
              const el = inputRef.current;
              if (el) {
                const start = el.selectionStart ?? input.length, end = el.selectionEnd ?? input.length;
                const val = input;
                setInput(val.slice(0, start) + s + val.slice(end));
                setTimeout(() => { el.focus(); el.setSelectionRange(start + s.length, start + s.length); }, 0);
              }
            }} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>{s}</button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitExpr()} placeholder="输入表达式, 如: 3^3+√(4!)" className="flex-1 p-3 text-base rounded-xl border-2 bg-black/20 text-white" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <button onClick={submitExpr} className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)' }}>提交</button>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => setShowAnswer(!showAnswer)} className="px-4 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>{showAnswer ? '隐藏答案' : '👁️ 查看答案'}</button>
          <button onClick={() => newGame()} className="px-4 py-2 rounded-xl text-xs font-medium transition-all" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>🔄 新游戏</button>
        </div>

        {resultInfo && (
          <div
            key={resultInfo}
            className={`super24-result mt-4 p-3 rounded-xl text-sm border ${resultCls}`}
            data-result={(score ?? 0) >= 90 ? 'correct' : (score ?? 0) > 0 ? 'close' : 'wrong'}
            role="status"
          >
            {resultInfo}
          </div>
        )}

        {showAnswer && (
          <div className="mt-3 p-3 rounded-lg text-sm" style={{ border: '1px solid #7b2cbf', background: 'rgba(123,44,191,0.2)' }}>
            🔍 精确答案: {game.hiddenExpr}<br />≈ {game.target?.display()}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-5 mb-4">
        <div className="text-sm font-medium mb-3" style={{ color: '#00d4ff' }}>📊 得分</div>
        <div className="text-4xl font-bold text-center my-3" style={{ color: score !== null ? (score >= 90 ? '#00ff88' : score >= 30 ? '#ffcc00' : '#ff4444') : '#8892b0' }}>{score !== null ? score.toFixed(3) : '--'}</div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(score ?? 0, 100)}%`, background: 'linear-gradient(90deg, #00d4ff, #00ff88)' }} />
        </div>
      </div>

      {history.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-5 mb-4">
          <div className="text-sm font-medium mb-3" style={{ color: '#00d4ff' }}>📜 历史记录</div>
          <div className="max-h-[250px] overflow-y-auto space-y-1">
            {[...history].reverse().map((h, i) => {
              const cls = h.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' : h.score >= 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
              return (
                <div key={i} className="flex justify-between items-center py-2 px-3 rounded-lg border-b border-white/[0.04] text-sm">
                  <span className="font-mono text-nc-text-secondary">{h.expr}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{h.score.toFixed(3)}分</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-5">
        <div className="text-sm font-medium mb-3" style={{ color: '#00d4ff' }}>📖 游戏规则</div>
        <div className="text-sm text-nc-text-secondary leading-relaxed space-y-1">
          <p>1. 系统给出 <strong className="text-nc-text">N 个数字</strong>（N 由难度决定：3~42）</p>
          <p>2. <strong className="text-nc-text">目标值已显示</strong>，你需要用这 N 个数字构造表达式使结果接近目标</p>
          <p>3. 可用运算符：<code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>+</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>-</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>*</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>/</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>( )</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>√</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>sqrt(x)</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>!</code> <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>^</code></p>
          <p>4. 必须<strong className="text-nc-text">恰好使用</strong>给定的 N 个数字各一次</p>
          <p>5. 阶乘仅对<strong className="text-nc-text">非负整数</strong>有效</p>
          <p>6. 根号内不能为负数，可用 <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>√x</code> 或 <code className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff' }}>sqrt(x)</code></p>
          <p>7. 支持<strong className="text-nc-text">无理数</strong>答案（如 √2、√3+1 等），按浮点精度评分</p>
          <p>8. 数值范围：指数位最大支持 10^10000</p>
        </div>
      </div>
    </div>
  );
}

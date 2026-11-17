/**
 * 在浏览器里直接运行本站的 Nyaumae CharLSTM 权重（.npz）。
 *
 * 权重来自 public/models/nyaumae-charlstm/*.npz：ZIP 里装的是 .npy 数组。
 * 这里只做三件事：解 ZIP、解 .npy、按 PyTorch LSTM 的门序做前向。
 * 模型很小（1.25M 版隐层 224、词表 2985），纯 JS 每字约 100 万次乘加，够用。
 */

const MODEL_PATH = 'models/nyaumae-charlstm';

export type CharLstmStage = 'fetch' | 'parse' | 'ready';

export class CharLstmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CharLstmError';
  }
}

interface NpyArray {
  descr: string;
  shape: number[];
  data: Float32Array | Uint8Array;
}

interface ZipEntry {
  name: string;
  method: number;
  compressedSize: number;
  localOffset: number;
}

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function parseZipEntries(buffer: ArrayBuffer): ZipEntry[] {
  const view = new DataView(buffer);
  const length = buffer.byteLength;
  let eocd = -1;
  for (let offset = length - 22; offset >= Math.max(0, length - 22 - 0xffff); offset -= 1) {
    if (readU32(view, offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new CharLstmError('模型文件不是有效的 zip 包。');
  const total = readU16(view, eocd + 10);
  let cursor = readU32(view, eocd + 16);
  const entries: ZipEntry[] = [];
  for (let index = 0; index < total; index += 1) {
    if (readU32(view, cursor) !== 0x02014b50) throw new CharLstmError('模型包目录损坏。');
    const method = readU16(view, cursor + 10);
    const compressedSize = readU32(view, cursor + 20);
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const localOffset = readU32(view, cursor + 42);
    const name = new TextDecoder().decode(new Uint8Array(buffer, cursor + 46, nameLength));
    entries.push({ name, method, compressedSize, localOffset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new CharLstmError('当前浏览器不支持解压模型文件，请更新浏览器，或改用本地安装包。');
  }
  const copy = bytes.slice();
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function extractEntry(buffer: ArrayBuffer, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(buffer);
  const nameLength = readU16(view, entry.localOffset + 26);
  const extraLength = readU16(view, entry.localOffset + 28);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  const raw = new Uint8Array(buffer, start, entry.compressedSize);
  if (entry.method === 0) return raw.slice();
  if (entry.method === 8) return inflateRaw(raw);
  throw new CharLstmError(`不支持的压缩方式：${entry.method}`);
}

function parseHeader(header: string): { descr: string; shape: number[]; fortran: boolean } {
  const descr = /'descr':\s*'([^']+)'/.exec(header)?.[1] ?? '';
  const shapeText = /'shape':\s*\(([^)]*)\)/.exec(header)?.[1] ?? '';
  const fortran = /'fortran_order':\s*True/.test(header);
  const shape = shapeText.split(',').map((part) => part.trim()).filter(Boolean).map(Number);
  return { descr, shape, fortran };
}

function parseNpy(bytes: Uint8Array): NpyArray {
  if (bytes[0] !== 0x93 || bytes[1] !== 0x4e || bytes[2] !== 0x55 || bytes[3] !== 0x4d || bytes[4] !== 0x50 || bytes[5] !== 0x59) {
    throw new CharLstmError('模型数组格式不正确。');
  }
  const major = bytes[6];
  const headerLength = major === 1 ? readU16(new DataView(bytes.buffer, bytes.byteOffset), 8) : readU32(new DataView(bytes.buffer, bytes.byteOffset), 8);
  const headerStart = major === 1 ? 10 : 12;
  const header = new TextDecoder('latin1').decode(bytes.subarray(headerStart, headerStart + headerLength));
  const { descr, shape, fortran } = parseHeader(header);
  if (fortran) throw new CharLstmError('暂不支持 Fortran 顺序的权重。');
  const dataStart = headerStart + headerLength;
  const count = shape.reduce((total, value) => total * value, 1);

  if (descr === '<f4' || descr === '|f4') {
    return { descr, shape, data: new Float32Array(bytes.slice(dataStart, dataStart + count * 4).buffer) };
  }
  if (descr.startsWith('<U')) {
    const width = Number(/^<U(\d+)$/.exec(descr)?.[1] ?? 0);
    if (!width) throw new CharLstmError('词表数据格式不正确。');
    return { descr, shape, data: bytes.slice(dataStart, dataStart + count * width * 4) };
  }
  throw new CharLstmError(`暂不支持的数据类型：${descr}`);
}

function decodeUcs4(bytes: Uint8Array): string {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const total = Math.floor(bytes.byteLength / 4);
  const parts: string[] = [];
  for (let start = 0; start < total; start += 4096) {
    const end = Math.min(start + 4096, total);
    const codes: number[] = [];
    for (let index = start; index < end; index += 1) codes.push(view.getUint32(index * 4, true));
    parts.push(String.fromCodePoint(...codes));
  }
  return parts.join('');
}

function arrayOf(entry: NpyArray): Float32Array {
  if (!(entry.data instanceof Float32Array)) throw new CharLstmError('权重类型不正确。');
  return entry.data;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

export class CharLstmModel {
  readonly name: string;
  readonly vocab: string[];
  readonly vocabSize: number;
  private readonly stoi: Map<string, number>;
  private readonly hidden: number;
  private readonly embDim: number;
  private readonly emb: Float32Array;
  private readonly wIh: Float32Array;
  private readonly wHh: Float32Array;
  private readonly bIh: Float32Array;
  private readonly bHh: Float32Array;
  private readonly headW: Float32Array;
  private readonly headB: Float32Array;
  private readonly h: Float32Array;
  private readonly c: Float32Array;
  private readonly gates: Float32Array;
  private readonly logits: Float32Array;
  private readonly probs: Float32Array;
  private readonly order: Int32Array;

  constructor(name: string, vocab: string[], arrays: Record<string, Float32Array>) {
    this.name = name;
    this.vocab = vocab;
    this.vocabSize = vocab.length;
    this.stoi = new Map(vocab.map((char, index) => [char, index]));
    const headW = arrays.head_w;
    this.headW = headW;
    this.headB = arrays.head_b;
    this.emb = arrays.emb;
    this.embDim = this.emb.length / this.vocabSize;
    this.wIh = arrays.w_ih;
    this.wHh = arrays.w_hh;
    this.bIh = arrays.b_ih;
    this.bHh = arrays.b_hh;
    this.hidden = this.headW.length / this.vocabSize;
    this.h = new Float32Array(this.hidden);
    this.c = new Float32Array(this.hidden);
    this.gates = new Float32Array(this.hidden * 4);
    this.logits = new Float32Array(this.vocabSize);
    this.probs = new Float32Array(this.vocabSize);
    this.order = new Int32Array(this.vocabSize);
  }

  private step(index: number): Float32Array {
    const hidden = this.hidden;
    const embDim = this.embDim;
    const gateCount = hidden * 4;
    const embOffset = index * embDim;
    for (let row = 0; row < gateCount; row += 1) {
      let sum = this.bIh[row] + this.bHh[row];
      const wRow = row * embDim;
      for (let k = 0; k < embDim; k += 1) sum += this.wIh[wRow + k] * this.emb[embOffset + k];
      const hRow = row * hidden;
      for (let k = 0; k < hidden; k += 1) sum += this.wHh[hRow + k] * this.h[k];
      this.gates[row] = sum;
    }

    for (let k = 0; k < hidden; k += 1) {
      const inputGate = 1 / (1 + Math.exp(-this.gates[k]));
      const forgetGate = 1 / (1 + Math.exp(-this.gates[hidden + k]));
      const cellGate = Math.tanh(this.gates[hidden * 2 + k]);
      const outputGate = 1 / (1 + Math.exp(-this.gates[hidden * 3 + k]));
      this.c[k] = forgetGate * this.c[k] + inputGate * cellGate;
      this.h[k] = outputGate * Math.tanh(this.c[k]);
    }

    for (let token = 0; token < this.vocabSize; token += 1) {
      let sum = this.headB[token];
      const row = token * hidden;
      for (let k = 0; k < hidden; k += 1) sum += this.headW[row + k] * this.h[k];
      this.logits[token] = sum;
    }
    return this.logits;
  }

  private sample(temperature: number, topP: number): number {
    if (temperature <= 0.01) {
      let best = 0;
      for (let index = 1; index < this.vocabSize; index += 1) {
        if (this.logits[index] > this.logits[best]) best = index;
      }
      return best;
    }

    let maxLogit = -Infinity;
    for (let index = 0; index < this.vocabSize; index += 1) {
      if (this.logits[index] > maxLogit) maxLogit = this.logits[index];
    }
    let total = 0;
    for (let index = 0; index < this.vocabSize; index += 1) {
      const value = Math.exp((this.logits[index] - maxLogit) / temperature);
      this.probs[index] = value;
      total += value;
    }

    if (topP >= 0.999 || topP <= 0) {
      const target = Math.random() * total;
      let cumulative = 0;
      for (let index = 0; index < this.vocabSize; index += 1) {
        cumulative += this.probs[index];
        if (cumulative >= target) return index;
      }
      return this.vocabSize - 1;
    }

    for (let index = 0; index < this.vocabSize; index += 1) this.order[index] = index;
    this.order.sort((a, b) => this.probs[b] - this.probs[a]);
    let cumulative = 0;
    let keep = this.vocabSize;
    for (let index = 0; index < this.vocabSize; index += 1) {
      cumulative += this.probs[this.order[index]];
      if (cumulative >= topP * total) { keep = index + 1; break; }
    }
    const target = Math.random() * cumulative;
    let acc = 0;
    for (let index = 0; index < keep; index += 1) {
      acc += this.probs[this.order[index]];
      if (acc >= target) return this.order[index];
    }
    return this.order[keep - 1];
  }

  async generate(seed: string, options: {
    maxChars: number;
    temperature: number;
    topP?: number;
    signal?: AbortSignal;
    onChar?: (char: string) => void;
    onStage?: (stage: 'warm' | 'write') => void;
  }): Promise<string> {
    const { maxChars, temperature, topP = 0.9, signal, onChar, onStage } = options;
    const fallback = this.stoi.get('她') ?? 0;
    const ids = Array.from(seed).map((char) => this.stoi.get(char)).filter((value): value is number => typeof value === 'number');
    const prompt = (ids.length ? ids : [fallback]).slice(-240);

    this.h.fill(0);
    this.c.fill(0);
    onStage?.('warm');
    let logits: Float32Array | null = null;
    for (let index = 0; index < prompt.length; index += 1) {
      logits = this.step(prompt[index]);
      if (index % 32 === 0) {
        await yieldToUi();
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      }
    }
    if (!logits) {
      logits = this.step(fallback);
    }

    onStage?.('write');
    let next = this.sample(temperature, topP);
    let text = '';
    for (let index = 0; index < Math.min(maxChars, 512); index += 1) {
      const char = this.vocab[next] ?? '';
      text += char;
      onChar?.(char);
      this.step(next);
      next = this.sample(temperature, topP);
      if (index % 8 === 0) {
        await yieldToUi();
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      }
    }
    return text;
  }
}

function modelUrl(modelName: string): string {
  if (!/^nyaumae-charlstm-[0-9a-z.]+$/i.test(modelName)) {
    throw new CharLstmError('模型名称不合法。');
  }
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${MODEL_PATH}/${modelName}.npz`;
}

async function readModel(modelName: string, onStage?: (stage: CharLstmStage) => void): Promise<CharLstmModel> {
  onStage?.('fetch');
  const response = await fetch(modelUrl(modelName), { cache: 'force-cache' });
  if (!response.ok) throw new CharLstmError(`权重下载失败（HTTP ${response.status}）。`);
  const buffer = await response.arrayBuffer();
  onStage?.('parse');

  const entries = parseZipEntries(buffer);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const readArray = async (name: string): Promise<NpyArray> => {
    const entry = byName.get(`${name}.npy`);
    if (!entry) throw new CharLstmError(`模型缺少 ${name} 数组。`);
    return parseNpy(await extractEntry(buffer, entry));
  };

  const arrays: Record<string, Float32Array> = {};
  for (const name of ['emb', 'w_ih', 'w_hh', 'b_ih', 'b_hh', 'head_w', 'head_b']) {
    arrays[name] = arrayOf(await readArray(name));
  }
  const vocabEntry = await readArray('vocab_json');
  if (!(vocabEntry.data instanceof Uint8Array)) throw new CharLstmError('词表数据格式不正确。');
  const vocab = JSON.parse(decodeUcs4(vocabEntry.data)) as string[];

  onStage?.('ready');
  return new CharLstmModel(modelName, vocab, arrays);
}

const cache = new Map<string, Promise<CharLstmModel>>();

/** 同一页内复用已解析的权重；切换会话不会重新下载。 */
export function loadCharLstmModel(modelName: string, onStage?: (stage: CharLstmStage) => void): Promise<CharLstmModel> {
  const existing = cache.get(modelName);
  if (existing) {
    void existing.then(() => onStage?.('ready'), () => undefined);
    return existing;
  }
  const pending = readModel(modelName, onStage).catch((error: unknown) => {
    cache.delete(modelName);
    throw error;
  });
  cache.set(modelName, pending);
  return pending;
}

/** 页面空闲时预先抓取并解析权重，用户点按钮时直接可用；失败不提示。 */
export function preloadCharLstmModel(modelName: string): void {
  void loadCharLstmModel(modelName).catch(() => undefined);
}

export function isCharLstmModelName(model: string): boolean {
  return /^nyaumae-charlstm-[0-9a-z.]+$/i.test(model);
}

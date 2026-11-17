#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""nyaumae-charlstm 的 OpenAI 兼容本地服务（纯 NumPy，不需要 PyTorch）。

启动：
    py scripts/charlstm_serve.py --models-dir public/models/nyaumae-charlstm --port 8000

然后在站点“AI 设置 → 放在电脑本地 → 其他本地服务”里填写：
    API 地址    http://127.0.0.1:8000/v1
    模型名称    nyaumae-charlstm-1.25m

接口：
    GET  /health
    GET  /v1/models
    POST /v1/chat/completions   （支持 stream=true 的 SSE 流式返回）

说明：这是字符级续写模型，不是通用对话模型。服务把最后一条用户消息当作种子，
按字符续写 max_tokens 个字符返回；temperature=0 时使用贪心解码。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

import numpy as np

DEFAULT_SEED = '她'


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def _softmax(logits: np.ndarray) -> np.ndarray:
    shifted = logits - np.max(logits)
    exp = np.exp(shifted)
    return exp / exp.sum()


class CharLstm:
    """与训练脚本一致的字符级 LSTM 前向（PyTorch 门序 i, f, g, o）。"""

    def __init__(self, npz_path: str):
        with np.load(npz_path, allow_pickle=False) as z:
            self.emb = z['emb'].astype(np.float32)
            self.w_ih = z['w_ih'].astype(np.float32)
            self.w_hh = z['w_hh'].astype(np.float32)
            self.b_ih = z['b_ih'].astype(np.float32)
            self.b_hh = z['b_hh'].astype(np.float32)
            self.head_w = z['head_w'].astype(np.float32)
            self.head_b = z['head_b'].astype(np.float32)
            self.vocab = json.loads(str(z['vocab_json']))
            self.name = str(z['name'])
        self.stoi = {ch: i for i, ch in enumerate(self.vocab)}
        self.vocab_size, self.hidden = self.head_w.shape
        self.emb_dim = self.emb.shape[1]
        self._lock = threading.Lock()

    def _step(self, idx: int, h: np.ndarray, c: np.ndarray):
        gates = self.w_ih @ self.emb[idx] + self.b_ih + self.w_hh @ h + self.b_hh
        hd = self.hidden
        i_g = _sigmoid(gates[:hd])
        f_g = _sigmoid(gates[hd:2 * hd])
        g_g = np.tanh(gates[2 * hd:3 * hd])
        o_g = _sigmoid(gates[3 * hd:])
        c_next = f_g * c + i_g * g_g
        h_next = o_g * np.tanh(c_next)
        logits = self.head_w @ h_next + self.head_b
        return logits, h_next, c_next

    def _warm(self, seed: str):
        h = np.zeros(self.hidden, dtype=np.float32)
        c = np.zeros(self.hidden, dtype=np.float32)
        ids = [self.stoi[ch] for ch in seed if ch in self.stoi]
        if not ids:
            ids = [self.stoi.get(DEFAULT_SEED, 0)]
        logits = None
        for idx in ids[-240:]:
            logits, h, c = self._step(idx, h, c)
        return logits, h, c, len(ids)

    def generate(self, seed: str, max_chars: int, temperature: float, top_p: float) -> tuple[str, int]:
        with self._lock:
            logits, h, c, prompt_len = self._warm(seed)
            out = []
            for _ in range(max_chars):
                if temperature <= 0.01:
                    idx = int(np.argmax(logits))
                else:
                    probs = _softmax(logits / temperature)
                    if 0.0 < top_p < 1.0:
                        order = np.argsort(probs)[::-1]
                        cumulative = np.cumsum(probs[order])
                        keep = order[:int(np.searchsorted(cumulative, top_p) + 1)]
                        mask = np.zeros_like(probs)
                        mask[keep] = probs[keep]
                        probs = mask / mask.sum()
                    idx = int(np.random.choice(len(probs), p=probs))
                out.append(self.vocab[idx])
                logits, h, c = self._step(idx, h, c)
            return ''.join(out), prompt_len


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.0'
    models: dict[str, CharLstm] = {}

    def log_message(self, fmt, *args):
        sys.stdout.write('%s  %s\n' % (time.strftime('%H:%M:%S'), fmt % args))
        sys.stdout.flush()

    # ---------- helpers ----------
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

    def _json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _error(self, status: int, message: str, code: str = 'invalid_request_error'):
        self._json(status, {'error': {'message': message, 'type': code}})

    def _read_json(self) -> dict:
        length = int(self.headers.get('Content-Length') or 0)
        raw = self.rfile.read(length) if length else b'{}'
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    def _pick_model(self, requested: str | None) -> CharLstm:
        if requested and requested in self.models:
            return self.models[requested]
        if requested:
            for name in self.models:
                if name.lower().endswith(requested.lower()):
                    return self.models[name]
        return max(self.models.values(), key=lambda m: m.vocab_size)

    @staticmethod
    def _last_user_text(messages) -> str:
        if not isinstance(messages, list):
            return ''
        for message in reversed(messages):
            if not isinstance(message, dict):
                continue
            if message.get('role') != 'user':
                continue
            content = message.get('content')
            if isinstance(content, str):
                return content
            if isinstance(content, list):
                parts = [part.get('text', '') for part in content if isinstance(part, dict)]
                return ''.join(parts)
        return ''

    # ---------- routes ----------
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header('Content-Length', '0')
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/health':
            self._json(200, {'ok': True, 'models': list(self.models)})
            return
        if path in ('/v1/models', '/models'):
            created = int(time.time())
            self._json(200, {
                'object': 'list',
                'data': [
                    {'id': name, 'object': 'model', 'created': created, 'owned_by': 'nyaumae'}
                    for name in sorted(self.models)
                ],
            })
            return
        self._error(404, f'未知路径 {path}')

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ('/v1/chat/completions', '/chat/completions'):
            self._error(404, f'未知路径 {path}')
            return
        payload = self._read_json()
        model = self._pick_model(payload.get('model'))
        seed = self._last_user_text(payload.get('messages')) or DEFAULT_SEED
        max_tokens = payload.get('max_tokens') or 200
        try:
            max_tokens = max(1, min(int(max_tokens), 512))
        except Exception:
            max_tokens = 200
        temperature = float(payload.get('temperature') or 0.8)
        top_p = float(payload.get('top_p') or 0.9)
        stream = bool(payload.get('stream'))
        completion_id = 'chatcmpl-' + uuid.uuid4().hex

        text, prompt_len = model.generate(seed, max_tokens, temperature, top_p)

        if not stream:
            self._json(200, {
                'id': completion_id,
                'object': 'chat.completion',
                'created': int(time.time()),
                'model': model.name,
                'choices': [{
                    'index': 0,
                    'message': {'role': 'assistant', 'content': text},
                    'finish_reason': 'stop',
                }],
                'usage': {
                    'prompt_tokens': prompt_len,
                    'completion_tokens': len(text),
                    'total_tokens': prompt_len + len(text),
                },
            })
            return

        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Accel-Buffering', 'no')
        self._cors()
        self.end_headers()

        def emit(delta: str, finish=None):
            chunk = {
                'id': completion_id,
                'object': 'chat.completion.chunk',
                'created': int(time.time()),
                'model': model.name,
                'choices': [{'index': 0, 'delta': delta, 'finish_reason': finish}],
            }
            self.wfile.write(('data: ' + json.dumps(chunk, ensure_ascii=False) + '\n\n').encode('utf-8'))
            self.wfile.flush()

        try:
            emit({'role': 'assistant', 'content': ''})
            batch = []
            for ch in text:
                batch.append(ch)
                if len(batch) >= 2:
                    emit({'content': ''.join(batch)})
                    batch = []
            if batch:
                emit({'content': ''.join(batch)})
            emit({}, 'stop')
            self.wfile.write(b'data: [DONE]\n\n')
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            return


def load_models(models_dir: str) -> dict[str, CharLstm]:
    if not os.path.isdir(models_dir):
        sys.exit(f'模型目录不存在：{models_dir}')
    found = {}
    for entry in sorted(os.listdir(models_dir)):
        if not entry.endswith('.npz'):
            continue
        path = os.path.join(models_dir, entry)
        model = CharLstm(path)
        found[model.name] = model
        print(f'已载入 {model.name}：词表 {model.vocab_size}，隐层 {model.hidden}，{os.path.getsize(path) / 1048576:.1f} MB')
    if not found:
        sys.exit(f'{models_dir} 里没有 .npz 权重，请先运行导出脚本。')
    return found


def main():
    parser = argparse.ArgumentParser(description='nyaumae-charlstm 的 OpenAI 兼容服务')
    parser.add_argument('--models-dir', default=os.path.join('public', 'models', 'nyaumae-charlstm'))
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()

    Handler.models = load_models(args.models_dir)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f'服务已启动：http://{args.host}:{args.port}/v1')
    print(f'模型：{", ".join(sorted(Handler.models))}')
    print('按 Ctrl+C 停止。')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止。')
    finally:
        server.server_close()


if __name__ == '__main__':
    main()

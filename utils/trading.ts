// ── Constants ───────────────────────────────────────────────────────
export const TIMEFRAMES = ['5min', '15min', '30min', '1h', '4h'] as const;
export type TF = typeof TIMEFRAMES[number];

export const TF_LABEL: Record<string, string> = {
  '5min': '5M',
  '15min': '15M',
  '30min': '30M',
  '1h': '1H',
  '4h': '4H',
};

export const API_KEYS = [
  'af83933c49b64422a4c88a1efa4c7cb4',
  '9cf2234751db4b5d9f85ffd675ba1e57',
  '6fd950cafc684803ab3bf20eafe79133',
  '7d5f90b345324348a209852f371ecaac',
  'be3604e5a0264ad388b0fad4764f05cf',
  '3d80acd7c3a94fd189846f1be02bfd6b',
  'd810102731a0449abab08ebf7a796a92',
  '63570e8b46774f4e9f3fe230bb1150c3',
  '8b884e6396a54072b0e4b328a7f89c19',
  'b2c8d498c4d045eba97fbfa8288ff62c',
];

export const ZZ_LOOKBACK = 5;
export const SELL_A1 = [1.5, 1.618];
export const SELL_A2 = [2.0, 2.236];
export const BUY_A1 = [-0.5, -0.618];
export const BUY_A2 = [-1.0, -1.236];

export const SL_SELL: Record<string, number> = {
  '1.5': 1.786,
  '1.618': 1.786,
  '2': 2.414,
  '2.236': 2.414,
};

export const SL_BUY: Record<string, number> = {
  '-0.5': -0.786,
  '-0.618': -0.786,
  '-1': -1.414,
  '-1.236': -1.414,
};

export const ALL_LV = [
  ...SELL_A1, ...SELL_A2, ...BUY_A1, ...BUY_A2,
  1.786, 2.414, -0.786, -1.414, 0.0, 0.5, 1.0,
];

export const TOUCH_TOL = 0.0003;

export const MIN_SWING: Record<string, number> = {
  '5min': 5.0,
  '15min': 8.0,
  '30min': 12.0,
  '1h': 18.0,
  '4h': 30.0,
};

export const UPD_INTVL_MS = 5 * 60 * 1000; // 5 minutes

// ── Fibo display rows ────────────────────────────────────────────────
export const FIBO_ROWS: Array<[number, string, string]> = [
  [2.414, '[SL.Sell2]', 'ff2222'],
  [2.236, '[1.Sel2] A', 'ff4444'],
  [2.0,   '[1.Sel2] B', 'ff4444'],
  [1.786, '[SL.Sell1]', 'ff2222'],
  [1.618, '[1.Sel1] A', 'ff6666'],
  [1.5,   '[1.Sel1] B', 'ff6666'],
  [1.0,   '[ ] HIGH  ', 'dddddd'],
  [0.5,   '[ ] MID   ', 'dddddd'],
  [0.0,   '[ ] LOW   ', 'dddddd'],
  [-0.5,  '[1.Buy1] A', '44dd88'],
  [-0.618,'[1.Buy1] B', '44dd88'],
  [-1.0,  '[1.Buy2] A', '33cc77'],
  [-1.236,'[1.Buy2] B', '33cc77'],
  [-0.786,'[SL.Buy1] ', '88ffaa'],
  [-1.414,'[SL.Buy2] ', '88ffaa'],
];

// ── Key manager ─────────────────────────────────────────────────────
let _keyIdx = 0;
let _badKeys = new Set<number>();

export function getCurrentKey(): string {
  return API_KEYS[_keyIdx];
}

export function rotateKey(): void {
  _badKeys.add(_keyIdx);
  for (let offset = 1; offset < API_KEYS.length; offset++) {
    const next = (_keyIdx + offset) % API_KEYS.length;
    if (!_badKeys.has(next)) {
      _keyIdx = next;
      return;
    }
  }
  // All bad — reset
  _badKeys.clear();
  _keyIdx = 0;
}

export function markKeyOk(): void {
  _badKeys.delete(_keyIdx);
}

// ── ZigZag ──────────────────────────────────────────────────────────
export type Swing = [number, number, 'H' | 'L'];

export function calcZigZag(highs: number[], lows: number[], lb = ZZ_LOOKBACK): Swing[] {
  const n = highs.length;
  const swings: Swing[] = [];
  let prev: 'H' | 'L' | null = null;

  for (let i = lb; i < n - lb; i++) {
    let isH = true;
    let isL = true;

    for (let j = 1; j <= lb; j++) {
      if (highs[i] < highs[i - j] || highs[i] < highs[i + j]) isH = false;
      if (lows[i] > lows[i - j] || lows[i] > lows[i + j]) isL = false;
    }

    if (isH && !isL && prev !== 'H') {
      swings.push([i, highs[i], 'H']);
      prev = 'H';
    } else if (isL && !isH && prev !== 'L') {
      swings.push([i, lows[i], 'L']);
      prev = 'L';
    }
  }

  return swings;
}

export function lastSwingHL(swings: Swing[]): [Swing | null, Swing | null] {
  let lh: Swing | null = null;
  let ll: Swing | null = null;

  for (let i = swings.length - 1; i >= 0; i--) {
    const s = swings[i];
    if (s[2] === 'H' && !lh) lh = s;
    if (s[2] === 'L' && !ll) ll = s;
    if (lh && ll) break;
  }

  return [lh, ll];
}

// ── Fibonacci ────────────────────────────────────────────────────────
export function fprice(level: number, high: number, low: number): number {
  return Math.round((low + level * (high - low)) * 1000) / 1000;
}

export function buildFiboLevels(high: number, low: number): Record<number, number> {
  const levels: Record<number, number> = {};
  for (const lv of ALL_LV) {
    levels[lv] = fprice(lv, high, low);
  }
  return levels;
}

// ── RSI-14 ──────────────────────────────────────────────────────────
export function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50.0;

  const deltas = closes.slice(1).map((c, i) => c - closes[i]);
  const last = deltas.slice(-period);
  let gains = 0;
  let losses = 0;

  for (const d of last) {
    if (d > 0) gains += d;
    else losses += -d;
  }

  const ag = gains / period;
  const al = losses / period;

  if (al === 0) return 100;
  return Math.round((100 - 100 / (1 + ag / al)) * 10) / 10;
}

// ── Signal detection ─────────────────────────────────────────────────
export interface OHLCData {
  times: string[];
  highs: number[];
  lows: number[];
  closes: number[];
}

export interface FiboData {
  high: number;
  low: number;
  highTime: string;
  lowTime: string;
  levels: Record<number, number>;
  updated: string;
}

export type SignalType = 'buy' | 'sell';
export type SignalStatus = 'WIN' | 'LOSS' | 'OPEN' | 'PENDING';

export interface Signal {
  id: string;
  ts: string;
  tf: string;
  type: SignalType;
  area: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  status: SignalStatus;
  pnl: number;
  beDone: boolean;
}

export interface NewSignalInfo {
  tf: string;
  tfRaw: string;
  type: SignalType;
  area: string;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
}

export function detectSignals(
  tf: string,
  fiboData: FiboData,
  price: number,
  alreadyTriggered: Set<string>,
): NewSignalInfo[] {
  const results: NewSignalInfo[] = [];
  const levels = fiboData.levels;
  const label = TF_LABEL[tf];

  const areas: Array<['sell', string, number[]]> = [
    ['sell', 'Area 1', SELL_A1],
    ['sell', 'Area 2', SELL_A2],
  ];
  const buyAreas: Array<['buy', string, number[]]> = [
    ['buy', 'Area 1', BUY_A1],
    ['buy', 'Area 2', BUY_A2],
  ];

  for (const [, areaName, lvs] of areas) {
    for (const lv of lvs) {
      const lvKey = `sell_${lv}`;
      if (alreadyTriggered.has(lvKey)) continue;
      const lvP = levels[lv];
      if (!lvP) continue;
      const tol = lvP * TOUCH_TOL;
      if (Math.abs(price - lvP) <= tol && price >= lvP - tol) {
        const slLv = SL_SELL[String(lv)];
        const sl = slLv !== undefined ? (levels[slLv] ?? lvP + 30) : lvP + 30;
        const tp1 = levels[0.5] ?? 0;
        const tp2 = levels[0.0] ?? 0;
        results.push({ tf: label, tfRaw: tf, type: 'sell', area: areaName, entry: lvP, sl, tp1, tp2 });
        alreadyTriggered.add(lvKey);
      }
    }
  }

  for (const [, areaName, lvs] of buyAreas) {
    for (const lv of lvs) {
      const lvKey = `buy_${lv}`;
      if (alreadyTriggered.has(lvKey)) continue;
      const lvP = levels[lv];
      if (!lvP) continue;
      const tol = Math.abs(lvP) * TOUCH_TOL;
      if (Math.abs(price - lvP) <= tol && price <= lvP + tol) {
        const slLv = SL_BUY[String(lv)];
        const sl = slLv !== undefined ? (levels[slLv] ?? lvP - 30) : lvP - 30;
        const tp1 = levels[0.5] ?? 0;
        const tp2 = levels[1.0] ?? 0;
        results.push({ tf: label, tfRaw: tf, type: 'buy', area: areaName, entry: lvP, sl, tp1, tp2 });
        alreadyTriggered.add(lvKey);
      }
    }
  }

  return results;
}

// ── Fetch OHLC ───────────────────────────────────────────────────────
export async function fetchOHLC(tf: string, limit = 300): Promise<OHLCData | null> {
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    try {
      const key = getCurrentKey();
      const url = `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=${tf}&outputsize=${limit}&apikey=${key}&format=JSON`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const d = await resp.json();

      if (d?.status === 'error') {
        const msg = (d.message ?? '').toLowerCase();
        if (msg.includes('limit') || msg.includes('quota') || msg.includes('credit') || resp.status === 429) {
          rotateKey();
          continue;
        }
        return null;
      }

      if (d?.status === 'ok' && Array.isArray(d?.values)) {
        markKeyOk();
        const vals = [...d.values].reverse();
        return {
          times: vals.map((v: Record<string, string>) => v.datetime),
          highs: vals.map((v: Record<string, string>) => parseFloat(v.high)),
          lows: vals.map((v: Record<string, string>) => parseFloat(v.low)),
          closes: vals.map((v: Record<string, string>) => parseFloat(v.close)),
        };
      }
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

export function nowStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

export function uptimeStr(start: Date): string {
  const diff = Date.now() - start.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

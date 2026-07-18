import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  AppState,
  AppStateStatus,
} from 'react-native';
import {
  TIMEFRAMES,
  TF_LABEL,
  MIN_SWING,
  UPD_INTVL_MS,
  API_KEYS,
  calcZigZag,
  lastSwingHL,
  buildFiboLevels,
  calcRSI,
  detectSignals,
  fetchOHLC,
  FiboData,
  Signal,
  SignalStatus,
  NewSignalInfo,
  nowStr,
  uptimeStr,
} from '@/utils/trading';

// ── Types ────────────────────────────────────────────────────────────
interface Stats {
  total: number;
  wins: number;
  losses: number;
  dailyPnl: number;
  maxDrawdown: number;
  peakPnl: number;
}

interface TradingState {
  price: number;
  prevPrice: number;
  wsConnected: boolean;
  rsi: Record<string, number>;
  fibo: Record<string, FiboData>;
  signals: Signal[];
  stats: Stats;
  log: string[];
  startTime: Date;
}

interface TradingContextValue extends TradingState {
  uptimeDisplay: string;
}

// ── Context ──────────────────────────────────────────────────────────
const TradingContext = createContext<TradingContextValue | null>(null);

export function useTradingContext(): TradingContextValue {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error('useTradingContext must be used within TradingProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────
export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TradingState>({
    price: 0,
    prevPrice: 0,
    wsConnected: false,
    rsi: {},
    fibo: {},
    signals: [],
    stats: { total: 0, wins: 0, losses: 0, dailyPnl: 0, maxDrawdown: 0, peakPnl: 0 },
    log: [],
    startTime: new Date(),
  });

  const [uptimeDisplay, setUptimeDisplay] = useState('00:00:00');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef<Record<string, Set<string>>>({});
  const priceRef = useRef(0);
  const signalsRef = useRef<Signal[]>([]);
  const statsRef = useRef<Stats>({ total: 0, wins: 0, losses: 0, dailyPnl: 0, maxDrawdown: 0, peakPnl: 0 });
  const fetchingRef = useRef(false);
  const startTimeRef = useRef(new Date());

  // ── Logging ──────────────────────────────────────────────────────
  const addLog = useCallback((msg: string) => {
    const entry = `[${new Date().toTimeString().slice(0, 8)}] ${msg}`;
    setState(prev => ({
      ...prev,
      log: [...prev.log.slice(-7), entry],
    }));
  }, []);

  // ── Signal detection ─────────────────────────────────────────────
  const checkSignalsForPrice = useCallback((price: number, fiboSnapshot: Record<string, FiboData>) => {
    const newSigs: Signal[] = [];

    for (const tf of TIMEFRAMES) {
      const fd = fiboSnapshot[tf];
      if (!fd) continue;

      if (!triggeredRef.current[tf]) triggeredRef.current[tf] = new Set();
      const triggered = triggeredRef.current[tf];

      const detected: NewSignalInfo[] = detectSignals(tf, fd, price, triggered);

      for (const info of detected) {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const sig: Signal = {
          id,
          ts: nowStr(),
          tf: info.tf,
          type: info.type,
          area: info.area,
          entry: info.entry,
          sl: info.sl,
          tp1: info.tp1,
          tp2: info.tp2,
          status: 'OPEN',
          pnl: 0,
          beDone: false,
        };
        newSigs.push(sig);
        addLog(`[${info.type.toUpperCase()}] ${info.tf} ${info.area} entry=${info.entry.toFixed(2)}`);
      }
    }

    if (newSigs.length > 0) {
      signalsRef.current = [...signalsRef.current, ...newSigs].slice(-50);
      statsRef.current = {
        ...statsRef.current,
        total: statsRef.current.total + newSigs.length,
      };
    }
  }, [addLog]);

  // ── Update signal statuses ───────────────────────────────────────
  const updateSignalStatuses = useCallback((price: number) => {
    if (signalsRef.current.length === 0) return;

    let changed = false;
    const updated = signalsRef.current.map(sig => {
      if (sig.status === 'WIN' || sig.status === 'LOSS') return sig;

      let newStatus: SignalStatus = sig.status;
      let newPnl = sig.pnl;
      let newBeDone = sig.beDone;

      if (sig.type === 'sell') {
        if (price <= sig.tp1 && !sig.beDone) {
          newStatus = 'WIN';
          newBeDone = true;
          newPnl = Math.abs(sig.entry - sig.tp1) * 100;
        } else if (price >= sig.sl) {
          newStatus = 'LOSS';
          newPnl = -Math.abs(sig.sl - sig.entry) * 100;
        } else {
          newStatus = 'OPEN';
          newPnl = (sig.entry - price) * 100;
        }
      } else {
        if (price >= sig.tp1 && !sig.beDone) {
          newStatus = 'WIN';
          newBeDone = true;
          newPnl = Math.abs(sig.tp1 - sig.entry) * 100;
        } else if (price <= sig.sl) {
          newStatus = 'LOSS';
          newPnl = -Math.abs(sig.entry - sig.sl) * 100;
        } else {
          newStatus = 'OPEN';
          newPnl = (price - sig.entry) * 100;
        }
      }

      if (newStatus !== sig.status || newPnl !== sig.pnl) {
        changed = true;
        return { ...sig, status: newStatus, pnl: newPnl, beDone: newBeDone };
      }
      return sig;
    });

    if (changed) {
      signalsRef.current = updated;

      // Recalculate stats
      const wins = updated.filter(s => s.status === 'WIN').length;
      const losses = updated.filter(s => s.status === 'LOSS').length;
      const dailyPnl = updated.reduce((sum, s) => sum + s.pnl, 0);
      const peak = Math.max(statsRef.current.peakPnl, dailyPnl);
      const dd = Math.max(statsRef.current.maxDrawdown, peak - dailyPnl);

      statsRef.current = {
        total: statsRef.current.total,
        wins,
        losses,
        dailyPnl,
        maxDrawdown: dd,
        peakPnl: peak,
      };
    }
  }, []);

  // ── Flush state from refs ────────────────────────────────────────
  const flushState = useCallback(() => {
    setState(prev => ({
      ...prev,
      signals: [...signalsRef.current],
      stats: { ...statsRef.current },
    }));
  }, []);

  // ── Fibo update ──────────────────────────────────────────────────
  const updateTF = useCallback(async (tf: string) => {
    const data = await fetchOHLC(tf);
    if (!data) {
      addLog(`[${TF_LABEL[tf]}] fetch failed`);
      return;
    }

    const swings = calcZigZag(data.highs, data.lows);
    if (swings.length < 2) {
      addLog(`[${TF_LABEL[tf]}] swing < 2`);
      return;
    }

    const [lh, ll] = lastSwingHL(swings);
    if (!lh || !ll) {
      addLog(`[${TF_LABEL[tf]}] no H/L`);
      return;
    }

    const hi = lh[1];
    const lo = ll[1];
    const minSw = MIN_SWING[tf] ?? 10;

    if (hi - lo < minSw) {
      addLog(`[${TF_LABEL[tf]}] swing ${(hi - lo).toFixed(2)} < min ${minSw}`);
      return;
    }

    const levels = buildFiboLevels(hi, lo);
    const rsiVal = calcRSI(data.closes);
    const updated = new Date().toTimeString().slice(0, 8);

    const newFiboData: FiboData = {
      high: hi,
      low: lo,
      highTime: data.times[lh[0]] ?? '',
      lowTime: data.times[ll[0]] ?? '',
      levels,
      updated,
    };

    setState(prev => {
      const oldFibo = prev.fibo[tf];
      const swingChanged = !oldFibo || oldFibo.high !== hi || oldFibo.low !== lo;
      if (swingChanged && triggeredRef.current[tf]) {
        triggeredRef.current[tf].clear();
      }

      return {
        ...prev,
        fibo: { ...prev.fibo, [tf]: newFiboData },
        rsi: { ...prev.rsi, [tf]: rsiVal },
      };
    });

    addLog(`[${TF_LABEL[tf]}] H=${hi.toFixed(2)} L=${lo.toFixed(2)} RSI=${rsiVal}`);
  }, [addLog]);

  // ── Fetch all TFs ────────────────────────────────────────────────
  const fetchAllTFs = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    for (const tf of TIMEFRAMES) {
      await updateTF(tf);
      await new Promise(r => setTimeout(r, 1500));
    }

    fetchingRef.current = false;
  }, [updateTF]);

  // ── WebSocket ────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const key = API_KEYS[0];
    const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${key}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe', params: { symbols: 'XAU/USD' } }));
      setState(prev => ({ ...prev, wsConnected: true }));
      addLog('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const d = JSON.parse(event.data as string);
        if (d.event === 'price' && d.symbol === 'XAU/USD') {
          const newPrice = parseFloat(d.price);
          if (!isNaN(newPrice) && newPrice > 0) {
            const prev = priceRef.current;
            priceRef.current = newPrice;

            setState(s => ({
              ...s,
              price: newPrice,
              prevPrice: prev || newPrice,
            }));

            // Check signals against current fibo snapshot
            setState(s => {
              checkSignalsForPrice(newPrice, s.fibo);
              updateSignalStatuses(newPrice);
              return {
                ...s,
                signals: [...signalsRef.current],
                stats: { ...statsRef.current },
              };
            });
          }
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onerror = () => {
      setState(prev => ({ ...prev, wsConnected: false }));
      addLog('[WS] Error — reconnecting...');
    };

    ws.onclose = () => {
      setState(prev => ({ ...prev, wsConnected: false }));
      addLog('[WS] Closed — reconnecting in 5s');
      reconnectTimer.current = setTimeout(connectWS, 5000);
    };
  }, [addLog, checkSignalsForPrice, updateSignalStatuses]);

  // ── Mount ────────────────────────────────────────────────────────
  useEffect(() => {
    connectWS();
    fetchAllTFs();

    const interval = setInterval(fetchAllTFs, UPD_INTVL_MS);
    const flushInterval = setInterval(flushState, 2000);
    const uptimeInterval = setInterval(() => {
      setUptimeDisplay(uptimeStr(startTimeRef.current));
    }, 1000);

    const handleAppState = (status: AppStateStatus) => {
      if (status === 'active') {
        connectWS();
        fetchAllTFs();
      } else if (status === 'background') {
        wsRef.current?.close();
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppState);

    return () => {
      clearInterval(interval);
      clearInterval(flushInterval);
      clearInterval(uptimeInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      appStateSub.remove();
    };
  }, [connectWS, fetchAllTFs, flushState]);

  return (
    <TradingContext.Provider value={{ ...state, uptimeDisplay }}>
      {children}
    </TradingContext.Provider>
  );
}

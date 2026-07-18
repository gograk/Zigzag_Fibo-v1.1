import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTradingContext } from '@/context/TradingContext';
import { TIMEFRAMES, TF_LABEL } from '@/utils/trading';

function RSIBar({ value, scale }: { value: number; scale: number }) {
  const fs = (n: number) => Math.round(n * scale);
  let color = '#ffffff';
  let label = '';
  if (value >= 70) { color = '#ff4444'; label = 'OB'; }
  else if (value <= 30) { color = '#44ccff'; label = 'OS'; }

  const pct = Math.min(Math.max(value / 100, 0), 1);

  return (
    <View style={styles.rsiBar}>
      <View style={[styles.rsiTrack, { height: 4 }]}>
        <View style={[styles.rsiFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.rsiVal, { fontSize: fs(14), color }]}>
        {value > 0 ? value.toFixed(0) : '—'}
      </Text>
      {label ? (
        <Text style={[styles.rsiLabel, { fontSize: fs(8), color }]}>{label}</Text>
      ) : null}
    </View>
  );
}

function StatRow({ label, value, valueColor, scale }: {
  label: string;
  value: string;
  valueColor?: string;
  scale: number;
}) {
  const fs = (n: number) => Math.round(n * scale);
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { fontSize: fs(12) }]}>{label}</Text>
      <Text style={[styles.statValue, { fontSize: fs(12), color: valueColor ?? '#fff' }]}>
        {value}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { price, prevPrice, wsConnected, rsi, signals, stats, log, uptimeDisplay } = useTradingContext();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = width / 390;
  const fs = (n: number) => Math.round(n * scale);

  const chg = price - (prevPrice || price);
  const chgColor = chg >= 0 ? '#00dd77' : '#ff4444';
  const chgSign = chg >= 0 ? '+' : '';

  const losses = signals.filter(s => s.status === 'LOSS').length;
  const winPct = stats.total > 0 ? `${Math.round(stats.wins / stats.total * 100)}%` : '—';
  const lossPct = stats.total > 0 ? `${Math.round(losses / stats.total * 100)}%` : '—';
  const pnlColor = stats.dailyPnl >= 0 ? '#00dd77' : '#ff4444';
  const pnlSign = stats.dailyPnl >= 0 ? '+' : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { fontSize: fs(13) }]}>ZIGZAG_FIBO BY GOGRAK</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.wsDot, { backgroundColor: wsConnected ? '#00cccc' : '#ff8800' }]} />
          <Text style={[styles.headerSub, { fontSize: fs(10), color: wsConnected ? '#00cccc' : '#ff8800' }]}>
            {wsConnected ? 'LIVE' : 'RECONNECT...'}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 90 }]}
      >
        {/* ── Price Card ─────────────────────────────────── */}
        <View style={styles.priceCard}>
          <Text style={[styles.priceSymbol, { fontSize: fs(13) }]}>XAUUSD</Text>
          <Text style={[styles.priceValue, { fontSize: fs(42) }]}>
            {price > 0 ? price.toLocaleString('en-US', { minimumFractionDigits: 3 }) : '—'}
          </Text>
          {price > 0 && (
            <View style={styles.priceChgRow}>
              <Feather
                name={chg >= 0 ? 'trending-up' : 'trending-down'}
                size={fs(14)}
                color={chgColor}
              />
              <Text style={[styles.priceChg, { fontSize: fs(14), color: chgColor }]}>
                {' '}{chgSign}{chg.toFixed(3)}
              </Text>
            </View>
          )}
        </View>

        {/* ── RSI Section ────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { fontSize: fs(11) }]}>RSI-14 per Timeframe</Text>
        <View style={styles.rsiCard}>
          {TIMEFRAMES.map(tf => (
            <View key={tf} style={styles.rsiCol}>
              <Text style={[styles.rsiTF, { fontSize: fs(10) }]}>{TF_LABEL[tf]}</Text>
              <RSIBar value={rsi[tf] ?? 0} scale={scale} />
            </View>
          ))}
        </View>

        {/* ── Stats Section ──────────────────────────────── */}
        <Text style={[styles.sectionTitle, { fontSize: fs(11) }]}>Statistik Sosial</Text>
        <View style={styles.statsCard}>
          <StatRow label="Total Sinyal" value={String(stats.total)} scale={scale} />
          <View style={styles.sep} />
          <StatRow
            label="Win (%)"
            value={`${stats.wins}  (${winPct})`}
            valueColor="#00dd77"
            scale={scale}
          />
          <View style={styles.sep} />
          <StatRow
            label="Loss (%)"
            value={`${losses}  (${lossPct})`}
            valueColor="#ff4444"
            scale={scale}
          />
          <View style={styles.sep} />
          <StatRow
            label="P&L Harian"
            value={`${pnlSign}${stats.dailyPnl.toFixed(2)}`}
            valueColor={pnlColor}
            scale={scale}
          />
          <View style={styles.sep} />
          <StatRow
            label="Max Drawdown"
            value={stats.maxDrawdown.toFixed(2)}
            valueColor="#aaa"
            scale={scale}
          />
          <View style={styles.sep} />
          <StatRow
            label="Uptime"
            value={uptimeDisplay}
            valueColor="#aaa"
            scale={scale}
          />
        </View>

        {/* ── Open Signals Summary ───────────────────────── */}
        {signals.filter(s => s.status === 'OPEN').length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { fontSize: fs(11) }]}>Posisi Terbuka</Text>
            <View style={styles.openCard}>
              {signals.filter(s => s.status === 'OPEN').slice(-3).map(sig => {
                const isBuy = sig.type === 'buy';
                const sideColor = isBuy ? '#00cc44' : '#cc2222';
                const pnlC = sig.pnl >= 0 ? '#00dd77' : '#ff4444';
                return (
                  <View key={sig.id} style={styles.openRow}>
                    <View style={[styles.openBadge, { backgroundColor: sideColor }]}>
                      <Text style={[styles.openBadgeText, { fontSize: fs(10) }]}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </Text>
                    </View>
                    <Text style={[styles.openTf, { fontSize: fs(11) }]}>{sig.tf}</Text>
                    <Text style={[styles.openEntry, { fontSize: fs(11) }]}>{sig.entry.toFixed(3)}</Text>
                    <Text style={[styles.openPnl, { fontSize: fs(11), color: pnlC }]}>
                      {sig.pnl >= 0 ? '+' : ''}{sig.pnl.toFixed(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── Activity Log ───────────────────────────────── */}
        <Text style={[styles.sectionTitle, { fontSize: fs(11) }]}>Log Aktivitas</Text>
        <View style={styles.logCard}>
          {log.length === 0 ? (
            <Text style={[styles.logEmpty, { fontSize: fs(11) }]}>Memuat data...</Text>
          ) : (
            log.slice(-8).map((line, i) => {
              const isError = line.includes('WS') || line.includes('failed') || line.includes('Error');
              return (
                <Text
                  key={i}
                  style={[
                    styles.logLine,
                    { fontSize: fs(10), color: isError ? '#ff8800' : '#6aad7a' },
                  ]}
                >
                  {line}
                </Text>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f1219',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2230',
  },
  headerLeft: {},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    color: '#ffd700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontFamily: 'Inter_600SemiBold',
  },
  wsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 12,
    gap: 0,
  },
  // Price Card
  priceCard: {
    backgroundColor: '#12151e',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  priceSymbol: {
    color: '#888',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
  },
  priceValue: {
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  priceChgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  priceChg: {
    fontFamily: 'Inter_600SemiBold',
  },
  // Section
  sectionTitle: {
    color: '#666',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  // RSI
  rsiCard: {
    backgroundColor: '#12151e',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    flexDirection: 'row',
    marginBottom: 12,
  },
  rsiCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  rsiTF: {
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  rsiBar: {
    alignItems: 'center',
    gap: 3,
    width: '100%',
  },
  rsiTrack: {
    backgroundColor: '#1e2230',
    borderRadius: 2,
    width: '80%',
    overflow: 'hidden',
  },
  rsiFill: {
    height: '100%',
    borderRadius: 2,
  },
  rsiVal: {
    fontFamily: 'Inter_700Bold',
  },
  rsiLabel: {
    fontFamily: 'Inter_400Regular',
  },
  // Stats
  statsCard: {
    backgroundColor: '#12151e',
    borderRadius: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  statLabel: {
    color: '#888',
    fontFamily: 'Inter_400Regular',
  },
  statValue: {
    fontFamily: 'Inter_600SemiBold',
  },
  sep: {
    height: 1,
    backgroundColor: '#1e2230',
    marginHorizontal: 16,
  },
  // Open positions
  openCard: {
    backgroundColor: '#12151e',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  openBadgeText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  openTf: {
    color: '#999',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  openEntry: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  openPnl: {
    fontFamily: 'Inter_700Bold',
    flex: 1,
    textAlign: 'right',
  },
  // Log
  logCard: {
    backgroundColor: '#12151e',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    marginBottom: 8,
  },
  logLine: {
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  logEmpty: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
  },
});

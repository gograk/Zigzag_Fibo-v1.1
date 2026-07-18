import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTradingContext } from '@/context/TradingContext';
import { Signal, SignalStatus } from '@/utils/trading';

type FilterType = 'ALL' | SignalStatus;
const FILTERS: FilterType[] = ['ALL', 'OPEN', 'WIN', 'LOSS', 'PENDING'];

const STATUS_CONFIG: Record<SignalStatus, { bg: string; text: string }> = {
  WIN:     { bg: '#00aa44', text: 'WIN'     },
  LOSS:    { bg: '#cc2222', text: 'LOSS'    },
  OPEN:    { bg: '#cc7700', text: 'OPEN'    },
  PENDING: { bg: '#2a2d3e', text: 'PENDING' },
};

function SignalCard({ sig, scale }: { sig: Signal; scale: number }) {
  const isBuy = sig.type === 'buy';
  const sideColor = isBuy ? '#00cc44' : '#cc2222';
  const stCfg = STATUS_CONFIG[sig.status];
  const pnlColor = sig.pnl >= 0 ? '#00dd77' : '#ff4444';
  const timeStr = sig.ts.split(' ')[1]?.slice(0, 5) ?? '';
  const fs = (n: number) => Math.round(n * scale);

  return (
    <View style={styles.card}>
      <View style={[styles.cardStrip, { backgroundColor: sideColor }]} />
      <View style={styles.cardBody}>
        {/* Row 1: badge + tf + time | status */}
        <View style={styles.cardRow}>
          <View style={[styles.badge, { backgroundColor: sideColor }]}>
            <Text style={[styles.badgeText, { fontSize: fs(11) }]}>
              {isBuy ? 'BUY' : 'SELL'}
            </Text>
          </View>
          <Text style={[styles.tfTime, { fontSize: fs(11) }]}>
            {sig.tf}  {timeStr}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: stCfg.bg }]}>
            <Text style={[styles.badgeText, { fontSize: fs(10) }]}>{stCfg.text}</Text>
          </View>
        </View>

        {/* Row 2: headers */}
        <View style={styles.cardRow}>
          {['Entry', 'TP', 'SL', 'PnL'].map(h => (
            <Text key={h} style={[styles.colHdr, { fontSize: fs(10) }]}>{h}</Text>
          ))}
        </View>

        {/* Row 3: values */}
        <View style={styles.cardRow}>
          <Text style={[styles.valText, { fontSize: fs(13) }]}>{sig.entry.toFixed(3)}</Text>
          <Text style={[styles.valText, { fontSize: fs(13), color: '#00cc55' }]}>{sig.tp1.toFixed(3)}</Text>
          <Text style={[styles.valText, { fontSize: fs(13), color: '#ff4444' }]}>{sig.sl.toFixed(3)}</Text>
          <Text style={[styles.valText, { fontSize: fs(13), color: pnlColor }]}>
            {sig.pnl >= 0 ? '+' : ''}{sig.pnl.toFixed(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SinyalScreen() {
  const { signals } = useTradingContext();
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = width / 390;
  const fs = (n: number) => Math.round(n * scale);

  const filtered = useMemo(() => {
    const recent = [...signals].reverse().slice(0, 50);
    if (activeFilter === 'ALL') return recent;
    return recent.filter(s => s.status === activeFilter);
  }, [signals, activeFilter]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fs(14) }]}>SINYAL TRADING</Text>
        <Text style={[styles.headerSub, { fontSize: fs(11) }]}>XAUUSD · ZigZag+Fibo</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, activeFilter === f && styles.pillActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.pillText,
              { fontSize: fs(11) },
              activeFilter === f && styles.pillTextActive,
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Feather name="list" size={fs(12)} color="#666" />
        <Text style={[styles.countText, { fontSize: fs(11) }]}>
          {filtered.length} sinyal
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <SignalCard sig={item} scale={scale} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        scrollEnabled={filtered.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={fs(36)} color="#333" />
            <Text style={[styles.emptyText, { fontSize: fs(14) }]}>Belum ada sinyal</Text>
            <Text style={[styles.emptySubText, { fontSize: fs(12) }]}>
              Sinyal muncul saat harga menyentuh level Fibonacci
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    color: '#ffd700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#555',
    fontFamily: 'Inter_400Regular',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#0f1219',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#1e2230',
  },
  pillActive: {
    backgroundColor: '#ffd700',
  },
  pillText: {
    color: '#999',
    fontFamily: 'Inter_600SemiBold',
  },
  pillTextActive: {
    color: '#0d0f14',
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  countText: {
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#12151e',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardStrip: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 10,
    gap: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  tfTime: {
    color: '#888',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  colHdr: {
    color: '#555',
    fontFamily: 'Inter_400Regular',
    flex: 1,
  },
  valText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: '#444',
    fontFamily: 'Inter_600SemiBold',
  },
  emptySubText: {
    color: '#333',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

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
import { TIMEFRAMES, TF_LABEL, FIBO_ROWS, FiboData } from '@/utils/trading';

type TFFilter = 'ALL' | '5M' | '15M' | '30M' | '1H' | '4H';
const TF_FILTERS: TFFilter[] = ['ALL', '5M', '15M', '30M', '1H', '4H'];

function FiboCard({
  tf,
  data,
  rsiVal,
  price,
  scale,
}: {
  tf: string;
  data: FiboData;
  rsiVal: number;
  price: number;
  scale: number;
}) {
  const label = TF_LABEL[tf];
  const fs = (n: number) => Math.round(n * scale);

  // Determine trend arrow from highTime vs lowTime
  const bearish = data.highTime > data.lowTime;
  const arrowColor = bearish ? '#ff5555' : '#44dd88';
  const arrowIcon: 'trending-down' | 'trending-up' = bearish ? 'trending-down' : 'trending-up';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={styles.zzBadge}>
          <Feather name={arrowIcon} size={fs(12)} color={arrowColor} />
          <Text style={[styles.zzLabel, { fontSize: fs(11), color: arrowColor }]}>
            {' '}ZZ {label}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Text style={[styles.hlText, { fontSize: fs(10) }]}>
            <Text style={{ color: '#ff8888' }}>H:{data.high.toFixed(3)}</Text>
            {'  '}
            <Text style={{ color: '#88dd88' }}>L:{data.low.toFixed(3)}</Text>
          </Text>
          <Text style={[styles.rsiText, { fontSize: fs(10) }]}>
            RSI {rsiVal.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Separator */}
      <View style={styles.sep} />

      {/* Level rows */}
      {FIBO_ROWS.map(([level, name, colorHex]) => {
        const val = data.levels[level];
        if (val === undefined) return null;
        const near = price > 0 && Math.abs(price - val) < 2.0;
        const color = `#${colorHex}`;

        return (
          <View key={level} style={styles.levelRow}>
            <Text style={[styles.levelName, { fontSize: fs(11), color }]}>{name}</Text>
            <View style={styles.levelRight}>
              <Text style={[styles.levelVal, { fontSize: fs(11), color }]}>
                {val.toFixed(3)}
              </Text>
              {near && (
                <View style={styles.nearDot}>
                  <Feather name="chevron-left" size={fs(10)} color="#ffff44" />
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* Updated */}
      <View style={styles.updRow}>
        <Feather name="clock" size={fs(9)} color="#444" />
        <Text style={[styles.updText, { fontSize: fs(9) }]}>  Upd: {data.updated}</Text>
      </View>
    </View>
  );
}

export default function FiboScreen() {
  const { fibo, rsi, price } = useTradingContext();
  const [activeTF, setActiveTF] = useState<TFFilter>('ALL');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = width / 390;
  const fs = (n: number) => Math.round(n * scale);

  const visibleTFs = useMemo(() => {
    if (activeTF === 'ALL') return TIMEFRAMES.filter(tf => fibo[tf]);
    const rawMap: Record<string, string> = { '5M': '5min', '15M': '15min', '30M': '30min', '1H': '1h', '4H': '4h' };
    const raw = rawMap[activeTF];
    return raw && fibo[raw] ? [raw] : [];
  }, [activeTF, fibo]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontSize: fs(14) }]}>FIBO ZIGZAG</Text>
        <Text style={[styles.headerSub, { fontSize: fs(11) }]}>XAUUSD · HIGH→LOW</Text>
      </View>

      {/* TF Filter */}
      <View style={styles.filterRow}>
        {TF_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.pill, activeTF === f && styles.pillActive]}
            onPress={() => setActiveTF(f)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.pillText,
              { fontSize: fs(11) },
              activeTF === f && styles.pillTextActive,
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Cards */}
      <FlatList
        data={visibleTFs}
        keyExtractor={tf => tf}
        renderItem={({ item: tf }) => (
          <FiboCard
            tf={tf}
            data={fibo[tf]!}
            rsiVal={rsi[tf] ?? 0}
            price={price}
            scale={scale}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        scrollEnabled={visibleTFs.length > 0}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="loader" size={fs(36)} color="#333" />
            <Text style={[styles.emptyText, { fontSize: fs(14) }]}>Memuat data Fibonacci...</Text>
            <Text style={[styles.emptySubText, { fontSize: fs(12) }]}>
              Data diambil dari TwelveData setiap 5 menit
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
    flexWrap: 'wrap',
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
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#12151e',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    paddingBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingBottom: 8,
  },
  zzBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181b26',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zzLabel: {
    fontFamily: 'Inter_700Bold',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  hlText: {
    fontFamily: 'Inter_400Regular',
  },
  rsiText: {
    color: '#666',
    fontFamily: 'Inter_400Regular',
  },
  sep: {
    height: 1,
    backgroundColor: '#1e2230',
    marginHorizontal: 10,
    marginBottom: 4,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  levelName: {
    fontFamily: 'Inter_400Regular',
    width: 100,
  },
  levelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelVal: {
    fontFamily: 'Inter_700Bold',
  },
  nearDot: {
    marginLeft: 2,
  },
  updRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  updText: {
    color: '#444',
    fontFamily: 'Inter_400Regular',
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

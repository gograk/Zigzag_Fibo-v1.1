import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sinyal">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Sinyal</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fibo">
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
        <Label>Fibo</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';

  const GOLD = '#ffd700';
  const DIM = '#555555';
  const BG = '#0f1219';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: GOLD,
        tabBarInactiveTintColor: DIM,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : BG,
          borderTopWidth: 1,
          borderTopColor: '#1e2230',
          elevation: 0,
          height: isWeb ? 84 : 62,
          paddingBottom: isWeb ? 34 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Feather name="grid" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sinyal"
        options={{
          title: 'Sinyal',
          tabBarIcon: ({ color, size }) => (
            <Feather name="bar-chart-2" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="fibo"
        options={{
          title: 'Fibo',
          tabBarIcon: ({ color, size }) => (
            <Feather name="trending-up" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

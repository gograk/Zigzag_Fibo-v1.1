import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';

const GOLD = '#ffd700';
const DIM = '#555555';
const BG = '#0f1219';

export default function TabLayout() {
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

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
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]} />
          ),
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

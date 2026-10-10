import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../src/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          ...typography.overline,
          fontSize: 10,
          letterSpacing: 0.8,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'LIVE MAP',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'CIRCLES',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="options-outline" size={size - 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { colors } from '../src/theme';
import { useAuthStore } from '../src/store/authStore';
import { startTracking, stopTracking } from '../src/location/tracker';
import { useLocationStore } from '../src/store/locationStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const { initAuth, isAuthenticated, setPushToken } = useAuthStore();
  const isSharingLocation = useLocationStore((s) => s.isSharingLocation);

  useEffect(() => {
    // Initialize session from SecureStore
    initAuth();
  }, []);

  // Set up Push Notifications registration
  useEffect(() => {
    async function setupNotifications() {
      if (Platform.OS === 'web') return;

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'LiveCircle Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: colors.cobalt,
          }).catch(() => {});
        }

        if (finalStatus === 'granted') {
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync();
            if (tokenData?.data) {
              console.log('[Push Token Obtained]:', tokenData.data);
              await setPushToken(tokenData.data);
            }
          } catch (tokenErr: any) {
            console.log('[Push Notifications]: Dev mode active. Remote push token requires EAS / Firebase configuration.');
          }
        }
      } catch (err: any) {
        console.log('[Notification Setup Note]:', err?.message || err);
      }
    }

    if (isAuthenticated) {
      setupNotifications();
    }
  }, [isAuthenticated]);

  // Handle location tracking lifecycle based on auth & sharing toggle
  useEffect(() => {
    if (isAuthenticated && isSharingLocation) {
      startTracking().catch((err) => {
        console.warn('[RootLayout] Tracking startup error:', err);
      });
    } else {
      stopTracking().catch((err) => {
        console.warn('[RootLayout] Tracking stop error:', err);
      });
    }

    return () => {
      // Cleanup on unmount
      stopTracking().catch(() => {});
    };
  }, [isAuthenticated, isSharingLocation]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="group/[id]" />
      </Stack>
    </>
  );
}

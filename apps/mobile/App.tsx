/**
 * Horus Mobile App - Main Entry Point
 * Sprint 1 - Authentication System
 * Sprint 2 - React Native/Expo Configuration
 * Sprint 5 - US-041: Improved Dashboard
 * Sprint 6 - US-052: Habit Audit Screen
 * Sprint 6 - US-055: Local Notifications System with Deep Linking
 * Sprint 12 - US-115: Monitoring y Logging
 */

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  setupNotificationCategories,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from './src/services/NotificationService';
import { initSentry } from './src/lib/sentry';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { TabNavigator } from './src/navigation/TabNavigator';

// Initialize Sentry first (US-115)
initSentry();

// Navigation Component (rendered inside AuthProvider)
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return isAuthenticated ? <TabNavigator /> : <AuthNavigator />;
};

// React Query configuration - US-045
// Sprint 12 - US-108: Optimized cache settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - increased for better performance
      gcTime: 1000 * 60 * 60, // 60 minutes - keep data in cache longer
      retry: 2, // Reduced to 2 retry attempts
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary network calls
      refetchOnReconnect: true, // Refetch on network reconnection
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      // Performance optimizations (US-108)
      networkMode: 'online', // Only run queries when online
      notifyOnChangeProps: 'all', // Optimize re-renders
    },
    mutations: {
      // Mutation optimizations
      retry: 1, // Only 1 retry for mutations
      networkMode: 'online',
    },
  },
});

export default function App() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // US-055: Setup notification categories and listeners
  useEffect(() => {
    // Setup Android notification channels
    setupNotificationCategories();

    // Handle notification taps (deep linking) - US-055
    const subscription = addNotificationResponseReceivedListener((response) => {
      const habitId = response.notification.request.content.data?.habitId as string | undefined;

      if (habitId && navigationRef.current) {
        // Navigate to HabitDetail screen when notification is tapped
        // Note: This will need to be updated to work with Tab Navigator structure
        navigationRef.current.navigate('HabitsTab', {
          screen: 'HabitDetail',
          params: { habitId },
        });
      }
    });

    // Handle initial notification (app opened from killed state)
    getLastNotificationResponse().then((response) => {
      if (response) {
        const habitId = response.notification.request.content.data?.habitId as string | undefined;

        if (habitId && navigationRef.current) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            navigationRef.current?.navigate('HabitsTab', {
              screen: 'HabitDetail',
              params: { habitId },
            });
          }, 1000);
        }
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer ref={navigationRef}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
});

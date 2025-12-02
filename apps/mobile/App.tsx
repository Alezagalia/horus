/**
 * Horus Mobile App - Main Entry Point
 * Sprint 2 - React Native/Expo Configuration
 * Sprint 5 - US-041: Improved Dashboard
 * Sprint 6 - US-052: Habit Audit Screen
 * Sprint 6 - US-055: Local Notifications System with Deep Linking
 * Sprint 12 - US-115: Monitoring y Logging
 */

import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import type { NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  setupNotificationCategories,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from './src/services/NotificationService';
import { initSentry } from './src/lib/sentry';

// Initialize Sentry first (US-115)
initSentry();

// Import screens
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { HabitsListScreenWrapper } from './src/screens/HabitsListScreenWrapper';
import { HabitFormScreenWrapper } from './src/screens/HabitFormScreenWrapper';
import { HabitDetailScreenWrapper } from './src/screens/HabitDetailScreenWrapper';
import { HomeScreen } from './src/screens/HomeScreen';
import { HabitStatsScreen } from './src/screens/HabitStatsScreen';
import { HabitAuditScreenWrapper } from './src/screens/HabitAuditScreenWrapper';
// Fitness screens - Sprint 14
import { ExercisesScreen } from './src/screens/ExercisesScreen';
import { RoutinesScreen } from './src/screens/RoutinesScreen';
import { RoutineDetailScreen } from './src/screens/RoutineDetailScreen';
import { RoutineFormScreen } from './src/screens/RoutineFormScreen';
import { ExecuteRoutineScreen } from './src/screens/ExecuteRoutineScreen';
import { WorkoutHistoryScreen } from './src/screens/WorkoutHistoryScreen';
import { WorkoutDetailScreen } from './src/screens/WorkoutDetailScreen';
import { StatsScreen } from './src/screens/StatsScreen';

// Navigation types
type RootStackParamList = {
  Home: undefined;
  Categories: undefined;
  HabitsList: undefined;
  HabitForm: { habitId?: string };
  HabitDetail: { habitId: string };
  HabitStats: { habitId: string };
  HabitAudit: { habitId: string };
  // Fitness routes - Sprint 14
  Exercises: undefined;
  Routines: undefined;
  RoutineDetail: { routineId: string };
  RoutineForm: { routineId?: string };
  ExecuteRoutine: { routineId: string };
  WorkoutHistory: undefined;
  WorkoutDetail: { workoutId: string };
  Stats: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // US-055: Setup notification categories and listeners
  useEffect(() => {
    // Setup Android notification channels
    setupNotificationCategories();

    // Handle notification taps (deep linking) - US-055
    const subscription = addNotificationResponseReceivedListener((response) => {
      const habitId = response.notification.request.content.data?.habitId as string | undefined;

      if (habitId && navigationRef.current) {
        // Navigate to HabitDetail screen when notification is tapped
        navigationRef.current.navigate('HabitDetail', { habitId });
      } else if (navigationRef.current) {
        // Navigate to HabitsList if no habitId
        navigationRef.current.navigate('HabitsList');
      }
    });

    // Handle initial notification (app opened from killed state)
    getLastNotificationResponse().then((response) => {
      if (response) {
        const habitId = response.notification.request.content.data?.habitId as string | undefined;

        if (habitId && navigationRef.current) {
          // Small delay to ensure navigation is ready
          setTimeout(() => {
            navigationRef.current?.navigate('HabitDetail', { habitId });
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
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Horus' }} />
            <Stack.Screen
              name="Categories"
              component={CategoriesScreen}
              options={{ title: 'Categorías' }}
            />
            <Stack.Screen
              name="HabitsList"
              component={HabitsListScreenWrapper}
              options={{ title: 'Mis Hábitos' }}
            />
            <Stack.Screen
              name="HabitForm"
              component={HabitFormScreenWrapper}
              options={{ title: 'Hábito', presentation: 'modal' }}
            />
            <Stack.Screen
              name="HabitDetail"
              component={HabitDetailScreenWrapper}
              options={{ title: 'Detalle del Hábito' }}
            />
            <Stack.Screen
              name="HabitStats"
              component={HabitStatsScreen}
              options={{ title: 'Estadísticas del Hábito' }}
            />
            <Stack.Screen
              name="HabitAudit"
              component={HabitAuditScreenWrapper}
              options={{ title: 'Historial de Cambios' }}
            />
            {/* Fitness Routes - Sprint 14 */}
            <Stack.Screen
              name="Exercises"
              component={ExercisesScreen}
              options={{ title: 'Ejercicios' }}
            />
            <Stack.Screen
              name="Routines"
              component={RoutinesScreen}
              options={{ title: 'Rutinas' }}
            />
            <Stack.Screen
              name="RoutineDetail"
              component={RoutineDetailScreen}
              options={{ title: 'Detalle de Rutina' }}
            />
            <Stack.Screen
              name="RoutineForm"
              component={RoutineFormScreen}
              options={{ title: 'Crear/Editar Rutina', presentation: 'modal' }}
            />
            <Stack.Screen
              name="ExecuteRoutine"
              component={ExecuteRoutineScreen}
              options={{ title: 'Entrenar', headerShown: false }}
            />
            <Stack.Screen
              name="WorkoutHistory"
              component={WorkoutHistoryScreen}
              options={{ title: 'Historial de Entrenamientos' }}
            />
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={{ title: 'Detalle del Entrenamiento' }}
            />
            <Stack.Screen
              name="Stats"
              component={StatsScreen}
              options={{ title: 'Estadísticas' }}
            />
          </Stack.Navigator>
          <StatusBar style="auto" />
        </NavigationContainer>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

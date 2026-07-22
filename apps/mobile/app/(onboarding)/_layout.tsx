import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';
import { Colors } from '@/tokens';

export default function OnboardingLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { needsOnboarding, ready } = useNeedsOnboarding();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    // Deep-link accidental o wizard ya completado → a la app.
    if (!needsOnboarding) {
      router.replace('/(tabs)');
    }
  }, [ready, isAuthenticated, needsOnboarding]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.vivid} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="intereses" />
      <Stack.Screen name="primer-habito" />
      <Stack.Screen name="primera-cuenta" />
      <Stack.Screen name="notificaciones" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.bgTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

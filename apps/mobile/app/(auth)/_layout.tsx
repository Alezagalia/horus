import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';

export default function AuthLayout() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { needsOnboarding, ready } = useNeedsOnboarding();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (ready && isAuthenticated) {
      router.replace(needsOnboarding ? '/(onboarding)/intereses' : '/(tabs)');
    }
  }, [isAuthenticated, ready, needsOnboarding]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

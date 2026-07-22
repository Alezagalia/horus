import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Tabs, router, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Colors } from '@/tokens';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';

const TAB_ROUTES = ['/', '/foco', '/dinero', '/cuerpo', '/yo'];

export default function TabsLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const pathname = usePathname();
  const { needsOnboarding, ready } = useNeedsOnboarding();
  usePushNotifications(isAuthenticated);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
      return;
    }
    if (ready && isAuthenticated && needsOnboarding) {
      router.replace('/(onboarding)/intereses');
    }
  }, [isAuthenticated, isLoading, ready, needsOnboarding]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.vivid} />
      </View>
    );
  }

  const activeIndex = Math.max(TAB_ROUTES.indexOf(pathname), 0);

  return (
    <View style={styles.root}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="foco" />
        <Tabs.Screen name="dinero" />
        <Tabs.Screen name="cuerpo" />
        <Tabs.Screen name="yo" />
      </Tabs>
      {/* Renderizado DESPUÉS de Tabs → z-order superior, recibe todos los toques */}
      <BottomTabBar activeIndex={activeIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    backgroundColor: Colors.bgTop,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

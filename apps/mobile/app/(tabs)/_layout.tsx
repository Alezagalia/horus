import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Colors } from '@/tokens';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function TabsLayout() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  usePushNotifications(isAuthenticated);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => {
        const index = props.state.index;
        return <BottomTabBar activeIndex={index} />;
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="foco" />
      <Tabs.Screen name="dinero" />
      <Tabs.Screen name="cuerpo" />
      <Tabs.Screen name="yo" />
    </Tabs>
  );
}

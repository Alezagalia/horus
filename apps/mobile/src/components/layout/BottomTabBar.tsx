import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Home, CheckSquare, Wallet, Dumbbell, User, Plus, X } from 'lucide-react-native';
import { Colors, Typography, Radius, Layout, Shadows, Spacing } from '@/tokens';

const TABS = [
  { name: 'Hoy', route: '/(tabs)/', Icon: Home },
  { name: 'Foco', route: '/(tabs)/foco', Icon: CheckSquare },
  { name: 'Dinero', route: '/(tabs)/dinero', Icon: Wallet },
  { name: 'Cuerpo', route: '/(tabs)/cuerpo', Icon: Dumbbell },
  { name: 'Yo', route: '/(tabs)/yo', Icon: User },
] as const;

const FAB_ACTIONS = [
  { label: 'Nueva tarea', emoji: '✅', route: '/(tabs)/foco' },
  { label: 'Marcar hábito', emoji: '🎯', route: '/(tabs)/foco' },
  { label: 'Registrar movimiento', emoji: '💸', route: '/(tabs)/dinero' },
  { label: 'Nota rápida', emoji: '📝', route: '/recursos' },
  { label: 'Iniciar entrenamiento', emoji: '💪', route: '/(tabs)/cuerpo' },
] as const;

interface Props {
  activeIndex: number;
}

export function BottomTabBar({ activeIndex }: Props) {
  const [fabOpen, setFabOpen] = useState(false);
  const fabScale = useRef(new Animated.Value(1)).current;
  const sheetY = useRef(new Animated.Value(300)).current;

  const openFAB = () => {
    setFabOpen(true);
    Animated.parallel([
      Animated.spring(fabScale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(sheetY, { toValue: 0, tension: 300, friction: 28, useNativeDriver: true }),
    ]).start();
  };

  const closeFAB = () => {
    Animated.parallel([
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(sheetY, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => setFabOpen(false));
  };

  return (
    <>
      {/* FAB bottom sheet modal */}
      <Modal visible={fabOpen} transparent animationType="none" onRequestClose={closeFAB}>
        <Pressable style={styles.overlay} onPress={closeFAB} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, Typography.bodyStrong]}>Acción rápida</Text>
          {FAB_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.sheetAction}
              onPress={() => {
                closeFAB();
                router.push(action.route as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetEmoji}>{action.emoji}</Text>
              <Text style={[styles.sheetLabel, Typography.body]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Modal>

      {/* Wrapper: no captura toques propios, solo los hijos lo hacen */}
      <View style={styles.wrapper} pointerEvents="box-none">
        {/* Botón + flotante — pointerEvents="box-none" en el contenedor
            para que los toques pasen a las tabs debajo */}
        <View style={styles.fabContainer} pointerEvents="box-none">
          <Animated.View style={{ transform: [{ scale: fabScale }] }}>
            <TouchableOpacity
              style={styles.fab}
              onPress={fabOpen ? closeFAB : openFAB}
              activeOpacity={0.85}
            >
              {fabOpen ? (
                <X size={18} color="#fff" strokeWidth={2.5} />
              ) : (
                <Plus size={18} color="#fff" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Tab bar con las 5 tabs */}
        <BlurView intensity={70} tint="light" style={styles.bar}>
          {TABS.map((tab, i) => {
            const active = activeIndex === i;
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => router.push(tab.route as any)}
                activeOpacity={0.7}
              >
                <tab.Icon
                  size={20}
                  color={active ? Colors.vivid : Colors.muted}
                  strokeWidth={active ? 2.2 : 1.7}
                />
                <Text style={[styles.tabLabel, { color: active ? Colors.vivid : Colors.muted }]}>
                  {tab.name}
                </Text>
                {active && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Layout.tabBarOffset,
    left: Layout.tabBarSide,
    right: Layout.tabBarSide,
  },

  /* Tab bar */
  bar: {
    height: Layout.tabBarHeight,
    borderRadius: Radius.nav,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    ...Shadows.nav,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: 3,
  },
  tabLabel: {
    fontFamily: 'Inter_500Medium',
    ...Typography.tabLabel,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.vivid,
  },

  /* FAB flotante — pequeño, arriba-derecha del tab bar */
  fabContainer: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Layout.tabBarHeight + Spacing.sm,
    zIndex: 10,
    elevation: 25,
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },

  /* Bottom sheet */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 31, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingTop: 12,
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 40,
    ...Shadows.nav,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: Colors.muted,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sheetEmoji: { fontSize: 22 },
  sheetLabel: { color: Colors.ink, fontFamily: 'Inter_500Medium' },
});

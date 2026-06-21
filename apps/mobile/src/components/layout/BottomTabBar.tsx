import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Home, CheckSquare, Wallet, Dumbbell, Plus, X } from 'lucide-react-native';
import { Colors, Typography, Radius, Layout, Shadows, Spacing } from '@/tokens';

// "Yo" se removió de la barra: ahora se accede tocando el avatar del dashboard.
// El 5º lugar lo ocupa el botón "+" de acciones rápidas (antes flotante).
const TABS = [
  { name: 'Hoy', route: '/(tabs)/', Icon: Home },
  { name: 'Foco', route: '/(tabs)/foco', Icon: CheckSquare },
  { name: 'Dinero', route: '/(tabs)/dinero', Icon: Wallet },
  { name: 'Cuerpo', route: '/(tabs)/cuerpo', Icon: Dumbbell },
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
  const sheetY = useRef(new Animated.Value(300)).current;

  const openFAB = () => {
    setFabOpen(true);
    Animated.spring(sheetY, {
      toValue: 0,
      tension: 300,
      friction: 28,
      useNativeDriver: true,
    }).start();
  };

  const closeFAB = () => {
    Animated.timing(sheetY, { toValue: 300, duration: 200, useNativeDriver: true }).start(() =>
      setFabOpen(false)
    );
  };

  const renderTab = (tab: (typeof TABS)[number], index: number) => {
    const active = activeIndex === index;
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
        {/* Tab bar — orden: Hoy, Foco, [+], Dinero, Cuerpo */}
        <BlurView intensity={70} tint="light" style={styles.bar}>
          {renderTab(TABS[0], 0)}
          {renderTab(TABS[1], 1)}

          {/* Acción rápida (+) — al medio de las 5 opciones */}
          <TouchableOpacity
            style={styles.tabItem}
            onPress={fabOpen ? closeFAB : openFAB}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Acción rápida"
          >
            <View style={styles.plusCircle}>
              {fabOpen ? (
                <X size={18} color="#fff" strokeWidth={2.5} />
              ) : (
                <Plus size={18} color="#fff" strokeWidth={2.5} />
              )}
            </View>
          </TouchableOpacity>

          {renderTab(TABS[2], 2)}
          {renderTab(TABS[3], 3)}
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

  /* Botón "+" de acciones rápidas, inline en el 5º lugar de la barra */
  plusCircle: {
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

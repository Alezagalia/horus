import { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Typography } from '@/tokens';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

export const TOTAL_STEPS = 4;

/**
 * Marca el onboarding como completado y entra a la app. Lo usan tanto el
 * último paso como el "Saltar" global: saltar y completar setean el mismo
 * flag — el wizard nunca puede atrapar al usuario.
 */
export function useFinishOnboarding(): () => Promise<void> {
  const user = useAuthStore((s) => s.user);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  return async () => {
    if (user) await markCompleted(user.id);
    router.replace('/(tabs)');
  };
}

interface Props {
  step: number; // 1-based
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Zona fija al pie (CTAs). El contenido scrollea arriba. */
  footer?: ReactNode;
}

export function OnboardingScaffold({ step, title, subtitle, children, footer }: Props) {
  const finishOnboarding = useFinishOnboarding();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={() => void finishOnboarding()} hitSlop={12}>
          <Text style={styles.skip}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {children}
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgTop,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
    paddingHorizontal: Spacing.screenX,
    marginBottom: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.ceilLight,
  },
  dotActive: {
    backgroundColor: Colors.vivid,
  },
  skip: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing['3xl'],
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: Typography.displaySm.fontSize,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
    marginBottom: Spacing.xl,
  },
  footer: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 32,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});

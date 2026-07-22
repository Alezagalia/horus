import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  OnboardingScaffold,
  useFinishOnboarding,
} from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { requestPermissions } from '@/services/push/pushService';
import { registerPushToken } from '@/hooks/usePushNotifications';
import { Colors, Spacing, Radius } from '@/tokens';

const BENEFITS = [
  { emoji: '🎯', text: 'Recordatorios de tus hábitos a la hora que elijas' },
  { emoji: '📅', text: 'Avisos antes de tus eventos y vencimientos' },
  { emoji: '🌅', text: 'Un resumen de tu día cada mañana' },
];

export default function OnboardingNotifications() {
  const finishOnboarding = useFinishOnboarding();
  const [busy, setBusy] = useState(false);

  const handleEnable = async () => {
    setBusy(true);
    try {
      // Recién acá se muestra el prompt nativo del sistema — con contexto.
      const granted = await requestPermissions();
      if (granted) await registerPushToken();
    } finally {
      setBusy(false);
      await finishOnboarding();
    }
  };

  return (
    <OnboardingScaffold
      step={4}
      title="Que Horus te acompañe 🔔"
      subtitle="Los recordatorios son la diferencia entre querer un hábito y tenerlo."
      footer={
        <>
          <Button
            label="Activar recordatorios"
            onPress={() => void handleEnable()}
            loading={busy}
            disabled={busy}
          />
          <Button
            label="Ahora no"
            variant="ghost"
            onPress={() => void finishOnboarding()}
            disabled={busy}
          />
        </>
      }
    >
      <View style={styles.list}>
        {BENEFITS.map((b) => (
          <View key={b.emoji} style={styles.row}>
            <Text style={styles.emoji}>{b.emoji}</Text>
            <Text style={styles.text}>{b.text}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>Podés cambiarlo cuando quieras desde los ajustes del sistema.</Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  emoji: {
    fontSize: 22,
  },
  text: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.ink,
  },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
});

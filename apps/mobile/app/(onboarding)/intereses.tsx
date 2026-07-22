import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius } from '@/tokens';

const INTERESTS = [
  {
    key: 'habitos',
    emoji: '🎯',
    label: 'Construir hábitos',
    sub: 'Rachas, recordatorios y progreso',
  },
  {
    key: 'tareas',
    emoji: '✅',
    label: 'Organizar mis tareas',
    sub: 'Pendientes, prioridades y metas',
  },
  {
    key: 'finanzas',
    emoji: '💰',
    label: 'Ordenar mis finanzas',
    sub: 'Gastos, cuentas y presupuestos',
  },
  {
    key: 'entrenar',
    emoji: '💪',
    label: 'Entrenar mejor',
    sub: 'Rutinas, registros y estadísticas',
  },
];

export default function OnboardingInterests() {
  const firstName = useAuthStore((s) => s.user?.name?.split(' ')[0] ?? '');
  const setInterests = useOnboardingStore((s) => s.setInterests);
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (key: string) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const handleContinue = () => {
    setInterests(selected);
    router.push('/(onboarding)/primer-habito');
  };

  return (
    <OnboardingScaffold
      step={1}
      title={firstName ? `¡Hola, ${firstName}! 👋` : '¡Bienvenido a Horus! 👋'}
      subtitle="¿Qué querés lograr? Elegí todo lo que te interese — así te preparamos la app."
      footer={
        <Button label="Continuar" onPress={handleContinue} disabled={selected.length === 0} />
      }
    >
      <View style={styles.list}>
        {INTERESTS.map((item) => {
          const active = selected.includes(item.key);
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.card, active && styles.cardActive]}
              onPress={() => toggle(item.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, active && styles.cardLabelActive]}>
                  {item.label}
                </Text>
                <Text style={styles.cardSub}>{item.sub}</Text>
              </View>
              <View style={[styles.check, active && styles.checkActive]}>
                {active ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: Spacing.lg,
  },
  cardActive: {
    borderColor: Colors.vivid,
    backgroundColor: '#EEF4FF',
  },
  emoji: {
    fontSize: 26,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.ink,
  },
  cardLabelActive: {
    color: Colors.vivid,
  },
  cardSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.ceilLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  checkMark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});

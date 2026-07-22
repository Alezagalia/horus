import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useHabitCategories, useCreateHabit } from '@/hooks/useHabits';
import { syncNow } from '@/db/syncScheduler';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { HABIT_TEMPLATES, type HabitTemplate } from '@/components/onboarding/habitTemplates';
import { Colors, Spacing, Radius } from '@/tokens';

function nextStep(interests: string[]): void {
  if (interests.includes('finanzas')) {
    router.push('/(onboarding)/primera-cuenta');
  } else {
    router.push('/(onboarding)/notificaciones');
  }
}

export default function OnboardingFirstHabit() {
  const interests = useOnboardingStore((s) => s.interests);
  const { data: categories = [] } = useHabitCategories();
  const createHabit = useCreateHabit();
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Post-registro el pull inicial de WMDB puede no haber llegado aún: lo
  // empujamos y las cards se habilitan solas cuando aparecen las categorías
  // (useWatermelonQuery es reactivo). "Saltar" queda siempre disponible.
  const categoriesReady = categories.length > 0;
  useEffect(() => {
    if (!categoriesReady) void syncNow();
  }, [categoriesReady]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const resolveCategoryId = (template: HabitTemplate): string | null => {
    const byName = categories.find((c) => c.name === template.categoryName);
    return byName?.id ?? categories[0]?.id ?? null;
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      nextStep(interests);
      return;
    }
    setCreating(true);
    try {
      for (const id of selected) {
        const template = HABIT_TEMPLATES.find((t) => t.id === id);
        if (!template) continue;
        const categoryId = resolveCategoryId(template);
        if (!categoryId) continue;
        const { id: _id, emoji: _emoji, categoryName: _cn, ...dto } = template;
        await createHabit.mutateAsync({ ...dto, categoryId });
      }
      nextStep(interests);
    } catch {
      Alert.alert('Error', 'No pudimos crear los hábitos. Podés crearlos después desde Foco.');
      nextStep(interests);
    } finally {
      setCreating(false);
    }
  };

  return (
    <OnboardingScaffold
      step={2}
      title="Empezá con un hábito"
      subtitle="Elegí uno o más para arrancar hoy mismo. Después podés crear los tuyos."
      footer={
        <Button
          label={selected.length > 0 ? `Crear ${selected.length} y continuar` : 'Continuar'}
          onPress={() => void handleContinue()}
          loading={creating}
          disabled={creating || (selected.length > 0 && !categoriesReady)}
        />
      }
    >
      {!categoriesReady ? <Text style={styles.preparing}>Preparando tus categorías…</Text> : null}
      <View style={styles.grid}>
        {HABIT_TEMPLATES.map((template) => {
          const active = selected.includes(template.id);
          return (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.card,
                active && styles.cardActive,
                !categoriesReady && styles.cardDisabled,
              ]}
              onPress={() => toggle(template.id)}
              disabled={!categoriesReady}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{template.emoji}</Text>
              <Text style={[styles.name, active && styles.nameActive]}>{template.name}</Text>
              <Text style={styles.meta}>
                {template.type === 'NUMERIC'
                  ? `${template.targetValue} ${template.unit} por día`
                  : template.periodicity === 'WEEKLY'
                    ? `${template.weekDays.length}× por semana`
                    : 'Todos los días'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  preparing: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  card: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: Spacing.lg,
    gap: 4,
  },
  cardActive: {
    borderColor: Colors.vivid,
    backgroundColor: '#EEF4FF',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  name: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  nameActive: {
    color: Colors.vivid,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
});

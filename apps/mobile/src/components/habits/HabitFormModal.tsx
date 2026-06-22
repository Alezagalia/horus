import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Spacing, Radius } from '@/tokens';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { useCreateHabit, useUpdateHabit, useHabitCategories } from '@/hooks/useHabits';
import { useHabitMoments } from '@/hooks/useHabitMoments';
import type { Habit, CreateHabitDTO } from '@/services/api/habitApi';

// ─── constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

type Periodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

// Opción "Cualquiera" siempre disponible; el resto se completa con los momentos
// dinámicos del usuario (useHabitMoments), igual que la web.
const ANYTIME_OPTION = { value: 'ANYTIME', label: 'Cualquiera' };

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  habit?: Habit;
}

// ─── component ────────────────────────────────────────────────────────────────

export function HabitFormModal({ visible, onClose, habit }: Props) {
  const isEdit = !!habit;

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<'CHECK' | 'NUMERIC'>('CHECK');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [periodicity, setPeriodicity] = useState<Periodicity>('DAILY');
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [timeOfDay, setTimeOfDay] = useState('ANYTIME');

  const { data: categories = [] } = useHabitCategories();
  const { data: moments = [] } = useHabitMoments();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  // "Cualquiera" + momentos dinámicos del backend.
  const timeOptions = [
    ANYTIME_OPTION,
    ...moments.map((m) => ({ value: m.key, label: `${m.emoji} ${m.label}` })),
  ];

  // WEEKLY y CUSTOM usan selector de días de la semana.
  const usesWeekDays = periodicity === 'WEEKLY' || periodicity === 'CUSTOM';

  // Pre-load when editing
  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setCategoryId(habit.category?.id ?? '');
      setType(habit.type);
      setTargetValue(habit.targetValue?.toString() ?? '');
      setUnit(habit.unit ?? '');
      setPeriodicity(habit.periodicity);
      setWeekDays(habit.weekDays ?? []);
      setTimeOfDay(habit.timeOfDay ?? 'ANYTIME');
    }
  }, [habit]);

  const reset = () => {
    setName('');
    setCategoryId('');
    setType('CHECK');
    setTargetValue('');
    setUnit('');
    setPeriodicity('DAILY');
    setWeekDays([]);
    setTimeOfDay('ANYTIME');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'El nombre es obligatorio';
    if (!categoryId) return 'Selecciona una categoría';
    if (type === 'NUMERIC') {
      const tv = parseFloat(targetValue.replace(',', '.'));
      if (!targetValue || isNaN(tv) || tv <= 0) return 'El objetivo debe ser mayor a 0';
      if (!unit.trim()) return 'La unidad es obligatoria';
    }
    if (usesWeekDays && weekDays.length === 0) return 'Selecciona al menos un día de la semana';
    return null;
  };

  const handleSubmit = () => {
    const error = validate();
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    const dto: CreateHabitDTO = {
      name: name.trim(),
      categoryId,
      type,
      periodicity,
      weekDays: usesWeekDays ? weekDays : [],
      timeOfDay,
      ...(type === 'NUMERIC' && {
        targetValue: parseFloat(targetValue.replace(',', '.')),
        unit: unit.trim(),
      }),
    };

    if (isEdit && habit) {
      updateHabit.mutate(
        { id: habit.id, dto },
        {
          onSuccess: handleClose,
          onError: () => Alert.alert('Error', 'No se pudo actualizar el hábito'),
        }
      );
    } else {
      createHabit.mutate(dto, {
        onSuccess: handleClose,
        onError: () => Alert.alert('Error', 'No se pudo crear el hábito'),
      });
    }
  };

  const isPending = createHabit.isPending || updateHabit.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{isEdit ? 'Editar hábito' : 'Nuevo hábito'}</Text>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Meditar 10 minutos"
              placeholderTextColor={Colors.muted}
              autoFocus={!isEdit}
              returnKeyType="next"
            />

            {/* Category */}
            <Text style={styles.label}>Categoría *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={`${cat.icon ?? '📁'} ${cat.name}`}
                  active={categoryId === cat.id}
                  onPress={() => setCategoryId(cat.id)}
                />
              ))}
              {categories.length === 0 && (
                <Text style={styles.emptyHint}>Sin categorías de hábitos</Text>
              )}
            </ScrollView>

            {/* Type */}
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chipRow}>
              <Chip label="✓ Check" active={type === 'CHECK'} onPress={() => setType('CHECK')} />
              <Chip
                label="# Numérico"
                active={type === 'NUMERIC'}
                onPress={() => setType('NUMERIC')}
              />
            </View>

            {/* Numeric fields */}
            {type === 'NUMERIC' && (
              <View style={styles.numericRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Objetivo *</Text>
                  <TextInput
                    style={styles.input}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    placeholder="10"
                    placeholderTextColor={Colors.muted}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unidad *</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="vasos, km…"
                    placeholderTextColor={Colors.muted}
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}

            {/* Periodicity */}
            <Text style={styles.label}>Frecuencia</Text>
            <View style={styles.chipRow}>
              <Chip
                label="Diario"
                active={periodicity === 'DAILY'}
                onPress={() => setPeriodicity('DAILY')}
              />
              <Chip
                label="Semanal"
                active={periodicity === 'WEEKLY'}
                onPress={() => setPeriodicity('WEEKLY')}
              />
              <Chip
                label="Mensual"
                active={periodicity === 'MONTHLY'}
                onPress={() => setPeriodicity('MONTHLY')}
              />
              <Chip
                label="Personalizado"
                active={periodicity === 'CUSTOM'}
                onPress={() => setPeriodicity('CUSTOM')}
              />
            </View>

            {/* Week day selector (WEEKLY o CUSTOM) */}
            {usesWeekDays && (
              <>
                <Text style={styles.label}>Días</Text>
                <View style={styles.daysRow}>
                  {DAY_LABELS.map((label, idx) => {
                    const active = weekDays.includes(idx);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.dayCircle, active && styles.dayCircleActive]}
                        onPress={() => toggleWeekDay(idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Time of day */}
            <Text style={styles.label}>Momento del día</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chipRow, { marginBottom: Spacing.xl }]}
            >
              {timeOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  active={timeOfDay === opt.value}
                  onPress={() => setTimeOfDay(opt.value)}
                />
              ))}
            </ScrollView>

            <Button
              label={isEdit ? 'Guardar' : 'Crear hábito'}
              onPress={handleSubmit}
              loading={isPending}
              disabled={isPending}
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,31,0.4)',
  },
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.line,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.ink,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.vivid,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  numericRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  daysRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  dayLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
  },
  dayLabelActive: {
    color: '#fff',
  },
  emptyHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    paddingVertical: 6,
  },
  submitBtn: {
    marginBottom: Spacing.md,
  },
});

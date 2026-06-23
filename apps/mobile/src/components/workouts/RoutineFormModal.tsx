import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Plus, Trash2, ChevronUp, ChevronDown, Dumbbell } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Layout } from '@/tokens';
import { useRoutineDetail, useCreateRoutine, useUpdateRoutine } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import type { MuscleGroup } from '@/services/api/exerciseApi';
import type { CreateRoutineExerciseDTO } from '@horus/shared';
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '@/constants/muscleGroups';

interface RoutineExerciseForm {
  tempId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup | null;
  targetSets: string;
  targetReps: string;
  targetWeight: string;
  restTime: string;
  notes: string;
}

interface RoutineFormModalProps {
  visible: boolean;
  routineId: string | null;
  onClose: () => void;
}

function toNumberOrNull(value: string, integer = true): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = integer ? parseInt(trimmed, 10) : parseFloat(trimmed.replace(',', '.'));
  return isNaN(n) || n < 0 ? null : n;
}

export function RoutineFormModal({ visible, routineId, onClose }: RoutineFormModalProps) {
  const isEditing = !!routineId;
  const tempCounter = useRef(0);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseForm[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const { data: detail, isLoading: loadingDetail } = useRoutineDetail(
    visible && isEditing ? routineId! : undefined
  );
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();

  const nextTempId = () => `tmp-${tempCounter.current++}`;

  // Reset / hydrate when opened
  useEffect(() => {
    if (!visible) return;
    if (!isEditing) {
      setName('');
      setDescription('');
      setExercises([]);
      setShowPicker(false);
    }
  }, [visible, isEditing]);

  // Hydrate from detail (edit mode)
  useEffect(() => {
    if (visible && isEditing && detail) {
      setName(detail.name);
      setDescription(detail.description ?? '');
      setExercises(
        [...detail.exercises]
          .sort((a, b) => a.order - b.order)
          .map((ex) => ({
            tempId: nextTempId(),
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            targetSets: ex.targetSets != null ? String(ex.targetSets) : '',
            targetReps: ex.targetReps != null ? String(ex.targetReps) : '',
            targetWeight: ex.targetWeight != null ? String(ex.targetWeight) : '',
            restTime: ex.restTime != null ? String(ex.restTime) : '',
            notes: ex.notes ?? '',
          }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isEditing, detail]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setExercises([]);
    setShowPicker(false);
    onClose();
  };

  const addExercise = (id: string, exName: string, muscle: MuscleGroup | null) => {
    setExercises((prev) => [
      ...prev,
      {
        tempId: nextTempId(),
        exerciseId: id,
        exerciseName: exName,
        muscleGroup: muscle,
        targetSets: '3',
        targetReps: '10',
        targetWeight: '',
        restTime: '60',
        notes: '',
      },
    ]);
    setShowPicker(false);
  };

  const removeExercise = (tempId: string) => {
    setExercises((prev) => prev.filter((e) => e.tempId !== tempId));
  };

  const updateField = (tempId: string, field: keyof RoutineExerciseForm, value: string) => {
    setExercises((prev) => prev.map((e) => (e.tempId === tempId ? { ...e, [field]: value } : e)));
  };

  const move = (index: number, dir: -1 | 1) => {
    setExercises((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const isBusy = createRoutine.isPending || updateRoutine.isPending;
  const canSubmit = name.trim().length > 0 && exercises.length > 0 && !isBusy;

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresá un nombre para la rutina');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Sin ejercicios', 'Agregá al menos un ejercicio a la rutina');
      return;
    }

    const exercisesDto: CreateRoutineExerciseDTO[] = exercises.map((e, i) => ({
      exerciseId: e.exerciseId,
      order: i + 1,
      targetSets: toNumberOrNull(e.targetSets),
      targetReps: toNumberOrNull(e.targetReps),
      targetWeight: toNumberOrNull(e.targetWeight, false),
      restTime: toNumberOrNull(e.restTime),
      notes: e.notes.trim() || null,
    }));

    const dto = {
      name: name.trim(),
      description: description.trim() || null,
      exercises: exercisesDto,
    };

    const onError = (err: any) => {
      const msg = err?.response?.data?.message ?? 'No se pudo guardar la rutina';
      Alert.alert('Error', msg);
    };

    if (isEditing && routineId) {
      updateRoutine.mutate({ id: routineId, dto }, { onSuccess: handleClose, onError });
    } else {
      createRoutine.mutate(dto, { onSuccess: handleClose, onError });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>{isEditing ? 'Editar rutina' : 'Nueva rutina'}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {isEditing && loadingDetail ? (
            <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 40 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <TextInput
                style={s.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de la rutina"
                placeholderTextColor={Colors.muted}
                returnKeyType="next"
              />

              <TextInput
                style={[s.nameInput, { minHeight: 56, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descripción (opcional)"
                placeholderTextColor={Colors.muted}
                multiline
              />

              <View style={s.exHeaderRow}>
                <Text style={s.label}>EJERCICIOS ({exercises.length})</Text>
              </View>

              {exercises.map((ex, index) => (
                <View key={ex.tempId} style={s.exCard}>
                  <View style={s.exCardTop}>
                    <View style={s.orderBadge}>
                      <Text style={s.orderText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.exName} numberOfLines={1}>
                        {ex.exerciseName}
                      </Text>
                      {ex.muscleGroup ? (
                        <Text style={s.exMuscle}>{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => move(index, -1)}
                      disabled={index === 0}
                      hitSlop={6}
                    >
                      <ChevronUp size={18} color={index === 0 ? Colors.line : Colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => move(index, 1)}
                      disabled={index === exercises.length - 1}
                      hitSlop={6}
                    >
                      <ChevronDown
                        size={18}
                        color={index === exercises.length - 1 ? Colors.line : Colors.muted}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeExercise(ex.tempId)} hitSlop={6}>
                      <Trash2 size={16} color={Colors.muted} />
                    </TouchableOpacity>
                  </View>

                  <View style={s.fieldsRow}>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Series</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={ex.targetSets}
                        onChangeText={(v) => updateField(ex.tempId, 'targetSets', v)}
                        placeholder="—"
                        placeholderTextColor={Colors.muted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Reps</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={ex.targetReps}
                        onChangeText={(v) => updateField(ex.tempId, 'targetReps', v)}
                        placeholder="—"
                        placeholderTextColor={Colors.muted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Peso (kg)</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={ex.targetWeight}
                        onChangeText={(v) => updateField(ex.tempId, 'targetWeight', v)}
                        placeholder="—"
                        placeholderTextColor={Colors.muted}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={s.field}>
                      <Text style={s.fieldLabel}>Desc. (s)</Text>
                      <TextInput
                        style={s.fieldInput}
                        value={ex.restTime}
                        onChangeText={(v) => updateField(ex.tempId, 'restTime', v)}
                        placeholder="—"
                        placeholderTextColor={Colors.muted}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <TextInput
                    style={s.notesInput}
                    value={ex.notes}
                    onChangeText={(v) => updateField(ex.tempId, 'notes', v)}
                    placeholder="Notas (opcional)"
                    placeholderTextColor={Colors.muted}
                  />
                </View>
              ))}

              <TouchableOpacity style={s.addExBtn} onPress={() => setShowPicker(true)}>
                <Plus size={18} color={Colors.vivid} strokeWidth={2} />
                <Text style={s.addExLabel}>Agregar ejercicio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.submitBtn, !canSubmit && { opacity: 0.45 }]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.submitLabel}>
                    {isEditing ? 'Guardar cambios' : 'Crear rutina'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>

      <ExercisePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onPick={addExercise}
      />
    </Modal>
  );
}

// ─── Exercise picker (nested modal) ──────────────────────────────────────────────

function ExercisePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (id: string, name: string, muscle: MuscleGroup | null) => void;
}) {
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | undefined>(undefined);
  const { data, isLoading } = useExercises(muscleFilter);
  const exercises = data?.exercises ?? [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Elegir ejercicio</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: Spacing.md }}
            contentContainerStyle={{ gap: Spacing.sm }}
          >
            {MUSCLE_GROUPS.map((g) => (
              <Chip
                key={g.label}
                label={g.label}
                active={muscleFilter === g.key}
                onPress={() => setMuscleFilter(g.key)}
              />
            ))}
          </ScrollView>

          {isLoading ? (
            <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />
          ) : exercises.length === 0 ? (
            <View style={s.emptyPicker}>
              <Dumbbell size={28} color={Colors.ceilLight} strokeWidth={1} />
              <Text style={s.emptyPickerText}>
                No hay ejercicios{muscleFilter ? ' en este grupo' : ''}. Creá ejercicios en la
                pestaña Ejercicios.
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {exercises.map((ex, i) => (
                <TouchableOpacity
                  key={ex.id}
                  style={[s.pickerRow, i < exercises.length - 1 && s.pickerRowBorder]}
                  onPress={() => onPick(ex.id, ex.name, ex.muscleGroup)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.pickerName}>{ex.name}</Text>
                    {ex.muscleGroup ? (
                      <Text style={s.pickerMuscle}>{MUSCLE_GROUP_LABELS[ex.muscleGroup]}</Text>
                    ) : null}
                  </View>
                  <Plus size={18} color={Colors.vivid} strokeWidth={2} />
                </TouchableOpacity>
              ))}
              <View style={{ height: Spacing.lg }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,14,31,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.6,
  },
  nameInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.lg,
  },
  exHeaderRow: {
    marginBottom: Spacing.sm,
  },
  exCard: {
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  exCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  orderBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: Colors.vivid,
  },
  exName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  exMuscle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.muted,
    marginBottom: 4,
  },
  fieldInput: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 8,
    textAlign: 'center',
  },
  notesInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.ink,
    backgroundColor: '#fff',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.vivid,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  addExLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.vivid,
  },
  submitBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  submitLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
  // Picker
  emptyPicker: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
  emptyPickerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
  },
  pickerRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  pickerName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  pickerMuscle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },
});

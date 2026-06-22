/**
 * NumericHabitSheet — Hoja de entrada de valor para hábitos NUMERIC.
 * Compartida entre la pantalla Hoy (agenda del día) y Foco → Hábitos, para que
 * marcar un hábito numérico abra el ingreso de valor in situ (sin redirigir).
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius } from '@/tokens';
import { useNumericHabitProgress } from '@/hooks/useHabits';
import type { Habit } from '@/services/api/habitApi';
import { apiErrorMessage } from '@/lib/apiError';

export function NumericHabitSheet({
  habit,
  onClose,
}: {
  habit: Habit | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState('');
  const logProgress = useNumericHabitProgress();
  const TODAY = format(new Date(), 'yyyy-MM-dd');

  const handleSubmit = () => {
    if (!habit) return;
    // Acepta coma o punto como separador decimal (es-AR usa coma).
    const num = parseFloat(value.replace(',', '.'));
    if (!value || isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Ingresa un valor válido mayor a 0');
      return;
    }
    logProgress.mutate(
      { habitId: habit.id, date: TODAY, value: num },
      {
        onSuccess: () => {
          setValue('');
          onClose();
        },
        onError: (err) =>
          Alert.alert('Error', apiErrorMessage(err, 'No se pudo registrar el progreso')),
      }
    );
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <Modal visible={!!habit} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Registrar — {habit?.name}</Text>
          {habit?.targetValue != null && (
            <Text style={styles.numericSubtitle}>
              Objetivo: {habit.targetValue} {habit.unit ?? ''}
            </Text>
          )}
          <TextInput
            style={styles.numericInput}
            value={value}
            onChangeText={setValue}
            placeholder="0"
            placeholderTextColor={Colors.muted}
            keyboardType="decimal-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            textAlign="center"
          />
          <Button
            label="Registrar"
            onPress={handleSubmit}
            loading={logProgress.isPending}
            disabled={!value || logProgress.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,31,0.4)',
  },
  modalContainer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
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
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    marginBottom: Spacing.lg,
  },
  numericSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  numericInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    color: Colors.ink,
    textAlign: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.vivid,
    marginBottom: Spacing.xl,
  },
});

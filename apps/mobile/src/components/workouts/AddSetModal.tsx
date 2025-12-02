/**
 * AddSetModal Component
 * Sprint 14 - US-134
 *
 * Modal para registrar una nueva serie durante la ejecución del workout
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';

interface AddSetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reps: number, weight: number) => void;
  setNumber: number;
  lastReps?: number;
  lastWeight?: number;
  restTime?: number; // seconds
  exerciseName: string;
}

export const AddSetModal: React.FC<AddSetModalProps> = ({
  visible,
  onClose,
  onSave,
  setNumber,
  lastReps,
  lastWeight,
  restTime = 60,
  exerciseName,
}) => {
  const [reps, setReps] = useState<string>(lastReps?.toString() || '');
  const [weight, setWeight] = useState<string>(lastWeight?.toString() || '');
  const [notes, setNotes] = useState<string>('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [restTimer, setRestTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // Pre-cargar valores cuando se abre el modal
  useEffect(() => {
    if (visible) {
      setReps(lastReps?.toString() || '');
      setWeight(lastWeight?.toString() || '');
      setNotes('');
      setRestTimer(0);
      setIsResting(false);
    }
  }, [visible, lastReps, lastWeight]);

  // Timer de descanso
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            // Notificación al terminar
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
              Alert.alert('¡Descanso terminado!', 'Listo para la siguiente serie', [
                { text: 'OK' },
              ]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isResting, restTimer]);

  const handleSave = () => {
    const repsNum = parseInt(reps, 10);
    const weightNum = parseFloat(weight);

    if (!reps || isNaN(repsNum) || repsNum <= 0) {
      Alert.alert('Error', 'Ingresa un número válido de repeticiones');
      return;
    }

    if (!weight || isNaN(weightNum) || weightNum < 0) {
      Alert.alert('Error', 'Ingresa un peso válido');
      return;
    }

    // Convertir lbs a kg si es necesario
    const finalWeight = unit === 'lbs' ? weightNum * 0.453592 : weightNum;

    onSave(repsNum, finalWeight);

    // Iniciar timer de descanso si está configurado
    if (restTime > 0) {
      setRestTimer(restTime);
      setIsResting(true);
    }

    // No cerrar el modal si está el timer activo - dejar que el usuario decida
  };

  const handleClose = () => {
    if (isResting) {
      Alert.alert(
        'Timer en curso',
        '¿Deseas cancelar el descanso y cerrar?',
        [
          { text: 'Continuar descansando', style: 'cancel' },
          {
            text: 'Cerrar',
            style: 'destructive',
            onPress: () => {
              setIsResting(false);
              setRestTimer(0);
              onClose();
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      onClose();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{exerciseName}</Text>
            <Text style={styles.subtitle}>Serie {setNumber}</Text>
          </View>

          {/* Inputs */}
          <View style={styles.inputsContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Repeticiones</Text>
              <TextInput
                style={styles.input}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#999"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Peso</Text>
              <View style={styles.weightRow}>
                <TextInput
                  style={[styles.input, styles.weightInput]}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
                <View style={styles.unitSelector}>
                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
                    onPress={() => setUnit('kg')}
                  >
                    <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>
                      kg
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
                    onPress={() => setUnit('lbs')}
                  >
                    <Text style={[styles.unitText, unit === 'lbs' && styles.unitTextActive]}>
                      lbs
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Rest Timer */}
          {isResting && (
            <View style={styles.timerContainer}>
              <Text style={styles.timerLabel}>Descanso</Text>
              <Text style={styles.timerValue}>{formatTime(restTimer)}</Text>
            </View>
          )}

          {/* Notes (optional) */}
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: Sentí más fácil, buen rango de movimiento..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isResting}>
              <Text style={styles.saveButtonText}>
                {isResting ? 'Descansando...' : 'Guardar Serie'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  inputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  weightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weightInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  unitButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  unitTextActive: {
    color: '#fff',
  },
  timerContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E65100',
  },
  notesContainer: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

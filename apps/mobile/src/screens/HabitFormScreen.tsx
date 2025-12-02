/**
 * HabitFormScreen - Create/Edit Habit
 * Sprint 3 - US-023
 * Sprint 6 - US-054: Added notification configuration with native time picker and permissions
 * Sprint 6 - US-055: Integrated with NotificationService for centralized notification management
 *
 * Complete form for creating and editing habits with all configuration options
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createHabit,
  updateHabit,
  getHabitById,
  updateNotificationConfig,
  type CreateHabitDTO,
} from '../api/habits.api';
import { getCategories } from '../api/categories.api';
import { Scope } from '@horus/shared';
import {
  scheduleHabitNotification,
  cancelHabitNotification,
} from '../services/NotificationService';

interface HabitFormScreenProps {
  habitId?: string; // If provided, edit mode
  onSuccess?: () => void; // Callback after successful save
  onCancel?: () => void; // Callback for cancel action
}

type HabitType = 'CHECK' | 'NUMERIC';
type Periodicity = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
type TimeOfDay = 'MANANA' | 'TARDE' | 'NOCHE' | 'ANYTIME';

const TIME_OF_DAY_OPTIONS: { value: TimeOfDay; label: string; icon: string }[] = [
  { value: 'MANANA', label: 'Mañana', icon: '🌅' },
  { value: 'TARDE', label: 'Tarde', icon: '☀️' },
  { value: 'NOCHE', label: 'Noche', icon: '🌙' },
  { value: 'ANYTIME', label: 'Cualquier momento', icon: '⏰' },
];

const PERIODICITY_OPTIONS: { value: Periodicity; label: string }[] = [
  { value: 'DAILY', label: 'Diario' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensual' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const WEEK_DAYS = [
  { value: 0, short: 'D', label: 'Domingo' },
  { value: 1, short: 'L', label: 'Lunes' },
  { value: 2, short: 'M', label: 'Martes' },
  { value: 3, short: 'X', label: 'Miércoles' },
  { value: 4, short: 'J', label: 'Jueves' },
  { value: 5, short: 'V', label: 'Viernes' },
  { value: 6, short: 'S', label: 'Sábado' },
];

const PRESET_COLORS = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
];

export function HabitFormScreen({ habitId, onSuccess, onCancel }: HabitFormScreenProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!habitId;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState<HabitType>('CHECK');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [periodicity, setPeriodicity] = useState<Periodicity>('DAILY');
  const [weekDays, setWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [customDays, setCustomDays] = useState('1');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('ANYTIME');
  const [reminderTime, setReminderTime] = useState('');
  const [enableReminder, setEnableReminder] = useState(false);
  const [color, setColor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Notification state (US-054)
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', Scope.HABITOS],
    queryFn: () => getCategories({ scope: Scope.HABITOS }),
  });

  // Fetch existing habit if edit mode
  const { data: existingHabit, isLoading: isLoadingHabit } = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabitById(habitId!),
    enabled: isEditMode,
  });

  // Check notification permissions on mount (US-054)
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setHasNotificationPermission(status === 'granted');
    };
    checkPermissions();
  }, []);

  // Load existing habit data
  useEffect(() => {
    if (existingHabit) {
      setName(existingHabit.name);
      setDescription(existingHabit.description || '');
      setCategoryId(existingHabit.categoryId);
      setType(existingHabit.type);
      setTargetValue(existingHabit.targetValue?.toString() || '');
      setUnit(existingHabit.unit || '');
      setPeriodicity(existingHabit.periodicity);
      setWeekDays(existingHabit.weekDays);
      setTimeOfDay(existingHabit.timeOfDay);
      const remTime = existingHabit.reminderTime || '';
      setReminderTime(remTime);
      setEnableReminder(!!remTime);

      // Parse existing reminder time to Date object (US-054)
      if (remTime) {
        const [hours, minutes] = remTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        setSelectedTime(date);
      }

      setColor(existingHabit.color || '');
    }
  }, [existingHabit]);

  // Auto-select first category if only one exists
  useEffect(() => {
    if (!categoryId && categories.length === 1) {
      setCategoryId(categories[0].id);
      if (!color) {
        setColor(categories[0].color || '');
      }
    }
  }, [categories, categoryId, color]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      Alert.alert('Éxito', 'Hábito creado correctamente');
      onSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No se pudo crear el hábito';
      Alert.alert('Error', errorMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateHabitDTO>) => updateHabit(habitId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
      Alert.alert('Éxito', 'Hábito actualizado correctamente');
      onSuccess?.();
    },
    onError: (error: Error) => {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        'No se pudo actualizar el hábito';
      Alert.alert('Error', errorMessage);
    },
  });

  // ==================== Notification Handlers (US-054) ====================

  /**
   * Request notification permissions
   */
  const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        setHasNotificationPermission(true);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setHasNotificationPermission(true);
        return true;
      }

      // Permission denied
      setHasNotificationPermission(false);
      Alert.alert(
        'Permisos necesarios',
        'Para recibir recordatorios, debes habilitar las notificaciones en Configuración.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir a Configuración',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert('Error', 'No se pudo solicitar permisos de notificaciones');
      return false;
    }
  };

  /**
   * Handle reminder toggle - Request permissions if needed
   */
  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      // Request permissions when activating reminder
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        setEnableReminder(true);
        // Show time picker on iOS, Android will show on press
        if (Platform.OS === 'ios') {
          setShowTimePicker(true);
        }
      } else {
        setEnableReminder(false);
      }
    } else {
      setEnableReminder(false);
      setShowTimePicker(false);
      setReminderTime('');
    }
  };

  /**
   * Handle time change from DateTimePicker
   */
  const handleTimeChange = (_event: { type: string; nativeEvent?: unknown }, date?: Date) => {
    // Android: hide picker after selection
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }

    if (date) {
      setSelectedTime(date);
      // Format to HH:mm
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setReminderTime(timeString);
    }
  };

  // ==================== End Notification Handlers ====================
  // Note: Notification scheduling moved to NotificationService (US-055)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (name.length > 100) {
      newErrors.name = 'El nombre no puede superar 100 caracteres';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Debes seleccionar una categoría';
    }

    if (type === 'NUMERIC') {
      if (!targetValue || parseFloat(targetValue) <= 0) {
        newErrors.targetValue = 'Ingresa un valor objetivo válido';
      }
      if (!unit.trim()) {
        newErrors.unit = 'Ingresa una unidad (ej: vasos, km)';
      }
    }

    if (periodicity === 'WEEKLY' && weekDays.length === 0) {
      newErrors.weekDays = 'Selecciona al menos un día';
    }

    if (periodicity === 'CUSTOM') {
      const days = parseInt(customDays);
      if (isNaN(days) || days < 1 || days > 365) {
        newErrors.customDays = 'Ingresa un número entre 1 y 365';
      }
    }

    if (enableReminder && !reminderTime) {
      newErrors.reminderTime = 'Configura la hora del recordatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert('Validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    const payload: CreateHabitDTO = {
      categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      targetValue: type === 'NUMERIC' ? parseFloat(targetValue) : undefined,
      unit: type === 'NUMERIC' ? unit.trim() : undefined,
      periodicity,
      weekDays: periodicity === 'WEEKLY' ? weekDays : [],
      timeOfDay,
      reminderTime: enableReminder ? reminderTime : undefined,
      color: color || undefined,
    };

    // Callback after save to configure notifications (US-054, US-055)
    const handleAfterSave = async (savedHabitId: string) => {
      try {
        // Update notification configuration
        if (enableReminder && reminderTime) {
          await updateNotificationConfig(savedHabitId, {
            enabled: true,
            time: reminderTime,
          });

          // Schedule local notification using NotificationService (US-055)
          await scheduleHabitNotification(savedHabitId, name, reminderTime);
        } else {
          // Disable notifications if reminder is off
          await updateNotificationConfig(savedHabitId, {
            enabled: false,
            time: '00:00',
          });

          // Cancel existing notifications (US-055)
          await cancelHabitNotification(savedHabitId);
        }
      } catch (error) {
        console.error('Error updating notification config:', error);
        // Don't block the UI, just log the error
      }
    };

    if (isEditMode) {
      updateMutation.mutate(payload, {
        onSuccess: (data) => {
          handleAfterSave(data.id);
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: (data) => {
          handleAfterSave(data.id);
        },
      });
    }
  };

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleCategorySelect = (catId: string) => {
    setCategoryId(catId);
    if (!color) {
      const category = categories.find((c) => c.id === catId);
      if (category?.color) {
        setColor(category.color);
      }
    }
  };

  if (isLoadingCategories || (isEditMode && isLoadingHabit)) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Editar Hábito' : 'Nuevo Hábito'}</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Nombre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Ej: Beber agua"
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          <Text style={styles.hint}>{name.length}/100 caracteres</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Añade detalles sobre este hábito..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Categoría <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  categoryId === category.id && styles.categoryCardActive,
                  { borderColor: category.color || '#9E9E9E' },
                ]}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId}</Text>}
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Hábito</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'CHECK' && styles.typeButtonActive]}
              onPress={() => setType('CHECK')}
            >
              <Text style={styles.typeIcon}>✓</Text>
              <Text style={[styles.typeLabel, type === 'CHECK' && styles.typeLabelActive]}>
                Checkbox
              </Text>
              <Text style={styles.typeDescription}>Sí/No simple</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'NUMERIC' && styles.typeButtonActive]}
              onPress={() => setType('NUMERIC')}
            >
              <Text style={styles.typeIcon}>#</Text>
              <Text style={[styles.typeLabel, type === 'NUMERIC' && styles.typeLabelActive]}>
                Numérico
              </Text>
              <Text style={styles.typeDescription}>Con objetivo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Numeric Fields */}
        {type === 'NUMERIC' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Objetivo <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.numericRow}>
              <TextInput
                style={[styles.input, styles.numericInput, errors.targetValue && styles.inputError]}
                placeholder="Ej: 8"
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.unitInput, errors.unit && styles.inputError]}
                placeholder="Unidad (ej: vasos)"
                value={unit}
                onChangeText={setUnit}
              />
            </View>
            {(errors.targetValue || errors.unit) && (
              <Text style={styles.errorText}>{errors.targetValue || errors.unit}</Text>
            )}
          </View>
        )}

        {/* Periodicity */}
        <View style={styles.section}>
          <Text style={styles.label}>Periodicidad</Text>
          <View style={styles.periodicityGrid}>
            {PERIODICITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.periodicityButton,
                  periodicity === option.value && styles.periodicityButtonActive,
                ]}
                onPress={() => setPeriodicity(option.value)}
              >
                <Text
                  style={[
                    styles.periodicityLabel,
                    periodicity === option.value && styles.periodicityLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Week Days */}
        {periodicity === 'WEEKLY' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Días de la semana <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.weekDaysRow}>
              {WEEK_DAYS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[
                    styles.weekDayButton,
                    weekDays.includes(day.value) && styles.weekDayButtonActive,
                  ]}
                  onPress={() => toggleWeekDay(day.value)}
                >
                  <Text
                    style={[
                      styles.weekDayText,
                      weekDays.includes(day.value) && styles.weekDayTextActive,
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.weekDays && <Text style={styles.errorText}>{errors.weekDays}</Text>}
          </View>
        )}

        {/* Custom Days */}
        {periodicity === 'CUSTOM' && (
          <View style={styles.section}>
            <Text style={styles.label}>
              Repetir cada <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.customDaysRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.customDaysInput,
                  errors.customDays && styles.inputError,
                ]}
                placeholder="1"
                value={customDays}
                onChangeText={setCustomDays}
                keyboardType="numeric"
              />
              <Text style={styles.customDaysLabel}>días</Text>
            </View>
            {errors.customDays && <Text style={styles.errorText}>{errors.customDays}</Text>}
          </View>
        )}

        {/* Time of Day */}
        <View style={styles.section}>
          <Text style={styles.label}>Momento del día</Text>
          <View style={styles.timeOfDayGrid}>
            {TIME_OF_DAY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOfDayButton,
                  timeOfDay === option.value && styles.timeOfDayButtonActive,
                ]}
                onPress={() => setTimeOfDay(option.value)}
              >
                <Text style={styles.timeOfDayIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.timeOfDayLabel,
                    timeOfDay === option.value && styles.timeOfDayLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder - US-054: Native DateTimePicker */}
        <View style={styles.section}>
          <View style={styles.reminderHeader}>
            <Text style={styles.label}>Recordatorio</Text>
            <Switch
              value={enableReminder}
              onValueChange={handleReminderToggle}
              trackColor={{ false: '#ddd', true: '#81C784' }}
              thumbColor={enableReminder ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
          {enableReminder && (
            <>
              {/* Time Display Button (Android) or Inline Picker (iOS) */}
              {Platform.OS === 'android' ? (
                <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.timeButtonIcon}>🕐</Text>
                  <Text style={styles.timeButtonText}>{reminderTime || 'Seleccionar hora'}</Text>
                </TouchableOpacity>
              ) : null}

              {/* iOS shows picker inline, Android shows on button press */}
              {(Platform.OS === 'ios' || showTimePicker) && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}

              {errors.reminderTime && <Text style={styles.errorText}>{errors.reminderTime}</Text>}

              {hasNotificationPermission === false && (
                <View style={styles.permissionWarning}>
                  <Text style={styles.permissionWarningText}>
                    ⚠️ Permisos de notificaciones denegados
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openSettings()}>
                    <Text style={styles.permissionLink}>Ir a Configuración</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.hint}>
                Recibirás un recordatorio diario a la hora configurada
              </Text>
            </>
          )}
        </View>

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={styles.label}>Color (opcional)</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((presetColor) => (
              <TouchableOpacity
                key={presetColor}
                style={[
                  styles.colorButton,
                  { backgroundColor: presetColor },
                  color === presetColor && styles.colorButtonActive,
                ]}
                onPress={() => setColor(presetColor)}
              >
                {color === presetColor && <Text style={styles.colorCheckmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.label}>Vista previa</Text>
          <View style={[styles.previewCard, { borderLeftColor: color || '#9E9E9E' }]}>
            <View style={styles.previewHeader}>
              <View style={styles.previewTypeContainer}>
                <View
                  style={[
                    styles.previewTypeBadge,
                    { backgroundColor: type === 'CHECK' ? '#4CAF50' : '#2196F3' },
                  ]}
                >
                  <Text style={styles.previewTypeText}>{type === 'CHECK' ? '✓' : '#'}</Text>
                </View>
                <View>
                  <Text style={styles.previewName}>{name || 'Nombre del hábito'}</Text>
                  {description && (
                    <Text style={styles.previewDescription} numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.previewDetails}>
              <Text style={styles.previewDetailItem}>
                {PERIODICITY_OPTIONS.find((p) => p.value === periodicity)?.label || 'Diario'}
              </Text>
              <Text style={styles.previewDetailItem}>•</Text>
              <Text style={styles.previewDetailItem}>
                {TIME_OF_DAY_OPTIONS.find((t) => t.value === timeOfDay)?.icon}{' '}
                {TIME_OF_DAY_OPTIONS.find((t) => t.value === timeOfDay)?.label}
              </Text>
              {type === 'NUMERIC' && targetValue && (
                <>
                  <Text style={styles.previewDetailItem}>•</Text>
                  <Text style={styles.previewDetailItem}>
                    Meta: {targetValue} {unit || 'unidades'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212121',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  errorText: {
    marginTop: 4,
    fontSize: 13,
    color: '#F44336',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  categoryCardActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  typeLabelActive: {
    color: '#1976D2',
  },
  typeDescription: {
    fontSize: 12,
    color: '#999',
  },
  numericRow: {
    flexDirection: 'row',
    gap: 12,
  },
  numericInput: {
    flex: 1,
  },
  unitInput: {
    flex: 2,
  },
  periodicityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodicityButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 20,
  },
  periodicityButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  periodicityLabel: {
    fontSize: 14,
    color: '#666',
  },
  periodicityLabelActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weekDayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  weekDayButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  weekDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  weekDayTextActive: {
    color: '#fff',
  },
  customDaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customDaysInput: {
    flex: 1,
  },
  customDaysLabel: {
    fontSize: 16,
    color: '#666',
  },
  timeOfDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeOfDayButton: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  timeOfDayButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  timeOfDayIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  timeOfDayLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeOfDayLabelActive: {
    color: '#1976D2',
    fontWeight: '600',
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  // US-054: DateTimePicker styles
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  timeButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#212121',
  },
  permissionWarning: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    marginTop: 8,
    marginBottom: 8,
  },
  permissionWarningText: {
    fontSize: 13,
    color: '#E65100',
    marginBottom: 4,
  },
  permissionLink: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: '#212121',
    borderWidth: 3,
  },
  colorCheckmark: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  previewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewTypeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  previewTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewTypeText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  previewName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  previewDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  previewDetailItem: {
    fontSize: 13,
    color: '#999',
  },
});

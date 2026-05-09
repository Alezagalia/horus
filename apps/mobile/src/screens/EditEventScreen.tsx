/**
 * EditEventScreen
 * Sprint 8 - US-071
 *
 * Form to edit existing calendar events
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Scope } from '@horus/shared';
import { useEvent, useUpdateEvent, useDeleteEvent } from '../hooks/useEvents';
import { CategoryPicker } from '../components/CategoryPicker';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EditEventScreen({ navigation, route }: any) {
  const { eventId } = route.params;

  const { data: event, isLoading: loadingEvent, isError } = useEvent(eventId);
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();
  const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);
  const [status, setStatus] = useState<'pendiente' | 'completado' | 'cancelado'>('pendiente');
  const [initialized, setInitialized] = useState(false);

  // UI state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form once event loads
  useEffect(() => {
    if (event && !initialized) {
      setTitle(event.title);
      setDescription(event.description || '');
      setLocation(event.location || '');
      setCategoryId(event.categoryId);
      setStartDate(new Date(event.startDateTime));
      setEndDate(new Date(event.endDateTime));
      setIsAllDay(event.isAllDay);
      setSyncWithGoogle(event.syncWithGoogle);
      setStatus(event.status);
      setInitialized(true);
    }
  }, [event, initialized]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (title.length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
    }

    if (!categoryId) {
      newErrors.categoryId = 'La categoría es requerida';
    }

    if (location.length > 200) {
      newErrors.location = 'La ubicación no puede exceder 200 caracteres';
    }

    if (endDate < startDate) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    updateEvent(
      {
        id: eventId,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          categoryId,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
          isAllDay,
          status,
        },
      },
      {
        onSuccess: () => {
          navigation.goBack();
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          const message = error?.response?.data?.message || 'Error al actualizar el evento.';
          Alert.alert('Error', message);
        },
      }
    );
  };

  const handleDelete = () => {
    Alert.alert('Eliminar evento', '¿Estás seguro de que deseas eliminar este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deleteEvent(eventId, {
            onSuccess: () => {
              navigation.goBack();
            },
            onError: () => {
              Alert.alert('Error', 'No se pudo eliminar el evento');
            },
          });
        },
      },
    ]);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  if (loadingEvent) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isError || !event) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorMessage}>No se pudo cargar el evento</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isBusy = isUpdating || isDeleting;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isBusy}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Evento</Text>
        <TouchableOpacity onPress={handleDelete} disabled={isBusy}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Título del evento"
            placeholderTextColor="#9CA3AF"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Category */}
        <CategoryPicker
          value={categoryId}
          onChange={setCategoryId}
          error={errors.categoryId}
          scope={Scope.EVENTOS}
        />

        {/* Status */}
        <View style={styles.field}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.statusButtons}>
            {(['pendiente', 'completado', 'cancelado'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusButton, status === s && styles.statusButtonActive]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[styles.statusButtonText, status === s && styles.statusButtonTextActive]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción del evento"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, styles.inputWithIconText, errors.location && styles.inputError]}
              value={location}
              onChangeText={setLocation}
              placeholder="Agregar ubicación"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* All Day Toggle */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Todo el día</Text>
            <Switch
              value={isAllDay}
              onValueChange={setIsAllDay}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={isAllDay ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Start Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Inicio</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowStartDatePicker(Platform.OS === 'ios');
                if (date) setStartDate(date);
              }}
            />
          )}
        </View>

        {/* Start Time (if not all day) */}
        {!isAllDay && (
          <View style={styles.field}>
            <Text style={styles.label}>Hora de inicio</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>{formatTime(startDate)}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker
                value={startDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowStartTimePicker(Platform.OS === 'ios');
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>
        )}

        {/* End Date */}
        <View style={styles.field}>
          <Text style={styles.label}>Fin</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => {
                setShowEndDatePicker(Platform.OS === 'ios');
                if (date) setEndDate(date);
              }}
            />
          )}
          {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
        </View>

        {/* End Time (if not all day) */}
        {!isAllDay && (
          <View style={styles.field}>
            <Text style={styles.label}>Hora de fin</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>{formatTime(endDate)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker
                value={endDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowEndTimePicker(Platform.OS === 'ios');
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>
        )}

        {/* Sync with Google */}
        <View style={styles.field}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.label, { marginLeft: 8 }]}>Sincronizar con Google</Text>
            </View>
            <Switch
              value={syncWithGoogle}
              onValueChange={setSyncWithGoogle}
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={syncWithGoogle ? '#3B82F6' : '#F3F4F6'}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isBusy && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isBusy}
        >
          {isUpdating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Guardar Cambios</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputWithIconText: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 0,
    padding: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

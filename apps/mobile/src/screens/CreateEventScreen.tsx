/**
 * CreateEventScreen
 * Sprint 8 - US-071
 *
 * Form to create new calendar events
 */

import { useState } from 'react';
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export function CreateEventScreen({ navigation, route }: any) {
  const { selectedDate } = route.params || {};

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [endDate, setEndDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [syncWithGoogle, setSyncWithGoogle] = useState(false);
  const [loading, setLoading] = useState(false);

  // UI state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (title.length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/events`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify({
      //     title,
      //     description,
      //     location,
      //     categoryId: 'default-category-id', // TODO: Category selector
      //     startDateTime: startDate.toISOString(),
      //     endDateTime: endDate.toISOString(),
      //     isAllDay,
      //     syncWithGoogle,
      //   }),
      // });

      // Mock success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error creating event:', error);
      setErrors({ submit: 'Error al crear el evento. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Evento</Text>
        <View style={{ width: 24 }} />
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

        {/* Submit Error */}
        {errors.submit && (
          <View style={styles.submitError}>
            <Text style={styles.errorText}>{errors.submit}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Crear Evento</Text>
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
  submitError: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
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

/**
 * HabitDetailScreen - Habit Detail View
 * Sprint 3 - US-025
 * Sprint 6 - US-052: Added audit history access
 *
 * Shows complete habit configuration and quick stats
 */

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHabitById, deleteHabit } from '../api/habits.api';

interface HabitDetailScreenProps {
  habitId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewStats?: () => void;
  onViewAudit?: () => void;
}

const PERIODICITY_LABELS: Record<string, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  CUSTOM: 'Personalizado',
};

const TIME_OF_DAY_LABELS: Record<string, string> = {
  MANANA: '🌅 Mañana',
  TARDE: '☀️ Tarde',
  NOCHE: '🌙 Noche',
  ANYTIME: '⏰ Cualquier momento',
};

const WEEK_DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function HabitDetailScreen({
  habitId,
  onEdit,
  onDelete,
  onViewStats,
  onViewAudit,
}: HabitDetailScreenProps) {
  const queryClient = useQueryClient();

  // Fetch habit details
  const {
    data: habit,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['habit', habitId],
    queryFn: () => getHabitById(habitId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      onDelete?.();
    },
  });

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
    // Navigation handled by wrapper
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar hábito',
      `¿Eliminar '${habit?.name}'? Se mantendrá el historial pero no aparecerá en tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(habitId, {
              onSuccess: () => {
                // Toast handled by wrapper/navigation layer
                onDelete?.();
              },
              onError: () => {
                Alert.alert('Error', 'No se pudo eliminar el hábito');
              },
            });
          },
        },
      ]
    );
  };

  const handleViewStats = () => {
    if (onViewStats) {
      onViewStats();
    }
    // Navigation handled by wrapper
  };

  const handleViewAudit = () => {
    if (onViewAudit) {
      onViewAudit();
    }
    // Navigation handled by wrapper
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando hábito...</Text>
      </View>
    );
  }

  if (error || !habit) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>No se pudo cargar el hábito</Text>
      </View>
    );
  }

  const typeColor = habit.type === 'CHECK' ? '#4CAF50' : '#2196F3';
  const cardColor = habit.color || habit.category.color || '#9E9E9E';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderTopColor: cardColor }]}>
        <View style={styles.headerContent}>
          <Text style={styles.categoryIcon}>{habit.category.icon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.habitName}>{habit.name}</Text>
            <Text style={styles.categoryName}>{habit.category.name}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Description */}
        {habit.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{habit.description}</Text>
          </View>
        )}

        {/* Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
          <View style={styles.card}>
            {/* Type */}
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Tipo</Text>
              <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
                <Text style={styles.typeBadgeText}>
                  {habit.type === 'CHECK' ? '✓ Checkbox' : '# Numérico'}
                </Text>
              </View>
            </View>

            {/* Target (if numeric) */}
            {habit.type === 'NUMERIC' && habit.targetValue && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Objetivo</Text>
                <Text style={styles.configValue}>
                  {habit.targetValue} {habit.unit || 'unidades'}
                </Text>
              </View>
            )}

            {/* Periodicity */}
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Periodicidad</Text>
              <Text style={styles.configValue}>{PERIODICITY_LABELS[habit.periodicity]}</Text>
            </View>

            {/* Week Days (if weekly) */}
            {habit.periodicity === 'WEEKLY' && habit.weekDays.length > 0 && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Días</Text>
                <View style={styles.weekDaysContainer}>
                  {habit.weekDays.map((dayIndex) => (
                    <View key={dayIndex} style={styles.weekDayChip}>
                      <Text style={styles.weekDayChipText}>{WEEK_DAYS[dayIndex]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Time of Day */}
            <View style={styles.configRow}>
              <Text style={styles.configLabel}>Momento</Text>
              <Text style={styles.configValue}>{TIME_OF_DAY_LABELS[habit.timeOfDay]}</Text>
            </View>

            {/* Reminder */}
            {habit.reminderTime && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Recordatorio</Text>
                <Text style={styles.configValue}>🔔 {habit.reminderTime}</Text>
              </View>
            )}

            {/* Color */}
            {habit.color && (
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Color</Text>
                <View style={[styles.colorPreview, { backgroundColor: habit.color }]} />
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas Rápidas</Text>
          <View style={styles.card}>
            <View style={styles.statsGrid}>
              {/* Current Streak */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>🔥 0</Text>
                <Text style={styles.statLabel}>Racha actual</Text>
              </View>

              {/* Best Streak */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>🏆 0</Text>
                <Text style={styles.statLabel}>Récord de racha</Text>
              </View>

              {/* Days Completed (last 30) */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>✓ 0</Text>
                <Text style={styles.statLabel}>Días (últimos 30)</Text>
              </View>

              {/* Completion Rate */}
              <View style={styles.statCard}>
                <Text style={styles.statValue}>📈 0%</Text>
                <Text style={styles.statLabel}>Tasa completado</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.viewStatsButton} onPress={handleViewStats}>
              <Text style={styles.viewStatsButtonText}>Ver Estadísticas Completas</Text>
              <Text style={styles.viewStatsButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.section}>
          <Text style={styles.metadataText}>
            Creado: {new Date(habit.createdAt).toLocaleDateString('es-ES')}
          </Text>
          <Text style={styles.metadataText}>
            Última modificación: {new Date(habit.updatedAt).toLocaleDateString('es-ES')}
          </Text>
        </View>

        {/* Audit History Button - US-052 */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.auditButton} onPress={handleViewAudit}>
            <Text style={styles.auditButtonText}>📋 Ver Historial de Cambios</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Eliminar Hábito</Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderTopWidth: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  habitName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
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
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#424242',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  configLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  configValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '600',
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '60%',
  },
  weekDayChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekDayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  viewStatsButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  viewStatsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
    marginRight: 6,
  },
  viewStatsButtonIcon: {
    fontSize: 18,
    color: '#1976D2',
  },
  metadataText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  auditButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  auditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

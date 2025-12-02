/**
 * TaskFilterBar Component
 * Sprint 7 - US-061
 *
 * Barra de filtros con chips para:
 * - Estado (Todas, Pendientes, En Progreso, Completadas)
 * - Prioridad (Todas, Alta, Media, Baja)
 * - Fecha (Todas, Vencidas, Hoy, Esta Semana, Sin Fecha)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TaskStatus, Priority } from '../api/tasks.api';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | Priority;
type DateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

interface TaskFilterBarProps {
  selectedStatus: StatusFilter;
  selectedPriority: PriorityFilter;
  selectedDateFilter: DateFilter;
  onStatusChange: (status: StatusFilter) => void;
  onPriorityChange: (priority: PriorityFilter) => void;
  onDateFilterChange: (dateFilter: DateFilter) => void;
}

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  selectedStatus,
  selectedPriority,
  selectedDateFilter,
  onStatusChange,
  onPriorityChange,
  onDateFilterChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Estado Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Estado</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          <FilterChip
            label="Todas"
            selected={selectedStatus === 'all'}
            onPress={() => onStatusChange('all')}
          />
          <FilterChip
            label="Pendientes"
            selected={selectedStatus === 'pendiente'}
            onPress={() => onStatusChange('pendiente')}
          />
          <FilterChip
            label="En Progreso"
            selected={selectedStatus === 'en_progreso'}
            onPress={() => onStatusChange('en_progreso')}
          />
          <FilterChip
            label="Completadas"
            selected={selectedStatus === 'completada'}
            onPress={() => onStatusChange('completada')}
          />
        </ScrollView>
      </View>

      {/* Prioridad Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Prioridad</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          <FilterChip
            label="Todas"
            selected={selectedPriority === 'all'}
            onPress={() => onPriorityChange('all')}
          />
          <FilterChip
            label="Alta"
            selected={selectedPriority === 'alta'}
            onPress={() => onPriorityChange('alta')}
            color="#FFB3B3"
          />
          <FilterChip
            label="Media"
            selected={selectedPriority === 'media'}
            onPress={() => onPriorityChange('media')}
            color="#FFEB9C"
          />
          <FilterChip
            label="Baja"
            selected={selectedPriority === 'baja'}
            onPress={() => onPriorityChange('baja')}
            color="#C6E0B4"
          />
        </ScrollView>
      </View>

      {/* Fecha Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Vencimiento</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          <FilterChip
            label="Todas"
            selected={selectedDateFilter === 'all'}
            onPress={() => onDateFilterChange('all')}
          />
          <FilterChip
            label="Vencidas"
            selected={selectedDateFilter === 'overdue'}
            onPress={() => onDateFilterChange('overdue')}
          />
          <FilterChip
            label="Hoy"
            selected={selectedDateFilter === 'today'}
            onPress={() => onDateFilterChange('today')}
          />
          <FilterChip
            label="Esta Semana"
            selected={selectedDateFilter === 'week'}
            onPress={() => onDateFilterChange('week')}
          />
          <FilterChip
            label="Sin Fecha"
            selected={selectedDateFilter === 'none'}
            onPress={() => onDateFilterChange('none')}
          />
        </ScrollView>
      </View>
    </View>
  );
};

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress, color }) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        color && selected && { backgroundColor: color },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginLeft: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chipContainer: {
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  chipSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
});

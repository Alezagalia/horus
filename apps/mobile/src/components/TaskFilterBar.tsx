/**
 * TaskFilterBar Component
 * Sprint 7 - US-061
 *
 * Fila única de chips con dropdown inline.
 * - Estado, Prioridad y Fecha como chips scrollables
 * - Chip activo muestra la selección + botón × para limpiar
 * - Chip inactivo muestra chevron para expandir
 * - Un solo dropdown abierto a la vez
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskStatus, Priority } from '../api/tasks.api';

type StatusFilter = 'all' | TaskStatus;
type PriorityFilter = 'all' | Priority;
type DateFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';
type DropdownType = 'status' | 'priority' | 'date' | null;

interface TaskFilterBarProps {
  selectedStatus: StatusFilter;
  selectedPriority: PriorityFilter;
  selectedDateFilter: DateFilter;
  onStatusChange: (status: StatusFilter) => void;
  onPriorityChange: (priority: PriorityFilter) => void;
  onDateFilterChange: (dateFilter: DateFilter) => void;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'Todas', icon: 'apps-outline' },
  { value: 'pendiente', label: 'Pendiente', icon: 'ellipse-outline' },
  { value: 'en_progreso', label: 'En Progreso', icon: 'time-outline' },
  { value: 'completada', label: 'Completada', icon: 'checkmark-circle-outline' },
  { value: 'cancelada', label: 'Cancelada', icon: 'close-circle-outline' },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string; color: string | null }[] = [
  { value: 'all', label: 'Todas', color: null },
  { value: 'alta', label: 'Alta', color: '#EF4444' },
  { value: 'media', label: 'Media', color: '#F59E0B' },
  { value: 'baja', label: 'Baja', color: '#22C55E' },
];

const DATE_OPTIONS: { value: DateFilter; label: string; icon: string }[] = [
  { value: 'all', label: 'Cualquier fecha', icon: 'calendar-outline' },
  { value: 'today', label: 'Hoy', icon: 'today-outline' },
  { value: 'week', label: 'Esta semana', icon: 'calendar-outline' },
  { value: 'overdue', label: 'Vencidas', icon: 'alert-circle-outline' },
  { value: 'none', label: 'Sin fecha', icon: 'remove-circle-outline' },
];

export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  selectedStatus,
  selectedPriority,
  selectedDateFilter,
  onStatusChange,
  onPriorityChange,
  onDateFilterChange,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);

  const toggleDropdown = (type: Exclude<DropdownType, null>) => {
    setActiveDropdown((prev) => (prev === type ? null : type));
  };

  const closeDropdown = () => setActiveDropdown(null);

  const statusLabel =
    selectedStatus === 'all'
      ? 'Estado'
      : (STATUS_OPTIONS.find((o) => o.value === selectedStatus)?.label ?? 'Estado');

  const priorityLabel =
    selectedPriority === 'all'
      ? 'Prioridad'
      : (PRIORITY_OPTIONS.find((o) => o.value === selectedPriority)?.label ?? 'Prioridad');

  const dateLabel =
    selectedDateFilter === 'all'
      ? 'Fecha'
      : (DATE_OPTIONS.find((o) => o.value === selectedDateFilter)?.label ?? 'Fecha');

  const priorityActiveColor =
    selectedPriority !== 'all'
      ? (PRIORITY_OPTIONS.find((o) => o.value === selectedPriority)?.color ?? undefined)
      : undefined;

  return (
    <View style={styles.wrapper}>
      {/* Chip Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <FilterChip
          icon="ellipse-outline"
          label={statusLabel}
          isActive={selectedStatus !== 'all'}
          isOpen={activeDropdown === 'status'}
          onPress={() => toggleDropdown('status')}
          onClear={
            selectedStatus !== 'all'
              ? () => {
                  onStatusChange('all');
                  closeDropdown();
                }
              : undefined
          }
        />

        <FilterChip
          icon="flag-outline"
          label={priorityLabel}
          isActive={selectedPriority !== 'all'}
          isOpen={activeDropdown === 'priority'}
          activeColor={priorityActiveColor}
          onPress={() => toggleDropdown('priority')}
          onClear={
            selectedPriority !== 'all'
              ? () => {
                  onPriorityChange('all');
                  closeDropdown();
                }
              : undefined
          }
        />

        <FilterChip
          icon="calendar-outline"
          label={dateLabel}
          isActive={selectedDateFilter !== 'all'}
          isOpen={activeDropdown === 'date'}
          onPress={() => toggleDropdown('date')}
          onClear={
            selectedDateFilter !== 'all'
              ? () => {
                  onDateFilterChange('all');
                  closeDropdown();
                }
              : undefined
          }
        />
      </ScrollView>

      {/* Dropdown Panels */}
      {activeDropdown === 'status' && (
        <DropdownPanel>
          {STATUS_OPTIONS.map((opt) => (
            <DropdownOption
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={selectedStatus === opt.value}
              onPress={() => {
                onStatusChange(opt.value);
                closeDropdown();
              }}
            />
          ))}
        </DropdownPanel>
      )}

      {activeDropdown === 'priority' && (
        <DropdownPanel>
          {PRIORITY_OPTIONS.map((opt) => (
            <DropdownOption
              key={opt.value}
              label={opt.label}
              dot={opt.color ?? undefined}
              selected={selectedPriority === opt.value}
              onPress={() => {
                onPriorityChange(opt.value);
                closeDropdown();
              }}
            />
          ))}
        </DropdownPanel>
      )}

      {activeDropdown === 'date' && (
        <DropdownPanel>
          {DATE_OPTIONS.map((opt) => (
            <DropdownOption
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              selected={selectedDateFilter === opt.value}
              onPress={() => {
                onDateFilterChange(opt.value);
                closeDropdown();
              }}
            />
          ))}
        </DropdownPanel>
      )}

      <View style={styles.divider} />
    </View>
  );
};

// ─── FilterChip ──────────────────────────────────────────────────────────────

interface FilterChipProps {
  icon: string;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  activeColor?: string;
  onPress: () => void;
  onClear?: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({
  icon,
  label,
  isActive,
  isOpen,
  activeColor,
  onPress,
  onClear,
}) => {
  const bg = isActive ? (activeColor ?? '#2196F3') : '#F0F1F3';
  const textColor = isActive ? '#FFF' : '#555';
  const iconColor = isActive ? 'rgba(255,255,255,0.85)' : '#888';

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bg }, isOpen && !isActive && styles.chipOpenInactive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Ionicons name={icon as any} size={14} color={iconColor} style={styles.chipIcon} />
      <Text style={[styles.chipLabel, { color: textColor }]}>{label}</Text>
      {isActive && onClear ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.chipAction}
        >
          <Ionicons name="close" size={14} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      ) : (
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={13}
          color={iconColor}
          style={styles.chipAction}
        />
      )}
    </TouchableOpacity>
  );
};

// ─── DropdownPanel ────────────────────────────────────────────────────────────

const DropdownPanel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.dropdown}>{children}</View>
);

// ─── DropdownOption ───────────────────────────────────────────────────────────

interface DropdownOptionProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  dot?: string;
}

const DropdownOption: React.FC<DropdownOptionProps> = ({ label, selected, onPress, icon, dot }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconName = icon as any;
  return (
    <TouchableOpacity style={styles.option} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.optionLeft}>
        {dot ? (
          <View style={[styles.optionDot, { backgroundColor: dot }]} />
        ) : icon ? (
          <Ionicons
            name={iconName}
            size={16}
            color={selected ? '#2196F3' : '#999'}
            style={styles.optionIcon}
          />
        ) : null}
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
      </View>
      {selected && <Ionicons name="checkmark" size={16} color="#2196F3" />}
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipOpenInactive: {
    backgroundColor: '#E4E6EA',
  },
  chipIcon: {
    marginRight: 5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipAction: {
    marginLeft: 4,
  },
  dropdown: {
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    paddingVertical: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionLabel: {
    fontSize: 14,
    color: '#444',
  },
  optionLabelSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEFF1',
  },
});

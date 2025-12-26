/**
 * ResourceFilters Component
 * Fase 3 - Mobile Implementation
 * Search and filter controls for resources
 */

import { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ScrollView,
} from 'react-native';
import { ResourceType, ResourceFilters as IResourceFilters } from '@horus/shared';

interface ResourceFiltersProps {
  filters: IResourceFilters;
  onFiltersChange: (filters: IResourceFilters) => void;
}

const TYPE_OPTIONS: Array<{ value: ResourceType | 'all'; label: string; icon: string }> = [
  { value: 'all', label: 'Todos', icon: '📚' },
  { value: ResourceType.NOTE, label: 'Notas', icon: '📝' },
  { value: ResourceType.SNIPPET, label: 'Código', icon: '💻' },
  { value: ResourceType.BOOKMARK, label: 'Enlaces', icon: '🔖' },
];

export function ResourceFilters({ filters, onFiltersChange }: ResourceFiltersProps) {
  const [searchText, setSearchText] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.length >= 3 || searchText.length === 0) {
        // Actualizar filtros cuando el usuario deja de escribir
        // (esto se maneja directamente en el screen)
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleTypeFilter = (type: ResourceType | 'all') => {
    onFiltersChange({
      ...filters,
      type: type === 'all' ? undefined : type,
    });
  };

  const handlePinnedFilter = () => {
    onFiltersChange({
      ...filters,
      isPinned: filters.isPinned === true ? undefined : true,
    });
  };

  const handleClearFilters = () => {
    setSearchText('');
    onFiltersChange({});
  };

  const hasActiveFilters = filters.type || filters.isPinned !== undefined || searchText;

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar recursos..."
          placeholderTextColor="#999"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {/* Type filters */}
        {TYPE_OPTIONS.map((option) => {
          const isActive =
            (option.value === 'all' && !filters.type) || option.value === filters.type;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handleTypeFilter(option.value)}
            >
              <Text style={styles.chipIcon}>{option.icon}</Text>
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Pinned filter */}
        <TouchableOpacity
          style={[styles.chip, filters.isPinned && styles.chipActive]}
          onPress={handlePinnedFilter}
        >
          <Text style={styles.chipIcon}>📌</Text>
          <Text
            style={[styles.chipText, filters.isPinned && styles.chipTextActive]}
          >
            Fijados
          </Text>
        </TouchableOpacity>

        {/* Clear all */}
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
            <Text style={styles.clearButtonText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
    paddingHorizontal: 4,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  chipTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D32F2F',
  },
});

/**
 * ResourcesScreen
 * Fase 3 - Mobile Implementation
 * Main screen for viewing and managing resources
 */

import { useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ResourceFilters } from '../components/resources/ResourceFilters';
import {
  useResources,
  useDeleteResource,
  useTogglePin,
} from '../hooks/useResources';
import type { Resource, ResourceFilters as IResourceFilters } from '@horus/shared';

type NavigationProp = NativeStackNavigationProp<any>;

export function ResourcesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [filters, setFilters] = useState<IResourceFilters>({});

  const { data: resources = [], isLoading, refetch } = useResources(filters);
  const deleteMutation = useDeleteResource();
  const togglePinMutation = useTogglePin();

  const handleCreateResource = () => {
    navigation.navigate('CreateResource');
  };

  const handleResourcePress = (resource: Resource) => {
    navigation.navigate('ResourceDetail', { resourceId: resource.id });
  };

  const handleDelete = (resource: Resource) => {
    Alert.alert(
      'Eliminar Resource',
      `¿Estás seguro de que quieres eliminar "${resource.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(resource.id),
        },
      ]
    );
  };

  const handleTogglePin = (resource: Resource) => {
    togglePinMutation.mutate(resource.id);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>
        {filters.type || filters.isPinned
          ? 'No se encontraron recursos'
          : 'No hay recursos aún'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filters.type || filters.isPinned
          ? 'Intenta ajustar los filtros'
          : 'Crea tu primer recurso para empezar'}
      </Text>
      {!filters.type && !filters.isPinned && (
        <TouchableOpacity style={styles.emptyButton} onPress={handleCreateResource}>
          <Text style={styles.emptyButtonText}>+ Crear Resource</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Conocimiento</Text>
          <Text style={styles.headerSubtitle}>
            {resources.length} {resources.length === 1 ? 'recurso' : 'recursos'}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateResource}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ResourceFilters filters={filters} onFiltersChange={setFilters} />

      {/* Resource List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Cargando recursos...</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={handleResourcePress}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            resources.length === 0 ? styles.emptyListContainer : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={['#2196F3']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
});

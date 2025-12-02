/**
 * HabitAuditScreen - Habit Audit History Timeline
 * Sprint 6 - US-052
 *
 * Displays the audit history of a habit in a visual timeline format
 */

import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getHabitAuditHistory, type HabitAuditLog } from '../api/habits.api';
import { TimelineItem } from '../components/habits/TimelineItem';
import { EmptyState } from '../components/common/EmptyState';

interface HabitAuditScreenProps {
  habitId: string;
}

export function HabitAuditScreen({ habitId }: HabitAuditScreenProps) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['habitAudit', habitId],
    queryFn: () => getHabitAuditHistory(habitId, 50),
  });

  const handleRefresh = () => {
    refetch();
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>
          No se pudo cargar el historial de cambios. Por favor, intenta nuevamente.
        </Text>
      </View>
    );
  }

  // Empty state
  if (!data?.auditLogs || data.auditLogs.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="📋"
          title="Sin cambios registrados"
          description="Este hábito no tiene cambios en su historial aún. Los cambios futuros aparecerán aquí."
        />
      </View>
    );
  }

  // Render timeline
  const renderItem = ({ item }: { item: HabitAuditLog }) => <TimelineItem log={item} />;

  const renderListHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Historial de Cambios</Text>
      <Text style={styles.headerSubtitle}>
        {data.total} {data.total === 1 ? 'cambio registrado' : 'cambios registrados'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data.auditLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#757575',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSyncStore } from '@/store/syncStore';
import { syncNow } from '@/db/syncScheduler';
import { Colors } from '@/tokens';

/**
 * Indicador discreto del estado del sync offline-first (dominio Dinero).
 * - spinner: sincronizando
 * - punto ámbar: hay cambios locales pendientes de subir
 * - punto verde: todo sincronizado
 * Tocarlo fuerza un sync inmediato.
 */
export function SyncStatusDot() {
  const { isSyncing, hasPending, lastError } = useSyncStore();

  return (
    <Pressable
      onPress={() => void syncNow()}
      hitSlop={12}
      style={styles.container}
      accessibilityLabel={
        isSyncing
          ? 'Sincronizando'
          : hasPending
            ? 'Cambios pendientes de sincronizar'
            : 'Sincronizado'
      }
    >
      {isSyncing ? (
        <ActivityIndicator size="small" color={Colors.ceil} />
      ) : (
        <View style={styles.row}>
          <View
            style={[
              styles.dot,
              hasPending ? styles.dotPending : lastError ? styles.dotError : styles.dotOk,
            ]}
          />
          {hasPending ? <Text style={styles.label}>sin subir</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    minHeight: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOk: { backgroundColor: '#10B981' },
  dotPending: { backgroundColor: '#F59E0B' },
  dotError: { backgroundColor: '#EF4444' },
  label: { fontSize: 11, color: Colors.muted },
});

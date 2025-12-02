/**
 * CalendarSyncScreen
 * Sprint 8 - US-072
 *
 * Screen for managing Google Calendar synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import {
  getGoogleCalendarStatus,
  getGoogleAuthUrl,
  completeGoogleAuth,
  disconnectGoogleCalendar,
  syncFromGoogle,
} from '../services/googleSyncService';

// Enable dismissal of web browser on Android
WebBrowser.maybeCompleteAuthSession();

interface SyncStatus {
  isConnected: boolean;
  email?: string;
  lastSync?: string;
  autoSync?: boolean;
}

export function CalendarSyncScreen({ navigation }: any) {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: false,
    autoSync: false,
  });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Load sync status
  const loadStatus = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const syncStatus = await getGoogleCalendarStatus();
      setStatus(syncStatus);
    } catch (err) {
      console.error('Error loading sync status:', err);
      setError('Error al cargar el estado de sincronización');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle Google connection
  const handleConnect = async () => {
    try {
      setConnecting(true);
      setError(null);

      // Get authorization URL from backend
      const authUrl = await getGoogleAuthUrl();

      // Open browser for OAuth flow
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'exp://localhost:8081' // TODO: Update with actual redirect URI
      );

      if (result.type === 'success' && result.url) {
        // Extract authorization code from callback URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          // Complete OAuth flow
          await completeGoogleAuth(code);

          // Reload status
          await loadStatus();

          // Show success message
          Alert.alert('Conectado', 'Tu cuenta de Google se conectó exitosamente', [{ text: 'OK' }]);

          // Trigger initial sync
          handleSync();
        } else {
          throw new Error('No se recibió el código de autorización');
        }
      } else if (result.type === 'cancel') {
        // User cancelled
        setError('Conexión cancelada');
      }
    } catch (err: any) {
      console.error('Error connecting to Google:', err);
      setError(err.message || 'Error al conectar con Google Calendar');
      Alert.alert('Error', 'No se pudo conectar con Google Calendar. Intenta nuevamente.', [
        { text: 'OK' },
      ]);
    } finally {
      setConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    Alert.alert(
      'Desconectar Google Calendar',
      '¿Desconectar Google Calendar? Los eventos sincronizados se mantendrán pero no se actualizarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);

              await disconnectGoogleCalendar();
              await loadStatus();

              Alert.alert('Desconectado', 'Tu cuenta de Google se desconectó exitosamente', [
                { text: 'OK' },
              ]);
            } catch (err: any) {
              console.error('Error disconnecting:', err);
              setError('Error al desconectar Google Calendar');
              Alert.alert('Error', 'No se pudo desconectar. Intenta nuevamente.', [{ text: 'OK' }]);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle manual sync
  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      setSyncResult(null);

      const result = await syncFromGoogle();

      const message = `${result.imported} eventos importados, ${result.updated} actualizados`;
      setSyncResult(message);

      Alert.alert('Sincronización completada', message, [{ text: 'OK' }]);
    } catch (err: any) {
      console.error('Error syncing:', err);
      setError('Error al sincronizar con Google Calendar');
      Alert.alert('Error', 'No se pudo sincronizar. Intenta nuevamente.', [{ text: 'OK' }]);
    } finally {
      setSyncing(false);
    }
  };

  // Handle auto-sync toggle
  const handleAutoSyncToggle = async (value: boolean) => {
    try {
      // TODO: Implement API call to update auto-sync setting
      setStatus((prev) => ({ ...prev, autoSync: value }));

      // Show feedback
      Alert.alert(
        value ? 'Sincronización automática activada' : 'Sincronización automática desactivada',
        value
          ? 'Los eventos se sincronizarán automáticamente cada hora'
          : 'Solo se sincronizarán los eventos cuando lo solicites manualmente',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error toggling auto-sync:', err);
      // Revert toggle
      setStatus((prev) => ({ ...prev, autoSync: !value }));
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Nunca';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sincronización</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadStatus(true)} />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success Banner */}
        {syncResult && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
            <Text style={styles.successText}>{syncResult}</Text>
          </View>
        )}

        {/* Connection Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Conexión</Text>

          {!status.isConnected ? (
            <View style={styles.card}>
              <View style={styles.disconnectedState}>
                <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
                <Text style={styles.disconnectedTitle}>No conectado</Text>
                <Text style={styles.disconnectedDescription}>
                  Conecta tu cuenta de Google para sincronizar eventos automáticamente
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.googleButton, connecting && styles.googleButtonDisabled]}
                onPress={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                    <Text style={styles.googleButtonText}>Conectar con Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.connectedHeader}>
                <View style={styles.connectedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text style={styles.connectedBadgeText}>Conectado</Text>
                </View>
              </View>

              <View style={styles.connectedInfo}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.connectedEmail}>{status.email || 'Google Account'}</Text>
              </View>

              <View style={styles.connectedInfo}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={styles.connectedLastSync}>
                  Última sincronización: {formatRelativeTime(status.lastSync)}
                </Text>
              </View>

              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectButtonText}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sync Options Section */}
        {status.isConnected && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Opciones de Sincronización</Text>

              <View style={styles.card}>
                {/* Auto-sync toggle */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabel}>
                    <Ionicons name="sync-outline" size={20} color="#6B7280" />
                    <View style={styles.toggleTextContainer}>
                      <Text style={styles.toggleTitle}>Sincronizar automáticamente</Text>
                      <Text style={styles.toggleDescription}>Sincroniza eventos cada hora</Text>
                    </View>
                  </View>
                  <Switch
                    value={status.autoSync}
                    onValueChange={handleAutoSyncToggle}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={status.autoSync ? '#3B82F6' : '#F3F4F6'}
                  />
                </View>

                {/* Manual sync button */}
                <TouchableOpacity
                  style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
                  onPress={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <ActivityIndicator color="#3B82F6" size="small" />
                      <Text style={[styles.syncButtonText, { marginLeft: 8 }]}>
                        Sincronizando...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={20} color="#3B82F6" />
                      <Text style={styles.syncButtonText}>Sincronizar ahora</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información</Text>

              <View style={styles.card}>
                <Text style={styles.infoText}>La sincronización con Google Calendar permite:</Text>
                <View style={styles.infoList}>
                  <View style={styles.infoListItem}>
                    <Ionicons name="checkmark" size={16} color="#059669" />
                    <Text style={styles.infoListText}>Importar eventos desde Google Calendar</Text>
                  </View>
                  <View style={styles.infoListItem}>
                    <Ionicons name="checkmark" size={16} color="#059669" />
                    <Text style={styles.infoListText}>Exportar eventos creados en Horus</Text>
                  </View>
                  <View style={styles.infoListItem}>
                    <Ionicons name="checkmark" size={16} color="#059669" />
                    <Text style={styles.infoListText}>
                      Mantener eventos actualizados en ambos lugares
                    </Text>
                  </View>
                </View>

                <Text style={styles.infoNote}>
                  Tus datos están seguros. Solo accedemos a tu calendario para sincronizar eventos.
                </Text>
              </View>
            </View>
          </>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#059669',
    marginLeft: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disconnectedState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  disconnectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  disconnectedDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  connectedHeader: {
    marginBottom: 16,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedEmail: {
    fontSize: 15,
    color: '#111827',
    marginLeft: 12,
  },
  connectedLastSync: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  disconnectButton: {
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  infoList: {
    marginBottom: 16,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoListText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  infoNote: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

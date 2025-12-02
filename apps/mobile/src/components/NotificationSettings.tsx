/**
 * Notification Settings Component
 * Sprint 12 - US-106
 *
 * Componente para configurar notificaciones push
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import {
  getNotificationPermissions,
  registerForPushNotifications,
  unregisterPushNotifications,
  canReceivePushNotifications,
  PushNotificationPermissions,
} from '../services/push-notifications';

export interface NotificationSettingsProps {
  /**
   * Callback cuando cambia el estado de notificaciones
   */
  onNotificationsToggled?: (enabled: boolean) => void;
}

export function NotificationSettings({ onNotificationsToggled }: NotificationSettingsProps) {
  const [permissions, setPermissions] = useState<PushNotificationPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const perms = await getNotificationPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        // Habilitar notificaciones
        const token = await registerForPushNotifications();
        if (token) {
          setPushToken(token);
          await loadPermissions();
          onNotificationsToggled?.(true);
          Alert.alert(
            '¡Notificaciones activadas!',
            'Recibirás recordatorios de tus hábitos en los horarios que configures.'
          );
        } else {
          Alert.alert(
            'Permisos denegados',
            'No se pudieron activar las notificaciones. Por favor, revisa los permisos en la configuración de tu dispositivo.'
          );
        }
      } else {
        // Deshabilitar notificaciones
        if (pushToken) {
          await unregisterPushNotifications(pushToken);
          setPushToken(null);
        }
        await loadPermissions();
        onNotificationsToggled?.(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'No se pudo cambiar la configuración de notificaciones.');
    }
  };

  const openSystemSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  if (!canReceivePushNotifications()) {
    return (
      <View style={styles.container}>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Las notificaciones push no están disponibles en{' '}
            {Platform.OS === 'web' ? 'la web' : 'emuladores'}.
          </Text>
          <Text style={styles.warningSubtext}>
            Usa un dispositivo físico para recibir notificaciones.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  const isEnabled = permissions?.granted ?? false;
  const canAskAgain = permissions?.canAskAgain ?? true;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Notificaciones Push</Text>
            <Text style={styles.subtitle}>
              {isEnabled
                ? 'Recibirás recordatorios de tus hábitos'
                : 'Activa para recibir recordatorios'}
            </Text>
          </View>
          <Switch
            value={isEnabled}
            onValueChange={handleToggleNotifications}
            disabled={!canAskAgain && !isEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        {/* Estado detallado en iOS */}
        {Platform.OS === 'ios' && permissions?.ios && (
          <View style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>Permisos iOS:</Text>
            <Text style={styles.detailText}>
              • Alertas: {permissions.ios.allowsAlert ? '✅' : '❌'}
            </Text>
            <Text style={styles.detailText}>
              • Sonidos: {permissions.ios.allowsSound ? '✅' : '❌'}
            </Text>
            <Text style={styles.detailText}>
              • Badges: {permissions.ios.allowsBadge ? '✅' : '❌'}
            </Text>
          </View>
        )}

        {/* Mensaje si permisos denegados permanentemente */}
        {!isEnabled && !canAskAgain && (
          <View style={styles.deniedBox}>
            <Text style={styles.deniedText}>
              ❌ Los permisos de notificaciones fueron denegados.
            </Text>
            <TouchableOpacity style={styles.settingsButton} onPress={openSystemSettings}>
              <Text style={styles.settingsButtonText}>Abrir Configuración del Sistema</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info adicional */}
        {isEnabled && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Configura los horarios de recordatorio en cada hábito para recibir notificaciones
              personalizadas.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  detailsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  deniedBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  deniedText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1565c0',
    lineHeight: 18,
  },
  warningBox: {
    padding: 16,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#e65100',
    fontWeight: '600',
    marginBottom: 8,
  },
  warningSubtext: {
    fontSize: 13,
    color: '#ef6c00',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
});

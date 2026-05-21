/**
 * SettingsScreen - User Profile & App Settings
 * Sprint 3 - Dashboard Enhancements
 *
 * User profile and app settings management
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type MoreStackParamList = {
  MoreMenu: undefined;
  Settings: undefined;
};

type Props = NativeStackScreenProps<MoreStackParamList, 'Settings'>;

function toLifeHours(amount: number, hourlyRate: number): string {
  const hours = amount / hourlyRate;
  if (hours < 1) return `${(hours * 60).toFixed(0)} min de vida`;
  return `≈ ${hours.toFixed(1)} h de vida`;
}

export { toLifeHours };

export const SettingsScreen: React.FC<Props> = ({ navigation: _navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  const [hourlyRateInput, setHourlyRateInput] = useState(
    user?.hourlyRate != null ? String(user.hourlyRate) : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveHourlyRate = async () => {
    const value = parseFloat(hourlyRateInput);
    if (hourlyRateInput !== '' && (isNaN(value) || value <= 0)) {
      Alert.alert('Valor inválido', 'Ingresa un número positivo o deja el campo vacío.');
      return;
    }
    try {
      setSaving(true);
      await updateProfile({ hourlyRate: hourlyRateInput === '' ? null : value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert('Error', 'No se pudo guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Error', 'No se pudo cerrar sesión. Inténtalo de nuevo.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Perfil</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={64} color="#4F46E5" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
        </View>
      </View>

      {/* Hourly Rate Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Valor de tu tiempo</Text>
        <View style={styles.hourlyCard}>
          <Text style={styles.hourlyLabel}>Tu valor por hora (en tu moneda principal)</Text>
          <Text style={styles.hourlySubLabel}>
            Se usa para mostrar cuántas horas de vida vale cada gasto
          </Text>
          <View style={styles.hourlyInputRow}>
            <TextInput
              style={styles.hourlyInput}
              value={hourlyRateInput}
              onChangeText={(t) => {
                setHourlyRateInput(t);
                setSaved(false);
              }}
              keyboardType="decimal-pad"
              placeholder="ej. 500"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveHourlyRate}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{saved ? '✓ Guardado' : 'Guardar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="key-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Cambiar contraseña</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="person-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Editar perfil</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="notifications-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Notificaciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="color-palette-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Apariencia</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="language-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Idioma</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Horus App', 'Versión 1.0.0\nBuild Sprint 3');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="information-circle-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Acerca de</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="document-text-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Términos y condiciones</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            Alert.alert('Próximamente', 'Esta función estará disponible pronto');
          }}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#4F46E5" />
            <Text style={styles.menuItemText}>Política de privacidad</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Hecho con ❤️ por el equipo de Horus</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  hourlyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hourlyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  hourlySubLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  hourlyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hourlyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#A5B4FC',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

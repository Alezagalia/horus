import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Constants from 'expo-constants';
import { User, Mail, Clock, ChevronRight, LogOut, X, Pencil } from 'lucide-react-native';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import { cleanupPushToken } from '@/hooks/usePushNotifications';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatMemberSince(dateStr: string): string {
  return format(parseISO(dateStr), "MMMM 'de' yyyy", { locale: es });
}

function formatHourlyRate(rate: number | null): string {
  if (!rate) return '—';
  return (
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(rate) + '/h'
  );
}

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

// ─── edit modal ───────────────────────────────────────────────────────────────

type EditField = 'name' | 'hourlyRate';

function EditModal({
  field,
  initialValue,
  onClose,
  onSave,
  saving,
}: {
  field: EditField;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState(initialValue);

  const isName = field === 'name';
  const title = isName ? 'Editar nombre' : 'Tarifa por hora';
  const placeholder = isName ? 'Tu nombre' : '0';

  const canSave = value.trim() !== '' && value !== initialValue;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={Colors.muted}
            keyboardType={isName ? 'default' : 'numeric'}
            autoFocus
            autoCapitalize={isName ? 'words' : 'none'}
            returnKeyType="done"
            onSubmitEditing={() => canSave && onSave(value.trim())}
          />

          <Button
            label="Guardar"
            onPress={() => onSave(value.trim())}
            loading={saving}
            disabled={!canSave}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── row components ───────────────────────────────────────────────────────────

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <View style={[styles.settingRow, onPress && styles.settingRowPressable]}>
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, danger && { color: '#ef4444' }]}>{label}</Text>
        {value ? (
          <Text style={styles.settingValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {onPress && !danger && <ChevronRight size={16} color={Colors.muted} />}
    </View>
  );

  if (!onPress) return content;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

export default function YoScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [editField, setEditField] = useState<EditField | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const initials = getInitials(user.name);

  const handleSave = async (value: string) => {
    if (!editField) return;
    setSaving(true);
    try {
      const payload = editField === 'name' ? { name: value } : { hourlyRate: parseFloat(value) };
      const updated = await authApi.updateProfile(payload);
      setUser(updated);
      setEditField(null);
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await cleanupPushToken();
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      {/* ─── Profile hero ─────────────────────────────────────────── */}
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
          <Text style={styles.heroSince}>Miembro desde {formatMemberSince(user.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditField('name')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Pencil size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ─── Mi cuenta ────────────────────────────────────────────── */}
      <SectionLabel label="MI CUENTA" />
      <Card padding={0} solid>
        <SettingRow
          icon={<User size={16} color={Colors.vivid} />}
          label="Nombre"
          value={user.name}
          onPress={() => setEditField('name')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<Mail size={16} color={Colors.vivid} />}
          label="Email"
          value={user.email}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<Clock size={16} color={Colors.vivid} />}
          label="Tarifa por hora"
          value={formatHourlyRate(user.hourlyRate)}
          onPress={() => setEditField('hourlyRate')}
        />
      </Card>

      {/* ─── App info ─────────────────────────────────────────────── */}
      <SectionLabel label="APLICACIÓN" />
      <Card padding={0} solid>
        <SettingRow
          icon={<Text style={styles.versionIcon}>v</Text>}
          label="Versión"
          value={APP_VERSION}
        />
      </Card>

      {/* ─── Logout ───────────────────────────────────────────────── */}
      <SectionLabel label="SESIÓN" />
      <Card padding={0} solid>
        <TouchableOpacity onPress={handleLogout} disabled={loggingOut} activeOpacity={0.7}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIcon, styles.settingIconDanger]}>
              {loggingOut ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <LogOut size={16} color="#ef4444" />
              )}
            </View>
            <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Cerrar sesión</Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* ─── Edit Modal ───────────────────────────────────────────── */}
      {editField && (
        <EditModal
          field={editField}
          initialValue={editField === 'name' ? user.name : (user.hourlyRate?.toString() ?? '')}
          onClose={() => setEditField(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </ScreenContainer>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius['3xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.nav,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#fff',
    marginBottom: 3,
  },
  heroEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 3,
  },
  heroSince: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
  },
  editBtn: {
    padding: Spacing.xs,
  },

  // Section label
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  settingRowPressable: {},
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDanger: {
    backgroundColor: '#fef2f2',
  },
  settingContent: { flex: 1 },
  settingLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  settingValue: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  versionIcon: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.vivid,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,14,31,0.5)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  modalInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    color: Colors.ink,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.vivid,
    marginBottom: Spacing.xl,
  },
});

import { useState, useEffect, useMemo } from 'react';
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
  ScrollView,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Constants from 'expo-constants';
import {
  User,
  Mail,
  Clock,
  ChevronRight,
  LogOut,
  X,
  Pencil,
  Plus,
  Trash2,
  ClipboardCheck,
  Scale,
  History,
  Tag,
  BarChart2,
  Zap,
  Download,
  Calendar,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import { apiErrorMessage } from '@/lib/apiError';
import { makeCreateErrorHandler } from '@/lib/mutationErrors';
import { useSubscription } from '@/hooks/useSubscription';
import { useProPurchase } from '@/hooks/useProPurchase';
import { useSyncStatus } from '@/hooks/useSync';
import { GoogleCalendarSyncModal } from '@/components/sync/GoogleCalendarSyncModal';
import { PRO_PRODUCTS } from '@/config/billing';
import { cleanupPushToken } from '@/hooks/usePushNotifications';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeactivateAccount,
  accountKeys,
} from '@/hooks/useAccounts';
import type {
  Account,
  CreateAccountDTO,
  UpdateAccountDTO,
  AccountType,
} from '@/services/api/accountApi';
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_ICONS,
  ACCOUNT_TYPE_COLORS,
} from '@/services/api/accountApi';
import { useQueryClient } from '@tanstack/react-query';

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

// ─── account constants ────────────────────────────────────────────────────────

const COMMON_CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL'];

function formatBalance(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── account row ──────────────────────────────────────────────────────────────

function AccountRow({
  account,
  onEdit,
  isLast,
}: {
  account: Account;
  onEdit: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.accountRow, !isLast && styles.accountRowBorder]}
      onPress={onEdit}
      activeOpacity={0.6}
    >
      <Text
        style={[styles.accountName, !account.isActive && { color: Colors.muted }]}
        numberOfLines={1}
      >
        {account.name}
      </Text>
      <Text
        style={[styles.accountBalance, { color: account.balance < 0 ? '#ef4444' : Colors.muted }]}
      >
        {formatBalance(account.balance, account.currency)}
      </Text>
      <ChevronRight size={16} color={Colors.muted} />
    </TouchableOpacity>
  );
}

// ─── account form modal ───────────────────────────────────────────────────────

const ACCOUNT_TYPES: AccountType[] = ['efectivo', 'banco', 'billetera_digital', 'tarjeta'];

function AccountFormModal({
  visible,
  onClose,
  account,
}: {
  visible: boolean;
  onClose: () => void;
  account?: Account;
}) {
  const isEdit = !!account;
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('banco');
  const [currency, setCurrency] = useState('ARS');
  const [initialBalance, setInitialBalance] = useState('0');

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deactivateAccount = useDeactivateAccount();
  const queryClient = useQueryClient();
  const isBusy = createAccount.isPending || updateAccount.isPending;

  const handleDeactivate = () => {
    if (!account) return;
    Alert.alert(
      'Desactivar cuenta',
      `¿Desactivar "${account.name}"? Ya no aparecerá en tus movimientos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () =>
            deactivateAccount.mutate(account.id, {
              onSuccess: onClose,
              onError: () => Alert.alert('Error', 'No se pudo desactivar la cuenta'),
            }),
        },
      ]
    );
  };

  useEffect(() => {
    if (visible) {
      if (account) {
        setName(account.name);
        setType(account.type);
        setCurrency(account.currency);
        setInitialBalance(String(account.initialBalance ?? account.balance ?? 0));
      } else {
        setName('');
        setType('banco');
        setCurrency('ARS');
        setInitialBalance('0');
      }
    }
  }, [visible, account]);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la cuenta es requerido');
      return;
    }
    const balance = parseFloat(initialBalance) || 0;

    if (isEdit) {
      const dto: UpdateAccountDTO = {
        name: name.trim(),
        currency,
        initialBalance: balance,
      };
      updateAccount.mutate(
        { id: account.id, dto },
        {
          onSuccess: onClose,
          onError: () => Alert.alert('Error', 'No se pudo actualizar la cuenta'),
        }
      );
    } else {
      const dto: CreateAccountDTO = {
        name: name.trim(),
        type,
        currency,
        initialBalance: balance,
        color: ACCOUNT_TYPE_COLORS[type],
      };
      createAccount.mutate(dto, {
        onSuccess: onClose,
        onError: makeCreateErrorHandler({
          queryClient,
          invalidateKeys: [accountKeys.all],
          onClose,
          fallbackMessage: 'No se pudo crear la cuenta',
          savedMessage:
            'La confirmación no llegó por la conexión, pero la cuenta probablemente se creó. Fijate en la lista antes de crearla de nuevo.',
        }),
      });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
            <Text style={styles.modalTitle}>{isEdit ? 'Editar cuenta' : 'Nueva cuenta'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la cuenta"
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="next"
              autoCapitalize="words"
            />

            {/* Type — create only */}
            {!isEdit && (
              <>
                <Text style={styles.formLabel}>TIPO</Text>
                <View style={styles.typeGrid}>
                  {ACCOUNT_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.typeChip,
                        type === t && {
                          borderColor: ACCOUNT_TYPE_COLORS[t],
                          backgroundColor: ACCOUNT_TYPE_COLORS[t] + '15',
                        },
                      ]}
                      onPress={() => setType(t)}
                    >
                      <Text style={styles.typeChipIcon}>{ACCOUNT_TYPE_ICONS[t]}</Text>
                      <Text
                        style={[
                          styles.typeChipLabel,
                          type === t && {
                            color: ACCOUNT_TYPE_COLORS[t],
                            fontFamily: 'Inter_600SemiBold',
                          },
                        ]}
                      >
                        {ACCOUNT_TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Currency */}
            <Text style={styles.formLabel}>MONEDA</Text>
            <View style={styles.currencyRow}>
              {COMMON_CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                  onPress={() => setCurrency(c)}
                >
                  <Text
                    style={[
                      styles.currencyChipLabel,
                      { color: currency === c ? '#fff' : Colors.ink },
                    ]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Initial balance */}
            <Text style={styles.formLabel}>{isEdit ? 'SALDO INICIAL' : 'SALDO INICIAL'}</Text>
            <TextInput
              style={[styles.modalInput, { marginBottom: Spacing.xl }]}
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder="0"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <Button
              label={isEdit ? 'Guardar' : 'Crear cuenta'}
              onPress={handleSubmit}
              loading={isBusy}
              disabled={!name.trim() || isBusy}
            />

            {isEdit && account?.isActive && (
              <TouchableOpacity
                style={styles.deactivateBtn}
                onPress={handleDeactivate}
                disabled={deactivateAccount.isPending}
                activeOpacity={0.7}
              >
                <Trash2 size={15} color="#ef4444" strokeWidth={1.8} />
                <Text style={styles.deactivateBtnText}>Desactivar cuenta</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

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
  const queryClient = useQueryClient();

  const [editField, setEditField] = useState<EditField | null>(null);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>(undefined);
  const [showGoogleSync, setShowGoogleSync] = useState(false);

  const { data: syncStatus } = useSyncStatus();
  const googleSyncValue = !syncStatus?.isConnected
    ? 'No conectado'
    : syncStatus.needsReconnect
      ? 'Requiere reconexión'
      : (syncStatus.googleEmail ?? 'Conectado');

  const { data: accountsData } = useAccounts();
  const accounts = accountsData?.accounts ?? [];

  // Cuentas activas agrupadas por moneda (con subtotal); inactivas aparte.
  const { accountGroups, inactiveAccounts } = useMemo(() => {
    const active = accounts.filter((a) => a.isActive);
    const inactive = accounts.filter((a) => !a.isActive);
    const map = new Map<string, typeof accounts>();
    active.forEach((a) => {
      if (!map.has(a.currency)) map.set(a.currency, []);
      map.get(a.currency)!.push(a);
    });
    const groups = Array.from(map, ([currency, accs]) => ({
      currency,
      accounts: accs,
      subtotal: accs.reduce((s, a) => s + Number(a.balance || 0), 0),
    }));
    return { accountGroups: groups, inactiveAccounts: inactive };
  }, [accounts]);

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

  // ─── Plan (S-03) ────────────────────────────────────────────────────────
  const { data: subscription } = useSubscription();
  const [showPlans, setShowPlans] = useState(false);
  const { buy, purchasing } = useProPurchase();

  // ─── Datos y privacidad (S-02) ──────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await authApi.exportData();
      await Share.share({
        title: 'Mis datos de Horus',
        message: JSON.stringify(data, null, 2),
      });
    } catch {
      Alert.alert('Error', 'No pudimos generar la exportación. Probá de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Ingresá tu contraseña para confirmar.');
      return;
    }
    setDeleteError('');
    setDeleting(true);
    try {
      await authApi.deleteAccount(deletePassword);
      setShowDelete(false);
      await cleanupPushToken();
      await logout();
    } catch (err) {
      setDeleteError(
        apiErrorMessage(err, 'No se pudo eliminar la cuenta. Verificá tu contraseña.')
      );
      setDeleting(false);
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

      {/* ─── Cuentas conectadas ───────────────────────────────────── */}
      <SectionLabel label="CUENTAS CONECTADAS" />
      <Card padding={0} solid>
        <SettingRow
          icon={<Calendar size={16} color="#4285F4" />}
          label="Google Calendar"
          value={googleSyncValue}
          onPress={() => setShowGoogleSync(true)}
        />
      </Card>

      {/* ─── Mis cuentas ──────────────────────────────────────────── */}
      <View style={styles.accountsHeader}>
        <Text style={styles.sectionLabel}>MIS CUENTAS</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingAccount(undefined);
            setShowAccountModal(true);
          }}
          hitSlop={8}
        >
          <Plus size={18} color={Colors.vivid} strokeWidth={2} />
        </TouchableOpacity>
      </View>
      {accounts.length === 0 ? (
        <Card solid>
          <Text style={styles.emptyText}>Sin cuentas registradas</Text>
        </Card>
      ) : (
        <>
          {accountGroups.map((group) => (
            <View key={group.currency} style={styles.accountGroup}>
              <View style={styles.accountGroupHeader}>
                <Text style={styles.accountGroupTitle}>
                  {group.currency} · {group.accounts.length}{' '}
                  {group.accounts.length === 1 ? 'cuenta' : 'cuentas'}
                </Text>
                <Text style={styles.accountGroupSubtotal}>
                  {formatBalance(group.subtotal, group.currency)}
                </Text>
              </View>
              <Card padding={0} solid>
                {group.accounts.map((acc, i) => (
                  <AccountRow
                    key={acc.id}
                    account={acc}
                    onEdit={() => {
                      setEditingAccount(acc);
                      setShowAccountModal(true);
                    }}
                    isLast={i === group.accounts.length - 1}
                  />
                ))}
              </Card>
            </View>
          ))}

          {inactiveAccounts.length > 0 && (
            <View style={styles.accountGroup}>
              <View style={styles.accountGroupHeader}>
                <Text style={styles.accountGroupTitle}>INACTIVAS · {inactiveAccounts.length}</Text>
              </View>
              <Card padding={0} solid>
                {inactiveAccounts.map((acc, i) => (
                  <AccountRow
                    key={acc.id}
                    account={acc}
                    onEdit={() => {
                      setEditingAccount(acc);
                      setShowAccountModal(true);
                    }}
                    isLast={i === inactiveAccounts.length - 1}
                  />
                ))}
              </Card>
            </View>
          )}
        </>
      )}

      {/* ─── Herramientas ─────────────────────────────────────────── */}
      <SectionLabel label="HERRAMIENTAS" />
      <Card padding={0} solid>
        <SettingRow
          icon={<BarChart2 size={16} color="#F59E0B" />}
          label="Reportes"
          onPress={() => router.push('/reportes')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<ClipboardCheck size={16} color={Colors.vivid} />}
          label="Revisión Semanal"
          onPress={() => router.push('/revision-semanal')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<Tag size={16} color="#8B5CF6" />}
          label="Categorías"
          onPress={() => router.push('/categorias')}
        />
        <View style={styles.divider} />
        <View style={styles.divider} />
        <SettingRow
          icon={<History size={16} color={Colors.vivid} />}
          label="Mi Historia"
          onPress={() => router.push('/timeline')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<Scale size={16} color="#F43F5E" />}
          label="Deuda de Vida"
          onPress={() => router.push('/deuda-de-vida')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon={<Zap size={16} color="#f59e0b" />}
          label="Actividades"
          onPress={() => router.push('/actividades')}
        />
      </Card>

      {/* ─── Plan (S-03) ──────────────────────────────────────────── */}
      <SectionLabel label="TU PLAN" />
      <Card padding={0} solid>
        <SettingRow
          icon={<Zap size={16} color={Colors.vivid} />}
          label="Plan actual"
          value={subscription?.plan ?? 'FREE'}
          onPress={() => setShowPlans(true)}
        />
      </Card>

      {/* ─── Modal: planes ────────────────────────────────────────── */}
      <Modal
        visible={showPlans}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlans(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Planes</Text>
            <Text style={styles.deleteBody}>
              Tu plan actual:{' '}
              <Text style={{ fontWeight: '700', color: Colors.vivid }}>
                {subscription?.plan ?? 'FREE'}
              </Text>
            </Text>

            <Text style={styles.planTier}>Free</Text>
            <Text style={styles.planFeat}>5 hábitos · 1 meta · 1 cuenta · tareas y calendario</Text>

            <Text style={[styles.planTier, { color: Colors.vivid, marginTop: 12 }]}>
              Pro · $5/mes
            </Text>
            <Text style={styles.planFeat}>
              Ilimitado · sync Google Calendar · fitness y nutrición · stats avanzadas
            </Text>

            {subscription?.plan === 'PRO' ? (
              <Text style={styles.proActive}>Ya tenés Pro 🎉</Text>
            ) : (
              <View style={{ marginTop: 16, alignSelf: 'stretch', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.deleteConfirm, { backgroundColor: Colors.vivid }]}
                  disabled={purchasing !== null}
                  onPress={() => buy(PRO_PRODUCTS.monthly)}
                >
                  {purchasing === PRO_PRODUCTS.monthly ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.deleteConfirmText}>Suscribirme mensual</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.deleteConfirm,
                    { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.vivid },
                  ]}
                  disabled={purchasing !== null}
                  onPress={() => buy(PRO_PRODUCTS.annual)}
                >
                  {purchasing === PRO_PRODUCTS.annual ? (
                    <ActivityIndicator color={Colors.vivid} />
                  ) : (
                    <Text style={[styles.deleteConfirmText, { color: Colors.vivid }]}>
                      Suscribirme anual
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.deleteActions, { marginTop: 16 }]}>
              <TouchableOpacity onPress={() => setShowPlans(false)}>
                <Text style={styles.deleteCancel}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Datos y privacidad (S-02) ────────────────────────────── */}
      <SectionLabel label="DATOS Y PRIVACIDAD" />
      <Card padding={0} solid>
        <SettingRow
          icon={
            exporting ? (
              <ActivityIndicator size="small" color={Colors.vivid} />
            ) : (
              <Download size={16} color={Colors.vivid} />
            )
          }
          label="Descargar mis datos"
          value="Exporta todo en formato JSON"
          onPress={exporting ? undefined : handleExport}
        />
        <SettingRow
          icon={<Trash2 size={16} color="#ef4444" />}
          label="Eliminar mi cuenta"
          onPress={() => {
            setDeletePassword('');
            setDeleteError('');
            setShowDelete(true);
          }}
          danger
        />
      </Card>

      {/* ─── Modal: confirmar borrado de cuenta ───────────────────── */}
      <Modal
        visible={showDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDelete(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.deleteOverlay}
        >
          <View style={styles.deleteCard}>
            <Text style={styles.deleteTitle}>Eliminar mi cuenta</Text>
            <Text style={styles.deleteBody}>
              Esta acción es permanente y borra todos tus datos. Ingresá tu contraseña para
              confirmar.
            </Text>
            <TextInput
              style={styles.deleteInput}
              value={deletePassword}
              onChangeText={(t) => {
                setDeletePassword(t);
                setDeleteError('');
              }}
              placeholder="Tu contraseña"
              placeholderTextColor={Colors.muted}
              secureTextEntry
              autoCapitalize="none"
            />
            {deleteError ? <Text style={styles.deleteErr}>{deleteError}</Text> : null}
            <View style={styles.deleteActions}>
              <TouchableOpacity onPress={() => setShowDelete(false)} disabled={deleting}>
                <Text style={styles.deleteCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirm}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
      <AccountFormModal
        visible={showAccountModal}
        onClose={() => {
          setShowAccountModal(false);
          setEditingAccount(undefined);
        }}
        account={editingAccount}
      />
      <GoogleCalendarSyncModal visible={showGoogleSync} onClose={() => setShowGoogleSync(false)} />
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

  // Accounts header
  accountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Account row
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  accountRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  accountName: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  accountBalance: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  accountGroup: {
    marginBottom: Spacing.md,
  },
  accountGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: Spacing.xs,
  },
  accountGroupTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  accountGroupSubtotal: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.ink,
  },
  deactivateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  deactivateBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#ef4444',
  },

  // Empty state
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },

  // Account form
  formLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
    minWidth: '45%',
  },
  typeChipIcon: {
    fontSize: 16,
  },
  typeChipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.ink,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  currencyChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.line,
    backgroundColor: Colors.ice,
  },
  currencyChipActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  currencyChipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  // Delete-account confirmation modal
  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 31, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  deleteCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  deleteTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  deleteBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  deleteInput: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  deleteErr: {
    color: '#b91c1c',
    fontSize: 12,
    marginTop: 6,
  },
  deleteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  deleteCancel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  deleteConfirm: {
    backgroundColor: '#ef4444',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    minWidth: 96,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Plan modal
  planTier: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.text,
    marginTop: 8,
  },
  planFeat: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    marginTop: 2,
  },
  proActive: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
  },
});

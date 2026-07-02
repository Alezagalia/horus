import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  TrendingUp,
  TrendingDown,
  X,
  Trash2,
  Undo2,
  Pencil,
  ArrowLeftRight,
  Settings,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { makeCreateErrorHandler } from '@/lib/mutationErrors';
import { useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Gradients, Shadows, Layout } from '@/tokens';
import { useAccounts, useFinanceStats, accountKeys } from '@/hooks/useAccounts';
import { useAccountUsage } from '@/hooks/useAccountUsage';
import { SyncStatusDot } from '@/components/SyncStatusDot';
import { syncNow } from '@/db/syncScheduler';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useCreateTransfer,
  useDeleteTransaction,
  useTxCategories,
  transactionKeys,
} from '@/hooks/useTransactions';
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  recurringKeys,
} from '@/hooks/useEvents';
import {
  useMonthlyExpenses,
  usePayMonthlyExpense,
  useUndoMonthlyExpensePayment,
  monthlyExpenseKeys,
} from '@/hooks/useMonthlyExpenses';
import {
  useBudgetsSummary,
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  budgetKeys,
} from '@/hooks/useBudgets';
import {
  useSavingsGoals,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
  savingsGoalKeys,
} from '@/hooks/useSavingsGoals';
import type { Transaction, TransactionType } from '@/services/api/transactionApi';
import type { Account } from '@/services/api/accountApi';
import type { RecurringExpense } from '@/services/api/recurringExpenseApi';
import type { MonthlyExpense } from '@/services/api/monthlyExpenseApi';
import type { BudgetSummary } from '@/services/api/budgetApi';
import type { SavingsGoalWithProgress } from '@/services/api/savingsGoalApi';
import type { CreateRecurringExpenseDTO } from '@horus/shared';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number, currency = 'ARS', decimals = 0): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

type WithCategory = {
  category?: { id: string; name: string; icon?: string | null; color?: string | null } | null;
};

/** Agrupa items por su categoría (los sin categoría van a "Sin categoría"). */
function groupByCategory<T extends WithCategory>(items: T[]) {
  const map = new Map<
    string,
    { name: string; icon?: string | null; color?: string | null; items: T[] }
  >();
  for (const it of items) {
    const c = it.category;
    const key = c?.id ?? '__none__';
    if (!map.has(key)) {
      map.set(key, { name: c?.name ?? 'Sin categoría', icon: c?.icon, color: c?.color, items: [] });
    }
    map.get(key)!.items.push(it);
  }
  return Array.from(map, ([key, g]) => ({ key, ...g }));
}

/** Encabezado de un grupo de categoría (ícono/punto + nombre + contador). */
function CategoryGroupHeader({
  name,
  icon,
  color,
  count,
}: {
  name: string;
  icon?: string | null;
  color?: string | null;
  count: number;
}) {
  return (
    <View style={styles.catGroupHeader}>
      {icon ? (
        <Text style={styles.catGroupIcon}>{icon}</Text>
      ) : (
        <View style={[styles.catDot, { backgroundColor: color ?? Colors.muted }]} />
      )}
      <Text style={styles.catGroupName}>{name}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.catGroupCount}>{count}</Text>
    </View>
  );
}

function formatTxDate(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

function groupByDate(transactions: Transaction[]): Array<{
  date: string;
  label: string;
  items: Transaction[];
}> {
  const map = new Map<string, { label: string; items: Transaction[] }>();
  for (const t of transactions) {
    const key = t.date.split('T')[0];
    if (!map.has(key)) {
      map.set(key, { label: formatTxDate(t.date), items: [] });
    }
    map.get(key)!.items.push(t);
  }
  return Array.from(map.entries()).map(([date, v]) => ({ date, ...v }));
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MoneyHeroCard({
  stats,
  month,
  year,
  onPrev,
  onNext,
}: {
  stats:
    | { totalIncome: number; totalExpense: number; balance: number; currency: string }
    | undefined;
  month: number;
  year: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const monthLabel = format(new Date(year, month, 1), 'MMMM yyyy', { locale: es });
  const displayMonth = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
  const currency = stats?.currency ?? 'ARS';

  return (
    <LinearGradient
      colors={Gradients.moneyHero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={onPrev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft size={20} color="rgba(255,255,255,0.65)" />
        </TouchableOpacity>
        <Text style={styles.monthName}>{displayMonth}</Text>
        <TouchableOpacity onPress={onNext} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronRight size={20} color="rgba(255,255,255,0.65)" />
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceLabel}>Balance del mes</Text>
      <Text style={[styles.balanceAmount, stats && stats.balance < 0 && { color: '#f87171' }]}>
        {stats ? formatMoney(stats.balance, currency) : '—'}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <TrendingUp size={14} color="#4ade80" strokeWidth={2} />
          <Text style={styles.statLabel}>Ingresos</Text>
          <Text style={[styles.statAmount, { color: '#4ade80' }]}>
            {stats ? formatMoney(stats.totalIncome, currency) : '—'}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <TrendingDown size={14} color="#f87171" strokeWidth={2} />
          <Text style={styles.statLabel}>Egresos</Text>
          <Text style={[styles.statAmount, { color: '#f87171' }]}>
            {stats ? formatMoney(stats.totalExpense, currency) : '—'}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function TransactionRow({
  tx,
  onEdit,
  onDelete,
  deleting,
  isLast,
}: {
  tx: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
  isLast?: boolean;
}) {
  const isIncome = tx.type === 'ingreso';
  const dotColor = tx.category?.color ?? Colors.ceilDark;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar movimiento',
      tx.isTransfer
        ? `Se eliminarán ambos lados de la transferencia "${tx.concept}".`
        : `¿Eliminar "${tx.concept}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.catDot, { backgroundColor: dotColor }]} />
      <TouchableOpacity
        style={styles.txCenter}
        onPress={onEdit}
        disabled={tx.isTransfer}
        activeOpacity={0.6}
      >
        <Text style={styles.txConcept} numberOfLines={1}>
          {tx.concept}
        </Text>
        <View style={styles.txMetaRow}>
          {tx.isTransfer && <ArrowLeftRight size={11} color={Colors.muted} strokeWidth={1.8} />}
          <Text style={styles.txMeta} numberOfLines={1}>
            {tx.isTransfer ? 'Transferencia' : tx.category?.name}
            {tx.account ? ` · ${tx.account.name}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.txAmount, { color: isIncome ? '#22c55e' : Colors.ink }]}>
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount, tx.account?.currency, 2)}
      </Text>
      {deleting ? (
        <ActivityIndicator size="small" color={Colors.muted} style={{ marginLeft: Spacing.sm }} />
      ) : (
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginLeft: Spacing.sm }}
        >
          <Trash2 size={16} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Transaction Form Modal ────────────────────────────────────────────────────

function TransactionFormModal({
  visible,
  onClose,
  accounts,
  editingTransaction,
}: {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
  editingTransaction?: Transaction | null;
}) {
  const isEditing = !!editingTransaction;
  const [txType, setTxType] = useState<TransactionType>('egreso');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');

  // Categorías según el tipo: ingreso → 'ingresos', egreso → 'egresos'.
  const { data: categories = [] } = useTxCategories(txType === 'ingreso' ? 'ingresos' : 'egresos');
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const queryClient = useQueryClient();
  const { sortByUsage, recordUse } = useAccountUsage();

  // Cuentas ordenadas de más usada a menos usada.
  const orderedAccounts = useMemo(() => sortByUsage(accounts), [accounts, sortByUsage]);

  useEffect(() => {
    if (!visible) return;
    if (editingTransaction) {
      setTxType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setConcept(editingTransaction.concept);
      setAccountId(editingTransaction.accountId);
      setCategoryId(editingTransaction.categoryId);
    } else {
      setTxType('egreso');
      setAmount('');
      setConcept('');
      setCategoryId('');
      setAccountId(orderedAccounts[0]?.id ?? '');
    }
  }, [visible, editingTransaction, accounts, orderedAccounts]);

  const handleClose = () => {
    setTxType('egreso');
    setAmount('');
    setConcept('');
    setCategoryId('');
    setAccountId(orderedAccounts[0]?.id ?? '');
    onClose();
  };

  const canSubmit =
    amount.trim() !== '' &&
    parseFloat(amount.replace(',', '.')) > 0 &&
    concept.trim() !== '' &&
    !!accountId &&
    !!categoryId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const onError = makeCreateErrorHandler({
      queryClient,
      invalidateKeys: [transactionKeys.all, accountKeys.all],
      onClose: handleClose,
      fallbackMessage: 'No se pudo guardar el movimiento',
      savedMessage:
        'La confirmación no llegó por la conexión, pero el movimiento probablemente se guardó. Fijate en la lista antes de cargarlo de nuevo.',
    });

    if (isEditing && editingTransaction) {
      updateTx.mutate(
        {
          id: editingTransaction.id,
          dto: { amount: parsedAmount, concept: concept.trim(), categoryId },
        },
        { onSuccess: handleClose, onError }
      );
    } else {
      createTx.mutate(
        {
          type: txType,
          amount: parsedAmount,
          concept: concept.trim(),
          accountId,
          categoryId,
          date: new Date().toISOString(),
        },
        {
          onSuccess: () => {
            recordUse(accountId); // sube el ranking de uso de esta cuenta
            handleClose();
          },
          onError,
        }
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeBtn, txType === 'egreso' && styles.typeBtnEgreso]}
                onPress={() => {
                  if (!isEditing) {
                    setTxType('egreso');
                    setCategoryId('');
                  }
                }}
                disabled={isEditing}
              >
                <Text
                  style={[
                    styles.typeBtnLabel,
                    { color: txType === 'egreso' ? '#fff' : Colors.muted },
                  ]}
                >
                  Egreso
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, txType === 'ingreso' && styles.typeBtnIngreso]}
                onPress={() => {
                  if (!isEditing) {
                    setTxType('ingreso');
                    setCategoryId('');
                  }
                }}
                disabled={isEditing}
              >
                <Text
                  style={[
                    styles.typeBtnLabel,
                    { color: txType === 'ingreso' ? '#fff' : Colors.muted },
                  ]}
                >
                  Ingreso
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.ceilLight}
              keyboardType="numeric"
              autoFocus={!isEditing}
            />

            <TextInput
              style={styles.conceptInput}
              value={concept}
              onChangeText={setConcept}
              placeholder="Concepto..."
              placeholderTextColor={Colors.muted}
              returnKeyType="done"
            />

            <Text style={styles.pickerLabel}>Cuenta{isEditing ? ' (no editable)' : ''}</Text>
            <View style={[styles.formListCard, isEditing && { opacity: 0.6 }]}>
              <ScrollView
                style={styles.formList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {orderedAccounts.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.filterRow, accountId === a.id && styles.filterRowActive]}
                    onPress={() => !isEditing && setAccountId(a.id)}
                    disabled={isEditing}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.accountDot, a.color ? { backgroundColor: a.color } : null]}
                    />
                    <Text style={styles.filterRowName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.filterRowBal}>{formatMoney(a.balance, a.currency)}</Text>
                    {accountId === a.id && <Check size={18} color={Colors.vivid} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.pickerLabel}>Categoría</Text>
            <View style={styles.formListCard}>
              <ScrollView
                style={styles.formList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {categories.length === 0 ? (
                  <Text style={styles.formListEmpty}>No hay categorías de este tipo</Text>
                ) : (
                  categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.filterRow, categoryId === c.id && styles.filterRowActive]}
                      onPress={() => setCategoryId(c.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.catRowIcon}>{c.icon || '📁'}</Text>
                      <Text style={styles.filterRowName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      {categoryId === c.id && <Check size={18} color={Colors.vivid} />}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>

            <Button
              label={isEditing ? 'Guardar cambios' : 'Guardar movimiento'}
              onPress={handleSubmit}
              loading={createTx.isPending || updateTx.isPending}
              disabled={!canSubmit}
              style={{ marginTop: Spacing.lg }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Transfer Modal ──────────────────────────────────────────────────────────

function TransferModal({
  visible,
  onClose,
  accounts,
}: {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');

  const createTransfer = useCreateTransfer();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!visible) {
      setFromId('');
      setToId('');
      setAmount('');
      setConcept('');
    }
  }, [visible]);

  const fromAccount = accounts.find((a) => a.id === fromId);
  // Destino: mismas monedas que el origen y distinta cuenta (regla del backend)
  const destinations = fromAccount
    ? accounts.filter((a) => a.id !== fromId && a.currency === fromAccount.currency)
    : [];

  const parsedAmount = parseFloat(amount.replace(',', '.'));
  const insufficient =
    !!fromAccount && !isNaN(parsedAmount) && parsedAmount > (fromAccount.balance ?? 0);

  const canSubmit =
    !!fromId &&
    !!toId &&
    fromId !== toId &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    concept.trim() !== '' &&
    !insufficient;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createTransfer.mutate(
      {
        fromAccountId: fromId,
        toAccountId: toId,
        amount: parsedAmount,
        concept: concept.trim(),
        date: new Date().toISOString(),
      },
      {
        onSuccess: onClose,
        onError: makeCreateErrorHandler({
          queryClient,
          invalidateKeys: [transactionKeys.all, accountKeys.all],
          onClose,
          fallbackMessage: 'No se pudo realizar la transferencia',
          savedMessage:
            'La confirmación no llegó por la conexión, pero la transferencia probablemente se realizó. Fijate en la lista antes de rehacerla.',
        }),
      }
    );
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
            <Text style={styles.modalTitle}>Transferir entre cuentas</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.ceilLight}
              keyboardType="numeric"
              autoFocus
            />

            <TextInput
              style={styles.conceptInput}
              value={concept}
              onChangeText={setConcept}
              placeholder="Concepto (ej. Pago a ahorros)…"
              placeholderTextColor={Colors.muted}
              returnKeyType="done"
            />

            <Text style={styles.pickerLabel}>DESDE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
              contentContainerStyle={{ gap: Spacing.sm }}
            >
              {accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.pickerChip, fromId === a.id && styles.pickerChipActive]}
                  onPress={() => {
                    setFromId(a.id);
                    if (toId === a.id) setToId('');
                  }}
                >
                  {a.color && <View style={[styles.accountDot, { backgroundColor: a.color }]} />}
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      { color: fromId === a.id ? '#fff' : Colors.ink },
                    ]}
                  >
                    {a.name} · {a.currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {fromAccount && (
              <Text style={styles.transferHint}>
                Saldo disponible: {formatMoney(fromAccount.balance ?? 0, fromAccount.currency)}
              </Text>
            )}

            <Text style={styles.pickerLabel}>HACIA</Text>
            {fromId === '' ? (
              <Text style={styles.transferHint}>Elegí primero la cuenta de origen.</Text>
            ) : destinations.length === 0 ? (
              <Text style={styles.transferHint}>
                No hay otra cuenta en {fromAccount?.currency} para transferir.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.pickerScroll}
                contentContainerStyle={{ gap: Spacing.sm }}
              >
                {destinations.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.pickerChip, toId === a.id && styles.pickerChipActive]}
                    onPress={() => setToId(a.id)}
                  >
                    {a.color && <View style={[styles.accountDot, { backgroundColor: a.color }]} />}
                    <Text
                      style={[
                        styles.pickerChipLabel,
                        { color: toId === a.id ? '#fff' : Colors.ink },
                      ]}
                    >
                      {a.name} · {a.currency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {insufficient && (
              <Text style={styles.transferError}>Saldo insuficiente en la cuenta de origen.</Text>
            )}

            <Button
              label="Transferir"
              onPress={handleSubmit}
              loading={createTransfer.isPending}
              disabled={!canSubmit}
              style={{ marginTop: Spacing.lg, marginBottom: Spacing.md }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Recurring expense components ─────────────────────────────────────────────

function RecurringExpenseRow({
  item,
  onEdit,
  onToggle,
  onDelete,
  toggling,
  isLast,
}: {
  item: RecurringExpense;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.catDot, { backgroundColor: item.category?.color ?? Colors.muted }]} />
      <TouchableOpacity style={styles.txCenter} onPress={onEdit} activeOpacity={0.6}>
        <Text style={[styles.txConcept, !item.isActive && { color: Colors.muted }]}>
          {item.concept}
        </Text>
        <Text style={styles.txMeta}>
          {item.dueDay ? `Día ${item.dueDay}` : 'Sin día fijo'}
          {item.currency !== 'ARS' ? ` · ${item.currency}` : ''}
        </Text>
      </TouchableOpacity>
      {toggling ? (
        <ActivityIndicator size="small" color={Colors.vivid} style={{ marginRight: 8 }} />
      ) : (
        <Switch
          value={item.isActive}
          onValueChange={onToggle}
          trackColor={{ false: Colors.line, true: Colors.vivid }}
          thumbColor="#fff"
        />
      )}
      <TouchableOpacity
        onPress={() =>
          Alert.alert('Eliminar', `¿Eliminar "${item.concept}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Eliminar', style: 'destructive', onPress: onDelete },
          ])
        }
        hitSlop={8}
        style={{ marginLeft: 4 }}
      >
        <Trash2 size={16} color={Colors.muted} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

const CURRENCIES = ['ARS', 'USD', 'EUR'];

function RecurringFormModal({
  visible,
  onClose,
  editing,
}: {
  visible: boolean;
  onClose: () => void;
  editing?: RecurringExpense | null;
}) {
  const isEditing = !!editing;
  const [concept, setConcept] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [dueDay, setDueDay] = useState('');
  const [notes, setNotes] = useState('');

  const { data: categories = [] } = useTxCategories('egresos');
  const createRecurring = useCreateRecurringExpense();
  const updateRecurring = useUpdateRecurringExpense();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!visible) {
      setConcept('');
      setCategoryId('');
      setCurrency('ARS');
      setDueDay('');
      setNotes('');
    } else if (editing) {
      setConcept(editing.concept);
      setCategoryId(editing.categoryId);
      setCurrency(editing.currency);
      setDueDay(editing.dueDay ? String(editing.dueDay) : '');
      setNotes(editing.notes ?? '');
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [visible, editing, categories]);

  const handleSubmit = () => {
    if (!concept.trim()) {
      Alert.alert('Error', 'El concepto es requerido');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Seleccioná una categoría');
      return;
    }
    const parsedDay = dueDay ? parseInt(dueDay, 10) : undefined;
    if (parsedDay !== undefined && (parsedDay < 1 || parsedDay > 31)) {
      Alert.alert('Error', 'El día de vencimiento debe ser entre 1 y 31');
      return;
    }
    const dto: CreateRecurringExpenseDTO = {
      concept: concept.trim(),
      categoryId,
      currency,
      dueDay: parsedDay ?? null,
      notes: notes.trim() || null,
    };
    const onError = makeCreateErrorHandler({
      queryClient,
      invalidateKeys: [recurringKeys.all, monthlyExpenseKeys.all],
      onClose,
      fallbackMessage: isEditing
        ? 'No se pudo guardar el gasto fijo'
        : 'No se pudo crear el gasto fijo',
      savedMessage:
        'La confirmación no llegó por la conexión, pero el gasto fijo probablemente se guardó. Fijate en la lista antes de crearlo de nuevo.',
    });
    if (isEditing && editing) {
      updateRecurring.mutate({ id: editing.id, dto }, { onSuccess: onClose, onError });
    } else {
      createRecurring.mutate(dto, { onSuccess: onClose, onError });
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
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar gasto fijo' : 'Nuevo gasto fijo'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.conceptInput}
              value={concept}
              onChangeText={setConcept}
              placeholder="Concepto (ej. Alquiler, Netflix…)"
              placeholderTextColor={Colors.muted}
              autoFocus
              returnKeyType="next"
            />

            <Text style={styles.pickerLabel}>CATEGORÍA *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
              contentContainerStyle={{ gap: Spacing.sm }}
            >
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerChip, categoryId === c.id && styles.pickerChipActive]}
                  onPress={() => setCategoryId(c.id)}
                >
                  {c.icon && <Text style={{ fontSize: 13 }}>{c.icon}</Text>}
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      { color: categoryId === c.id ? '#fff' : Colors.ink },
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>MONEDA</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {CURRENCIES.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.pickerChip, currency === cur && styles.pickerChipActive]}
                  onPress={() => setCurrency(cur)}
                >
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      { color: currency === cur ? '#fff' : Colors.ink },
                    ]}
                  >
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.pickerLabel}>DÍA DE VENCIMIENTO (opcional, 1–31)</Text>
            <TextInput
              style={[styles.conceptInput, { marginBottom: Spacing.lg }]}
              value={dueDay}
              onChangeText={(v) => setDueDay(v.replace(/\D/g, '').slice(0, 2))}
              placeholder="Ej. 15"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              returnKeyType="done"
            />

            <Text style={styles.pickerLabel}>NOTAS (opcional)</Text>
            <TextInput
              style={[styles.conceptInput, { minHeight: 56, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Comentarios…"
              placeholderTextColor={Colors.muted}
              multiline
            />

            <Button
              label={isEditing ? 'Guardar cambios' : 'Guardar gasto fijo'}
              onPress={handleSubmit}
              loading={createRecurring.isPending || updateRecurring.isPending}
              disabled={
                !concept.trim() ||
                !categoryId ||
                createRecurring.isPending ||
                updateRecurring.isPending
              }
              style={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Monthly expense components ───────────────────────────────────────────────

function MonthlyExpenseRow({
  item,
  onPay,
  onUndo,
  actionPending,
  isLast,
}: {
  item: MonthlyExpense;
  onPay: () => void;
  onUndo: () => void;
  actionPending: boolean;
  isLast?: boolean;
}) {
  const isPaid = item.status === 'pagado';
  const dotColor = item.category?.color ?? Colors.muted;

  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.catDot, { backgroundColor: dotColor }]} />
      <View style={styles.txCenter}>
        <Text style={[styles.txConcept, isPaid && { color: Colors.muted }]} numberOfLines={1}>
          {item.concept}
        </Text>
        <Text style={styles.txMeta}>
          {item.recurringExpense?.dueDay ? `Día ${item.recurringExpense.dueDay}` : 'Mensual'}
          {!isPaid && item.previousAmount ? ' · mes anterior' : ''}
        </Text>
      </View>
      {isPaid ? (
        <Text style={[styles.txAmount, { color: Colors.ink }]}>
          {formatMoney(item.amount, item.recurringExpense?.currency)}
        </Text>
      ) : (
        <Text style={[styles.txAmount, { color: Colors.muted }]}>
          {item.previousAmount
            ? `~${formatMoney(item.previousAmount, item.recurringExpense?.currency)}`
            : '—'}
        </Text>
      )}
      {actionPending ? (
        <ActivityIndicator size="small" color={Colors.vivid} style={{ marginLeft: 8 }} />
      ) : isPaid ? (
        <TouchableOpacity onPress={onUndo} hitSlop={8} style={{ marginLeft: 8 }}>
          <Undo2 size={16} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onPay} style={styles.payBtn}>
          <Text style={styles.payBtnLabel}>Pagar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PayExpenseModal({
  visible,
  expense,
  accounts,
  onClose,
}: {
  visible: boolean;
  expense: MonthlyExpense | null;
  accounts: Account[];
  onClose: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const payMutation = usePayMonthlyExpense();
  const { sortByUsage, recordUse } = useAccountUsage();

  // Cuentas ordenadas de más usada a menos usada (para el combo).
  const orderedAccounts = useMemo(() => sortByUsage(accounts), [accounts, sortByUsage]);
  const selectedAccount = orderedAccounts.find((a) => a.id === accountId) ?? null;

  useEffect(() => {
    if (visible && expense) {
      setAmount(String(expense.amount));
    }
    if (visible && orderedAccounts.length > 0) {
      // Por defecto, la cuenta más usada.
      setAccountId((prev) => prev || orderedAccounts[0].id);
    }
  }, [visible, expense, orderedAccounts]);

  const handleClose = () => {
    setAmount('');
    setAccountOpen(false);
    onClose();
  };

  const canSubmit = amount.trim() !== '' && parseFloat(amount) > 0 && !!accountId;

  const handlePay = () => {
    if (!expense || !canSubmit) return;
    payMutation.mutate(
      { id: expense.id, dto: { amount: parseFloat(amount), accountId } },
      {
        onSuccess: () => {
          recordUse(accountId); // sube el ranking de uso de esta cuenta
          handleClose();
        },
      }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Registrar pago</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {expense && (
            <Text style={[styles.txMeta, { marginBottom: Spacing.md, fontSize: 13 }]}>
              {expense.concept}
            </Text>
          )}

          <TextInput
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={Colors.ceilLight}
            keyboardType="numeric"
            autoFocus
          />

          <Text style={styles.pickerLabel}>CUENTA</Text>
          <TouchableOpacity
            style={styles.comboField}
            onPress={() => setAccountOpen((o) => !o)}
            activeOpacity={0.7}
          >
            {selectedAccount?.color && (
              <View style={[styles.accountDot, { backgroundColor: selectedAccount.color }]} />
            )}
            <Text style={styles.comboFieldName} numberOfLines={1}>
              {selectedAccount ? selectedAccount.name : 'Elegí una cuenta'}
            </Text>
            {selectedAccount && (
              <Text style={styles.comboFieldBal}>
                {formatMoney(selectedAccount.balance, selectedAccount.currency)}
              </Text>
            )}
            <ChevronDown
              size={18}
              color={Colors.muted}
              style={{ transform: [{ rotate: accountOpen ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {accountOpen && (
            <View style={styles.comboList}>
              <ScrollView
                style={{ maxHeight: 220 }}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {orderedAccounts.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.filterRow, accountId === a.id && styles.filterRowActive]}
                    onPress={() => {
                      setAccountId(a.id);
                      setAccountOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.accountDot, a.color ? { backgroundColor: a.color } : null]}
                    />
                    <Text style={styles.filterRowName} numberOfLines={1}>
                      {a.name}
                    </Text>
                    <Text style={styles.filterRowBal}>{formatMoney(a.balance, a.currency)}</Text>
                    {accountId === a.id && <Check size={18} color={Colors.vivid} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Button
            label="Confirmar pago"
            onPress={handlePay}
            loading={payMutation.isPending}
            disabled={!canSubmit}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Budget components ────────────────────────────────────────────────────────

function BudgetCard({
  budget,
  onEdit,
  onDelete,
}: {
  budget: BudgetSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const pct = Math.min(budget.percentage, 100);
  const isOver = budget.percentage > 100;
  const dotColor = budget.category?.color ?? Colors.vivid;
  const barColor = isOver ? '#ef4444' : budget.percentage >= 80 ? '#f59e0b' : Colors.vivid;

  return (
    <Card solid style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View
          style={[
            styles.catDot,
            { backgroundColor: dotColor, width: 12, height: 12, borderRadius: 6 },
          ]}
        />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.txConcept}>
            {budget.category?.icon ? `${budget.category.icon} ` : ''}
            {budget.category?.name ?? 'Sin categoría'}
          </Text>
          <Text style={styles.txMeta}>{formatMoney(budget.amount, budget.currency)}</Text>
        </View>
        <Text style={[styles.budgetPct, { color: isOver ? '#ef4444' : Colors.muted }]}>
          {Math.round(budget.percentage)}%
        </Text>
        <TouchableOpacity onPress={onEdit} hitSlop={8} style={{ marginLeft: 12 }}>
          <Pencil size={15} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={8} style={{ marginLeft: 10 }}>
          <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={[styles.txMeta, { color: '#ef4444' }]}>
          Gastado {formatMoney(budget.spent, budget.currency)}
        </Text>
        <Text style={[styles.txMeta, { color: isOver ? '#ef4444' : '#22c55e' }]}>
          {isOver ? 'Excedido' : 'Restante'}{' '}
          {formatMoney(Math.abs(budget.remaining), budget.currency)}
        </Text>
      </View>
    </Card>
  );
}

function BudgetFormModal({
  visible,
  budget,
  onClose,
}: {
  visible: boolean;
  budget: BudgetSummary | null;
  onClose: () => void;
}) {
  const isEditing = !!budget;
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');

  const { data: categories = [] } = useTxCategories('egresos');
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (visible) {
      if (budget) {
        setCategoryId(budget.categoryId);
        setAmount(String(budget.amount));
        setCurrency(budget.currency);
      } else {
        setCategoryId(categories[0]?.id ?? '');
        setAmount('');
        setCurrency('ARS');
      }
    }
  }, [visible, budget, categories]);

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const canSubmit = amount.trim() !== '' && parseFloat(amount) > 0 && (isEditing || !!categoryId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isEditing && budget) {
      updateBudget.mutate(
        { id: budget.id, dto: { amount: parseFloat(amount), currency } },
        { onSuccess: handleClose }
      );
    } else {
      createBudget.mutate(
        { categoryId, amount: parseFloat(amount), currency },
        {
          onSuccess: handleClose,
          onError: makeCreateErrorHandler({
            queryClient,
            invalidateKeys: [budgetKeys.all],
            onClose: handleClose,
            fallbackMessage: 'No se pudo crear el presupuesto',
            savedMessage:
              'La confirmación no llegó por la conexión, pero el presupuesto probablemente se creó. Fijate en la lista antes de crearlo de nuevo.',
          }),
        }
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {!isEditing && (
              <>
                <Text style={styles.pickerLabel}>CATEGORÍA *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerScroll}
                  contentContainerStyle={{ gap: Spacing.sm }}
                >
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pickerChip, categoryId === c.id && styles.pickerChipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      {c.icon && <Text style={{ fontSize: 13 }}>{c.icon}</Text>}
                      <Text
                        style={[
                          styles.pickerChipLabel,
                          { color: categoryId === c.id ? '#fff' : Colors.ink },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {isEditing && (
              <Text style={[styles.txMeta, { marginBottom: Spacing.md, fontSize: 13 }]}>
                {budget?.category?.icon} {budget?.category?.name}
              </Text>
            )}

            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={Colors.ceilLight}
              keyboardType="numeric"
              autoFocus={isEditing}
            />

            <Text style={styles.pickerLabel}>MONEDA</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
              {CURRENCIES.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.pickerChip, currency === cur && styles.pickerChipActive]}
                  onPress={() => setCurrency(cur)}
                >
                  <Text
                    style={[
                      styles.pickerChipLabel,
                      { color: currency === cur ? '#fff' : Colors.ink },
                    ]}
                  >
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label={isEditing ? 'Guardar cambios' : 'Crear presupuesto'}
              onPress={handleSubmit}
              loading={createBudget.isPending || updateBudget.isPending}
              disabled={!canSubmit}
              style={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Savings goal components ──────────────────────────────────────────────────

function SavingsGoalCard({
  goal,
  onEdit,
  onDelete,
  onComplete,
}: {
  goal: SavingsGoalWithProgress;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}) {
  const pct = Math.min(goal.progress, 100);
  const isCompleted = goal.status === 'completada';
  const isCancelled = goal.status === 'cancelada';
  const barColor = isCompleted
    ? '#22c55e'
    : goal.progress >= 75
      ? Colors.vivid
      : goal.progress >= 40
        ? '#f59e0b'
        : Colors.muted;
  const dotColor = goal.account?.color ?? Colors.vivid;
  const currency = goal.account?.currency ?? 'ARS';

  return (
    <Card solid style={{ marginBottom: Spacing.md, opacity: isCancelled ? 0.55 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View
          style={[
            styles.catDot,
            { backgroundColor: dotColor, width: 12, height: 12, borderRadius: 6 },
          ]}
        />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.txConcept}>{goal.name}</Text>
          <Text style={styles.txMeta}>{goal.account?.name}</Text>
        </View>
        {isCompleted && <Text style={{ fontSize: 16, marginRight: 4 }}>✅</Text>}
        {!isCompleted && !isCancelled && goal.progress >= 100 && (
          <TouchableOpacity
            onPress={onComplete}
            hitSlop={8}
            style={[styles.payBtn, { marginRight: 6 }]}
          >
            <Text style={styles.payBtnLabel}>Completar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onEdit} hitSlop={8} style={{ marginLeft: 4 }}>
          <Pencil size={15} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={8} style={{ marginLeft: 10 }}>
          <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]}
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={styles.txMeta}>
          {formatMoney(goal.savedAmount, currency)} de {formatMoney(goal.targetAmount, currency)}
        </Text>
        <Text style={[styles.budgetPct, { fontSize: 12, color: barColor }]}>
          {Math.round(goal.progress)}%
        </Text>
      </View>

      {goal.targetDate && (
        <Text style={[styles.txMeta, { marginTop: 4 }]}>
          Meta: {format(new Date(goal.targetDate), "d 'de' MMMM yyyy", { locale: es })}
        </Text>
      )}
    </Card>
  );
}

function SavingsGoalFormModal({
  visible,
  goal,
  accounts,
  onClose,
}: {
  visible: boolean;
  goal: SavingsGoalWithProgress | null;
  accounts: Account[];
  onClose: () => void;
}) {
  const isEditing = !!goal;
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');

  const createGoal = useCreateSavingsGoal();
  const updateGoal = useUpdateSavingsGoal();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (visible) {
      if (goal) {
        setName(goal.name);
        setAccountId(goal.accountId);
        setTargetAmount(String(goal.targetAmount));
        setTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
        setNotes(goal.notes ?? '');
      } else {
        setName('');
        setAccountId(accounts[0]?.id ?? '');
        setTargetAmount('');
        setTargetDate('');
        setNotes('');
      }
    }
  }, [visible, goal, accounts]);

  const handleClose = () => {
    setName('');
    setTargetAmount('');
    setTargetDate('');
    setNotes('');
    onClose();
  };

  const canSubmit =
    name.trim() !== '' && parseFloat(targetAmount) > 0 && (isEditing || !!accountId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const targetDateISO = targetDate.trim()
      ? new Date(`${targetDate}T12:00:00`).toISOString()
      : null;

    if (isEditing && goal) {
      updateGoal.mutate(
        {
          id: goal.id,
          data: {
            name: name.trim(),
            targetAmount: parseFloat(targetAmount),
            targetDate: targetDateISO,
            notes: notes.trim() || null,
          },
        },
        { onSuccess: handleClose }
      );
    } else {
      createGoal.mutate(
        {
          name: name.trim(),
          accountId,
          targetAmount: parseFloat(targetAmount),
          targetDate: targetDateISO,
          notes: notes.trim() || null,
        },
        {
          onSuccess: handleClose,
          onError: makeCreateErrorHandler({
            queryClient,
            invalidateKeys: [savingsGoalKeys.all],
            onClose: handleClose,
            fallbackMessage: 'No se pudo crear la meta de ahorro',
            savedMessage:
              'La confirmación no llegó por la conexión, pero la meta probablemente se creó. Fijate en la lista antes de crearla de nuevo.',
          }),
        }
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.conceptInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la meta (ej. Vacaciones)"
              placeholderTextColor={Colors.muted}
              autoFocus={!isEditing}
              returnKeyType="next"
            />

            {!isEditing && (
              <>
                <Text style={styles.pickerLabel}>CUENTA *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerScroll}
                  contentContainerStyle={{ gap: Spacing.sm }}
                >
                  {accounts.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.pickerChip, accountId === a.id && styles.pickerChipActive]}
                      onPress={() => setAccountId(a.id)}
                    >
                      {a.color && (
                        <View style={[styles.accountDot, { backgroundColor: a.color }]} />
                      )}
                      <Text
                        style={[
                          styles.pickerChipLabel,
                          { color: accountId === a.id ? '#fff' : Colors.ink },
                        ]}
                      >
                        {a.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {isEditing && (
              <Text style={[styles.txMeta, { marginBottom: Spacing.md, fontSize: 13 }]}>
                Cuenta: {goal?.account?.name}
              </Text>
            )}

            <Text style={styles.pickerLabel}>MONTO OBJETIVO *</Text>
            <TextInput
              style={[styles.conceptInput, { marginBottom: Spacing.lg }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="Ej. 500000"
              placeholderTextColor={Colors.muted}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={styles.pickerLabel}>FECHA OBJETIVO (AAAA-MM-DD, opcional)</Text>
            <TextInput
              style={[styles.conceptInput, { marginBottom: Spacing.lg }]}
              value={targetDate}
              onChangeText={setTargetDate}
              placeholder="2025-12-31"
              placeholderTextColor={Colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.pickerLabel}>NOTAS (opcional)</Text>
            <TextInput
              style={[styles.conceptInput, { minHeight: 56, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Comentarios…"
              placeholderTextColor={Colors.muted}
              multiline
            />

            <Button
              label={isEditing ? 'Guardar cambios' : 'Crear meta de ahorro'}
              onPress={handleSubmit}
              loading={createGoal.isPending || updateGoal.isPending}
              disabled={!canSubmit}
              style={{ marginTop: Spacing.sm, marginBottom: Spacing.md }}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── screen ───────────────────────────────────────────────────────────────────

type DineroTab = 'movimientos' | 'fijos' | 'mensuales' | 'presupuestos' | 'ahorro';

export default function DineroScreen() {
  const now = new Date();
  const { tab } = useLocalSearchParams<{ tab?: DineroTab }>();
  const [activeTab, setActiveTab] = useState<DineroTab>('movimientos');

  // Permite abrir Dinero directamente en una pestaña (ej: "Ver todos" de Gastos
  // Pendientes → pestaña Mensuales), igual que foco.tsx con su parámetro tab.
  useEffect(() => {
    if (
      tab === 'movimientos' ||
      tab === 'fijos' ||
      tab === 'mensuales' ||
      tab === 'presupuestos' ||
      tab === 'ahorro'
    ) {
      setActiveTab(tab);
    }
  }, [tab]);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MonthlyExpense | null>(null);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetEditing, setBudgetEditing] = useState<BudgetSummary | null>(null);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [savingsEditing, setSavingsEditing] = useState<SavingsGoalWithProgress | null>(null);

  const queryClient = useQueryClient();

  const monthStart = useMemo(
    () => format(startOfMonth(new Date(selectedYear, selectedMonth, 1)), 'yyyy-MM-dd'),
    [selectedMonth, selectedYear]
  );

  const monthEnd = useMemo(
    () => format(endOfMonth(new Date(selectedYear, selectedMonth, 1)), 'yyyy-MM-dd'),
    [selectedMonth, selectedYear]
  );

  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: financeStats, isFetching: statsFetching } = useFinanceStats(
    selectedMonth + 1,
    selectedYear
  );
  const {
    data: txData,
    isLoading: txLoading,
    isFetching: txFetching,
  } = useTransactions({
    accountId: selectedAccountId ?? undefined,
    from: monthStart,
    to: monthEnd,
    limit: 50,
  });

  const deleteTransaction = useDeleteTransaction();

  const { data: recurringList = [], isLoading: recurringLoading } = useRecurringExpenses();
  const updateRecurring = useUpdateRecurringExpense();
  const deleteRecurring = useDeleteRecurringExpense();

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyExpenses(
    selectedMonth + 1,
    selectedYear
  );
  const undoPayment = useUndoMonthlyExpensePayment();

  const { data: budgetSummaryData, isLoading: budgetLoading } = useBudgetsSummary(
    selectedMonth + 1,
    selectedYear
  );
  useBudgets(); // prefetch base budgets for edit
  const deleteBudgetMutation = useDeleteBudget();
  const budgetSummary = budgetSummaryData?.summary ?? [];

  const { data: savingsData, isLoading: savingsLoading } = useSavingsGoals();
  const deleteSavingsMutation = useDeleteSavingsGoal();
  const completeSavingsMutation = useUpdateSavingsGoal();
  const savingsGoals = savingsData?.savingsGoals ?? [];
  const activeSavings = savingsGoals.filter((g) => g.status === 'en_progreso');
  const completedSavings = savingsGoals.filter((g) => g.status === 'completada');

  const monthlyExpenses = monthlyData?.monthlyExpenses ?? [];
  const pendingExpenses = useMemo(
    () => monthlyExpenses.filter((e) => e.status === 'pendiente'),
    [monthlyExpenses]
  );
  const paidExpenses = useMemo(
    () => monthlyExpenses.filter((e) => e.status === 'pagado'),
    [monthlyExpenses]
  );
  // Pendiente: usamos el monto del mes pasado como referencia (aún no se pagó, su
  // `amount` es 0). Espejo de la web.
  const totalPending = useMemo(
    () => pendingExpenses.reduce((sum, e) => sum + Number(e.previousAmount || 0), 0),
    [pendingExpenses]
  );
  const totalPaid = useMemo(
    () => paidExpenses.reduce((sum, e) => sum + e.amount, 0),
    [paidExpenses]
  );

  const accounts = accountsData?.accounts ?? [];

  // Saldo total por moneda (no se suman monedas distintas).
  const balancesByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    accounts.forEach((a) =>
      map.set(a.currency, (map.get(a.currency) ?? 0) + Number(a.balance || 0))
    );
    return Array.from(map, ([currency, total]) => ({ currency, total }));
  }, [accounts]);

  // Cuentas agrupadas por moneda (con subtotal) para la grilla de filtro.
  const accountsByCurrency = useMemo(() => {
    const map = new Map<string, typeof accounts>();
    accounts.forEach((a) => {
      if (!map.has(a.currency)) map.set(a.currency, []);
      map.get(a.currency)!.push(a);
    });
    return Array.from(map, ([currency, accs]) => ({
      currency,
      accounts: accs,
      subtotal: accs.reduce((s, a) => s + Number(a.balance || 0), 0),
    }));
  }, [accounts]);

  const transactions = txData?.transactions ?? [];
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);

  const onRefresh = useCallback(async () => {
    // Offline-first: el pull-to-refresh fuerza un sync con el server (pull+push);
    // los datos locales se re-leen solos vía withChangesForTables. Las
    // invalidaciones quedan para financeStats (REST) y como red de seguridad.
    await Promise.all([
      syncNow().catch(() => {}),
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
      queryClient.invalidateQueries({ queryKey: recurringKeys.all }),
      queryClient.invalidateQueries({ queryKey: monthlyExpenseKeys.all }),
      queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
      queryClient.invalidateQueries({ queryKey: savingsGoalKeys.all }),
    ]);
  }, [queryClient]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer
        onRefresh={onRefresh}
        refreshing={(statsFetching || txFetching) && !accountsLoading && !txLoading}
      >
        {/* ─── Page header ──────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.pageTitle}>Dinero</Text>
            <SyncStatusDot />
          </View>
          <Text style={styles.pageSubtitle}>Tu situación financiera</Text>
        </View>

        <MoneyHeroCard
          stats={financeStats}
          month={selectedMonth}
          year={selectedYear}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />

        {/* ─── Tab chips ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabRow}
        >
          <Chip
            label="Movimientos"
            active={activeTab === 'movimientos'}
            badge={transactions.length || undefined}
            onPress={() => setActiveTab('movimientos')}
          />
          <Chip
            label="Mensuales"
            active={activeTab === 'mensuales' || activeTab === 'fijos'}
            badge={pendingExpenses.length || undefined}
            onPress={() => setActiveTab('mensuales')}
          />
          <Chip
            label="Presupuesto"
            active={activeTab === 'presupuestos'}
            badge={budgetSummary.length || undefined}
            onPress={() => setActiveTab('presupuestos')}
          />
          <Chip
            label="Ahorro"
            active={activeTab === 'ahorro'}
            badge={activeSavings.length || undefined}
            onPress={() => setActiveTab('ahorro')}
          />
        </ScrollView>

        {activeTab === 'movimientos' ? (
          <>
            {accounts.length > 0 && (
              <>
                <View style={styles.accountsSummary}>
                  <Text style={styles.accountsSummaryLabel}>Saldo total</Text>
                  <Text style={styles.accountsSummaryValue}>
                    {balancesByCurrency
                      .map((b) => formatMoney(b.total, b.currency))
                      .join('   ·   ')}
                  </Text>
                  <Text style={styles.accountsCount}>
                    {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
                  </Text>
                </View>

                <Card padding={0} solid style={styles.accountGrid}>
                  <ScrollView
                    style={styles.accountGridScroll}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                  >
                    <TouchableOpacity
                      style={[
                        styles.filterRow,
                        selectedAccountId === null && styles.filterRowActive,
                      ]}
                      onPress={() => setSelectedAccountId(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterRowName, { flex: 1 }]}>Todas las cuentas</Text>
                      {selectedAccountId === null && <Check size={18} color={Colors.vivid} />}
                    </TouchableOpacity>

                    {accountsByCurrency.map((group) => (
                      <View key={group.currency}>
                        <View style={styles.currencyHeader}>
                          <Text style={styles.currencyHeaderText}>{group.currency}</Text>
                          <Text style={styles.currencyHeaderSub}>
                            {formatMoney(group.subtotal, group.currency)}
                          </Text>
                        </View>
                        {group.accounts.map((a) => (
                          <TouchableOpacity
                            key={a.id}
                            style={[
                              styles.filterRow,
                              selectedAccountId === a.id && styles.filterRowActive,
                            ]}
                            onPress={() =>
                              setSelectedAccountId(selectedAccountId === a.id ? null : a.id)
                            }
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                styles.accountDot,
                                a.color ? { backgroundColor: a.color } : null,
                              ]}
                            />
                            <Text style={styles.filterRowName} numberOfLines={1}>
                              {a.name}
                            </Text>
                            <Text style={styles.filterRowBal}>
                              {formatMoney(a.balance, a.currency)}
                            </Text>
                            {selectedAccountId === a.id && <Check size={18} color={Colors.vivid} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </Card>
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Movimientos</Text>
              {transactions.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{transactions.length}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              {accounts.length >= 2 && (
                <TouchableOpacity
                  style={styles.transferBtn}
                  onPress={() => setShowTransferModal(true)}
                  activeOpacity={0.7}
                >
                  <ArrowLeftRight size={13} color={Colors.vivid} strokeWidth={2} />
                  <Text style={styles.transferBtnLabel}>Transferir</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  setEditingTx(null);
                  setShowModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.newBtn}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>

            {txLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
            ) : grouped.length === 0 ? (
              <Card solid>
                <Text style={styles.emptyText}>Sin movimientos este mes 💸</Text>
              </Card>
            ) : (
              grouped.map((group) => (
                <View key={group.date}>
                  <Text style={styles.dateHeader}>{group.label}</Text>
                  <Card padding={0} solid>
                    {group.items.map((tx, i) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx}
                        onEdit={() => {
                          setEditingTx(tx);
                          setShowModal(true);
                        }}
                        onDelete={() => deleteTransaction.mutate(tx.id)}
                        deleting={
                          deleteTransaction.isPending && deleteTransaction.variables === tx.id
                        }
                        isLast={i === group.items.length - 1}
                      />
                    ))}
                  </Card>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'fijos' ? (
          <>
            <TouchableOpacity
              onPress={() => setActiveTab('mensuales')}
              activeOpacity={0.7}
              style={styles.backLink}
            >
              <ChevronLeft size={16} color={Colors.vivid} strokeWidth={2} />
              <Text style={styles.backLinkLabel}>Mensuales</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gastos fijos</Text>
                <Text style={styles.pageSubtitle}>Qué se repite cada mes</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => {
                  setEditingRecurring(null);
                  setShowRecurringModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.newBtn}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>

            {recurringLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
            ) : recurringList.length === 0 ? (
              <Card solid>
                <Text style={styles.emptyText}>Sin gastos fijos registrados 🧾</Text>
              </Card>
            ) : (
              groupByCategory(recurringList).map((group) => (
                <View key={group.key} style={{ marginBottom: Spacing.sm }}>
                  <CategoryGroupHeader
                    name={group.name}
                    icon={group.icon}
                    color={group.color}
                    count={group.items.length}
                  />
                  <Card padding={0} solid>
                    {group.items.map((item, i) => (
                      <RecurringExpenseRow
                        key={item.id}
                        item={item}
                        onEdit={() => {
                          setEditingRecurring(item);
                          setShowRecurringModal(true);
                        }}
                        onToggle={() =>
                          updateRecurring.mutate({ id: item.id, dto: { isActive: !item.isActive } })
                        }
                        onDelete={() => deleteRecurring.mutate(item.id)}
                        toggling={
                          updateRecurring.isPending &&
                          (updateRecurring.variables as any)?.id === item.id
                        }
                        isLast={i === group.items.length - 1}
                      />
                    ))}
                  </Card>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'mensuales' ? (
          <>
            {/* Encabezado: acceso a la configuración de gastos fijos */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gastos del mes</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => setActiveTab('fijos')}
                activeOpacity={0.7}
                style={styles.manageBtn}
              >
                <Settings size={14} color={Colors.vivid} strokeWidth={2} />
                <Text style={styles.manageBtnLabel}>Gestionar fijos</Text>
              </TouchableOpacity>
            </View>

            {/* PENDIENTES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pendientes</Text>
              {pendingExpenses.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{pendingExpenses.length}</Text>
                </View>
              )}
            </View>

            {monthlyLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
            ) : pendingExpenses.length === 0 ? (
              <Card solid>
                <Text style={styles.emptyText}>Todo pagado este mes ✅</Text>
              </Card>
            ) : (
              groupByCategory(pendingExpenses).map((group) => (
                <View key={group.key} style={{ marginBottom: Spacing.sm }}>
                  <CategoryGroupHeader
                    name={group.name}
                    icon={group.icon}
                    color={group.color}
                    count={group.items.length}
                  />
                  <Card padding={0} solid>
                    {group.items.map((item, i) => (
                      <MonthlyExpenseRow
                        key={item.id}
                        item={item}
                        onPay={() => {
                          setSelectedExpense(item);
                          setShowPayModal(true);
                        }}
                        onUndo={() => undoPayment.mutate(item.id)}
                        actionPending={undoPayment.isPending && undoPayment.variables === item.id}
                        isLast={i === group.items.length - 1}
                      />
                    ))}
                  </Card>
                </View>
              ))
            )}

            {/* PAGADOS */}
            {paidExpenses.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pagados</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{paidExpenses.length}</Text>
                  </View>
                </View>
                {groupByCategory(paidExpenses).map((group) => (
                  <View key={group.key} style={{ marginBottom: Spacing.sm }}>
                    <CategoryGroupHeader
                      name={group.name}
                      icon={group.icon}
                      color={group.color}
                      count={group.items.length}
                    />
                    <Card padding={0} solid>
                      {group.items.map((item, i) => (
                        <MonthlyExpenseRow
                          key={item.id}
                          item={item}
                          onPay={() => {
                            setSelectedExpense(item);
                            setShowPayModal(true);
                          }}
                          onUndo={() => undoPayment.mutate(item.id)}
                          actionPending={undoPayment.isPending && undoPayment.variables === item.id}
                          isLast={i === group.items.length - 1}
                        />
                      ))}
                    </Card>
                  </View>
                ))}
              </>
            )}

            {/* RESUMEN */}
            {monthlyExpenses.length > 0 && (
              <Card solid style={{ marginTop: Spacing.xl }}>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                >
                  <Text style={styles.txMeta}>Pendiente</Text>
                  <Text style={[styles.txAmount, { color: '#ef4444', fontSize: 13 }]}>
                    {formatMoney(totalPending)}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                >
                  <Text style={styles.txMeta}>Pagado</Text>
                  <Text style={[styles.txAmount, { color: '#22c55e', fontSize: 13 }]}>
                    {formatMoney(totalPaid)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: Colors.line,
                  }}
                >
                  <Text style={[styles.txConcept, { fontSize: 13 }]}>Total</Text>
                  <Text style={styles.txAmount}>{formatMoney(totalPending - totalPaid)}</Text>
                </View>
              </Card>
            )}
          </>
        ) : activeTab === 'presupuestos' ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Presupuestos</Text>
              {budgetSummary.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{budgetSummary.length}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => {
                  setBudgetEditing(null);
                  setShowBudgetModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.newBtn}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>

            {budgetLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
            ) : budgetSummary.length === 0 ? (
              <Card solid>
                <Text style={styles.emptyText}>Sin presupuestos configurados 🎯</Text>
                <Button
                  label="+ Nuevo presupuesto"
                  onPress={() => {
                    setBudgetEditing(null);
                    setShowBudgetModal(true);
                  }}
                  style={{ marginTop: Spacing.md }}
                />
              </Card>
            ) : (
              budgetSummary.map((b) => (
                <BudgetCard
                  key={b.id}
                  budget={b}
                  onEdit={() => {
                    setBudgetEditing(b);
                    setShowBudgetModal(true);
                  }}
                  onDelete={() =>
                    Alert.alert(
                      'Eliminar presupuesto',
                      `¿Eliminar el presupuesto de ${b.category?.name ?? 'esta categoría'}?`,
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () => deleteBudgetMutation.mutate(b.id),
                        },
                      ]
                    )
                  }
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* EN PROGRESO */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>En progreso</Text>
              {activeSavings.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeSavings.length}</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => {
                  setSavingsEditing(null);
                  setShowSavingsModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.newBtn}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>

            {savingsLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
            ) : activeSavings.length === 0 ? (
              <Card solid>
                <Text style={styles.emptyText}>Sin metas de ahorro activas 🐷</Text>
                <Button
                  label="+ Nueva meta"
                  onPress={() => {
                    setSavingsEditing(null);
                    setShowSavingsModal(true);
                  }}
                  style={{ marginTop: Spacing.md }}
                />
              </Card>
            ) : (
              activeSavings.map((g) => (
                <SavingsGoalCard
                  key={g.id}
                  goal={g}
                  onEdit={() => {
                    setSavingsEditing(g);
                    setShowSavingsModal(true);
                  }}
                  onDelete={() =>
                    Alert.alert('Eliminar meta', `¿Eliminar "${g.name}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => deleteSavingsMutation.mutate(g.id),
                      },
                    ])
                  }
                  onComplete={() =>
                    Alert.alert('Completar meta', `¿Marcar "${g.name}" como completada?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Completar',
                        onPress: () =>
                          completeSavingsMutation.mutate({
                            id: g.id,
                            data: { status: 'completada' },
                          }),
                      },
                    ])
                  }
                />
              ))
            )}

            {/* COMPLETADAS */}
            {completedSavings.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Completadas</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{completedSavings.length}</Text>
                  </View>
                </View>
                {completedSavings.map((g) => (
                  <SavingsGoalCard
                    key={g.id}
                    goal={g}
                    onEdit={() => {
                      setSavingsEditing(g);
                      setShowSavingsModal(true);
                    }}
                    onDelete={() =>
                      Alert.alert('Eliminar meta', `¿Eliminar "${g.name}"?`, [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () => deleteSavingsMutation.mutate(g.id),
                        },
                      ])
                    }
                    onComplete={() => {}}
                  />
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: Layout.tabBarHeight + Layout.tabBarOffset + 16 }} />
      </ScreenContainer>

      <TransactionFormModal
        visible={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTx(null);
        }}
        accounts={accounts}
        editingTransaction={editingTx}
      />
      <TransferModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        accounts={accounts}
      />
      <RecurringFormModal
        visible={showRecurringModal}
        editing={editingRecurring}
        onClose={() => {
          setShowRecurringModal(false);
          setEditingRecurring(null);
        }}
      />
      <PayExpenseModal
        visible={showPayModal}
        expense={selectedExpense}
        accounts={accounts}
        onClose={() => {
          setShowPayModal(false);
          setSelectedExpense(null);
        }}
      />
      <BudgetFormModal
        visible={showBudgetModal}
        budget={budgetEditing}
        onClose={() => {
          setShowBudgetModal(false);
          setBudgetEditing(null);
        }}
      />
      <SavingsGoalFormModal
        visible={showSavingsModal}
        goal={savingsEditing}
        accounts={accounts}
        onClose={() => {
          setShowSavingsModal(false);
          setSavingsEditing(null);
        }}
      />
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Hero
  hero: {
    borderRadius: Radius['3xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.nav,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: '#fff',
    letterSpacing: -1,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  statCol: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  statAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: Spacing.md,
  },

  // Tabs
  tabScroll: { marginBottom: Spacing.xl },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.screenX,
  },

  // New button (gastos fijos header)
  newBtn: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.vivid,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bgTop,
  },
  manageBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.vivid,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    marginLeft: -4,
  },
  backLinkLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.vivid,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  sectionBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.vivid,
  },

  accountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.ceilLight,
  },

  // Accounts summary + filter (movimientos)
  accountsSummary: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.account,
  },
  accountsSummaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
  },
  accountsSummaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  accountsCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },

  // Account filter grid (inline, scrollable — muestra ~5 cuentas)
  accountGrid: {
    marginBottom: Spacing.md,
  },
  accountGridScroll: {
    maxHeight: 280,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  filterRowActive: {
    backgroundColor: 'rgba(30,107,255,0.08)',
  },
  filterRowName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
    flex: 1,
    minWidth: 0,
  },
  filterRowBal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 4,
    backgroundColor: Colors.bgTop,
  },
  currencyHeaderText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  currencyHeaderSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.ink,
  },

  // Date header
  dateHeader: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    textTransform: 'capitalize',
  },

  // Transaction row
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    gap: Spacing.md,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
  },
  catGroupIcon: { fontSize: 15, width: 20, textAlign: 'center' },
  catGroupName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.ink,
  },
  catGroupCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
  },
  txCenter: { flex: 1 },
  txConcept: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  txMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
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
    maxHeight: '88%',
  },
  formListCard: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSolid,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  // Combo (select desplegable) de cuenta en el pago
  comboField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSolid,
  },
  comboFieldName: {
    flex: 1,
    minWidth: 0,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  comboFieldBal: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
  },
  comboList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSolid,
    overflow: 'hidden',
  },
  formList: {
    maxHeight: 176,
  },
  formListEmpty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  catRowIcon: {
    fontSize: 16,
    width: 20,
    textAlign: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.ice,
    borderRadius: Radius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  typeBtnEgreso: { backgroundColor: '#ef4444' },
  typeBtnIngreso: { backgroundColor: '#22c55e' },
  typeBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  amountInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: Colors.ink,
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.ice,
  },
  conceptInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.lg,
  },
  pickerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ice,
  },
  transferBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.vivid,
  },
  transferHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  transferError: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#ef4444',
    marginTop: Spacing.sm,
  },
  pickerScroll: {
    marginBottom: Spacing.md,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.ice,
  },
  pickerChipActive: {
    backgroundColor: Colors.vivid,
  },
  pickerChipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },

  // Page header
  pageHeader: {
    marginBottom: Spacing.xl,
  },
  pageTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: Colors.ink,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
  },

  // Budget card
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.ice,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  budgetPct: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.muted,
  },

  // Pay button (monthly expenses)
  payBtn: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    backgroundColor: Colors.vivid,
  },
  payBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#fff',
  },

  // Empty
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});

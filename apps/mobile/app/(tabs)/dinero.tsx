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
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Trash2,
  Undo2,
  Pencil,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Gradients, Shadows, Layout } from '@/tokens';
import { useAccounts, useFinanceStats, accountKeys } from '@/hooks/useAccounts';
import {
  useTransactions,
  useCreateTransaction,
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

function formatMoney(amount: number, currency = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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

function AccountChip({
  account,
  active,
  onPress,
}: {
  account: Account;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.accountChip, active && styles.accountChipActive]}
    >
      {account.color && <View style={[styles.accountDot, { backgroundColor: account.color }]} />}
      <View>
        <Text style={[styles.accountChipName, { color: active ? '#fff' : Colors.ink }]}>
          {account.name}
        </Text>
        <Text
          style={[
            styles.accountChipBal,
            { color: active ? 'rgba(255,255,255,0.75)' : Colors.muted },
          ]}
        >
          {formatMoney(account.balance, account.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function TransactionRow({
  tx,
  onDelete,
  deleting,
  isLast,
}: {
  tx: Transaction;
  onDelete: () => void;
  deleting: boolean;
  isLast?: boolean;
}) {
  const isIncome = tx.type === 'ingreso';
  const dotColor = tx.category?.color ?? Colors.ceilDark;

  const handleDelete = () => {
    Alert.alert('Eliminar movimiento', `¿Eliminar "${tx.concept}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.catDot, { backgroundColor: dotColor }]} />
      <View style={styles.txCenter}>
        <Text style={styles.txConcept} numberOfLines={1}>
          {tx.concept}
        </Text>
        <Text style={styles.txMeta}>
          {tx.category?.name}
          {tx.account ? ` · ${tx.account.name}` : ''}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isIncome ? '#22c55e' : Colors.ink }]}>
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount, tx.account?.currency)}
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
}: {
  visible: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const [txType, setTxType] = useState<TransactionType>('egreso');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState('');

  const { data: categories = [] } = useTxCategories('gastos');
  const createTx = useCreateTransaction();

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const handleClose = () => {
    setTxType('egreso');
    setAmount('');
    setConcept('');
    setCategoryId('');
    setAccountId(accounts[0]?.id ?? '');
    onClose();
  };

  const canSubmit =
    amount.trim() !== '' &&
    parseFloat(amount) > 0 &&
    concept.trim() !== '' &&
    !!accountId &&
    !!categoryId;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createTx.mutate(
      {
        type: txType,
        amount: parseFloat(amount),
        concept: concept.trim(),
        accountId,
        categoryId,
        date: new Date().toISOString(),
      },
      {
        onSuccess: handleClose,
        onError: () => Alert.alert('Error', 'No se pudo guardar el movimiento'),
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
            <Text style={styles.modalTitle}>Nuevo movimiento</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, txType === 'egreso' && styles.typeBtnEgreso]}
              onPress={() => setTxType('egreso')}
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
              onPress={() => setTxType('ingreso')}
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
            autoFocus
          />

          <TextInput
            style={styles.conceptInput}
            value={concept}
            onChangeText={setConcept}
            placeholder="Concepto..."
            placeholderTextColor={Colors.muted}
            returnKeyType="done"
          />

          <Text style={styles.pickerLabel}>Cuenta</Text>
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
                {a.color && <View style={[styles.accountDot, { backgroundColor: a.color }]} />}
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

          <Text style={styles.pickerLabel}>Categoría</Text>
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
                {c.icon && <Text style={{ fontSize: 14 }}>{c.icon}</Text>}
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

          <Button
            label="Guardar movimiento"
            onPress={handleSubmit}
            loading={createTx.isPending}
            disabled={!canSubmit}
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Recurring expense components ─────────────────────────────────────────────

function RecurringExpenseRow({
  item,
  onToggle,
  onDelete,
  toggling,
  isLast,
}: {
  item: RecurringExpense;
  onToggle: () => void;
  onDelete: () => void;
  toggling: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.txRow, !isLast && styles.txRowBorder]}>
      <View style={[styles.catDot, { backgroundColor: item.category?.color ?? Colors.muted }]} />
      <View style={styles.txCenter}>
        <Text style={[styles.txConcept, !item.isActive && { color: Colors.muted }]}>
          {item.concept}
        </Text>
        <Text style={styles.txMeta}>
          {item.category?.name ?? ''}
          {item.dueDay ? ` · día ${item.dueDay}` : ''}
          {item.currency !== 'ARS' ? ` · ${item.currency}` : ''}
        </Text>
      </View>
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

function RecurringFormModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [concept, setConcept] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [dueDay, setDueDay] = useState('');
  const [notes, setNotes] = useState('');

  const { data: categories = [] } = useTxCategories('gastos');
  const createRecurring = useCreateRecurringExpense();

  useEffect(() => {
    if (!visible) {
      setConcept('');
      setCategoryId('');
      setCurrency('ARS');
      setDueDay('');
      setNotes('');
    } else if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [visible, categories]);

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
    createRecurring.mutate(dto, {
      onSuccess: onClose,
      onError: () => Alert.alert('Error', 'No se pudo crear el gasto fijo'),
    });
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
            <Text style={styles.modalTitle}>Nuevo gasto fijo</Text>
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
              label="Guardar gasto fijo"
              onPress={handleSubmit}
              loading={createRecurring.isPending}
              disabled={!concept.trim() || !categoryId || createRecurring.isPending}
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
          {item.category?.name}
          {item.recurringExpense?.dueDay ? ` · día ${item.recurringExpense.dueDay}` : ''}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isPaid ? Colors.muted : Colors.ink }]}>
        {formatMoney(item.amount, item.recurringExpense?.currency)}
      </Text>
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
  const payMutation = usePayMonthlyExpense();

  useEffect(() => {
    if (visible && expense) {
      setAmount(String(expense.amount));
    }
    if (visible && accounts.length > 0) {
      setAccountId((prev) => prev || accounts[0].id);
    }
  }, [visible, expense, accounts]);

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const canSubmit = amount.trim() !== '' && parseFloat(amount) > 0 && !!accountId;

  const handlePay = () => {
    if (!expense || !canSubmit) return;
    payMutation.mutate(
      { id: expense.id, dto: { amount: parseFloat(amount), accountId } },
      { onSuccess: handleClose }
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
                {a.color && <View style={[styles.accountDot, { backgroundColor: a.color }]} />}
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

  const { data: categories = [] } = useTxCategories('gastos');
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

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
        { onSuccess: handleClose }
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
        { onSuccess: handleClose }
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
  const [activeTab, setActiveTab] = useState<DineroTab>('movimientos');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
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
  const totalPending = useMemo(
    () => pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
    [pendingExpenses]
  );
  const totalPaid = useMemo(
    () => paidExpenses.reduce((sum, e) => sum + e.amount, 0),
    [paidExpenses]
  );

  const accounts = accountsData?.accounts ?? [];
  const transactions = txData?.transactions ?? [];
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
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
          <Text style={styles.pageTitle}>Dinero</Text>
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
            label="Fijos"
            active={activeTab === 'fijos'}
            badge={recurringList.length || undefined}
            onPress={() => setActiveTab('fijos')}
          />
          <Chip
            label="Mensuales"
            active={activeTab === 'mensuales'}
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
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>CUENTAS</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.screenX }}
                  style={{ marginBottom: Spacing.sm }}
                >
                  <TouchableOpacity
                    style={[
                      styles.accountChip,
                      selectedAccountId === null && styles.accountChipActive,
                    ]}
                    onPress={() => setSelectedAccountId(null)}
                  >
                    <Text
                      style={[
                        styles.accountChipName,
                        { color: selectedAccountId === null ? '#fff' : Colors.ink },
                      ]}
                    >
                      Todas
                    </Text>
                  </TouchableOpacity>
                  {accounts.map((a) => (
                    <AccountChip
                      key={a.id}
                      account={a}
                      active={selectedAccountId === a.id}
                      onPress={() => setSelectedAccountId(selectedAccountId === a.id ? null : a.id)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>MOVIMIENTOS</Text>
              {transactions.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{transactions.length}</Text>
                </View>
              )}
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>GASTOS FIJOS</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={() => setShowRecurringModal(true)} activeOpacity={0.7}>
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
              <Card padding={0} solid>
                {recurringList.map((item, i) => (
                  <RecurringExpenseRow
                    key={item.id}
                    item={item}
                    onToggle={() =>
                      updateRecurring.mutate({ id: item.id, dto: { isActive: !item.isActive } })
                    }
                    onDelete={() => deleteRecurring.mutate(item.id)}
                    toggling={
                      updateRecurring.isPending &&
                      (updateRecurring.variables as any)?.id === item.id
                    }
                    isLast={i === recurringList.length - 1}
                  />
                ))}
              </Card>
            )}
          </>
        ) : activeTab === 'mensuales' ? (
          <>
            {/* PENDIENTES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PENDIENTES</Text>
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
              <Card padding={0} solid>
                {pendingExpenses.map((item, i) => (
                  <MonthlyExpenseRow
                    key={item.id}
                    item={item}
                    onPay={() => {
                      setSelectedExpense(item);
                      setShowPayModal(true);
                    }}
                    onUndo={() => undoPayment.mutate(item.id)}
                    actionPending={undoPayment.isPending && undoPayment.variables === item.id}
                    isLast={i === pendingExpenses.length - 1}
                  />
                ))}
              </Card>
            )}

            {/* PAGADOS */}
            {paidExpenses.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PAGADOS</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{paidExpenses.length}</Text>
                  </View>
                </View>
                <Card padding={0} solid>
                  {paidExpenses.map((item, i) => (
                    <MonthlyExpenseRow
                      key={item.id}
                      item={item}
                      onPay={() => {
                        setSelectedExpense(item);
                        setShowPayModal(true);
                      }}
                      onUndo={() => undoPayment.mutate(item.id)}
                      actionPending={undoPayment.isPending && undoPayment.variables === item.id}
                      isLast={i === paidExpenses.length - 1}
                    />
                  ))}
                </Card>
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
                  <Text style={styles.txAmount}>{formatMoney(totalPending + totalPaid)}</Text>
                </View>
              </Card>
            )}
          </>
        ) : activeTab === 'presupuestos' ? (
          <>
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
              <Text style={styles.sectionTitle}>EN PROGRESO</Text>
              {activeSavings.length > 0 && (
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{activeSavings.length}</Text>
                </View>
              )}
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
                  <Text style={styles.sectionTitle}>COMPLETADAS</Text>
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

      {(activeTab === 'movimientos' || activeTab === 'presupuestos' || activeTab === 'ahorro') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === 'presupuestos') {
              setBudgetEditing(null);
              setShowBudgetModal(true);
            } else if (activeTab === 'ahorro') {
              setSavingsEditing(null);
              setShowSavingsModal(true);
            } else {
              setShowModal(true);
            }
          }}
          activeOpacity={0.85}
        >
          <Plus size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <TransactionFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        accounts={accounts}
      />
      <RecurringFormModal
        visible={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
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

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1,
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

  // Account chips
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSolid,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.account,
  },
  accountChipActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
    ...Shadows.cta,
  },
  accountDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountChipName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  accountChipBal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: 1,
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
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Layout.tabBarHeight + Layout.tabBarOffset,
    width: 52,
    height: 52,
    borderRadius: Radius.fab,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
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

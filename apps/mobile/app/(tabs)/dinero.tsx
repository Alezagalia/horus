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
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Gradients, Shadows, Layout } from '@/tokens';
import { useAccounts, useFinanceStats, accountKeys } from '@/hooks/useAccounts';
import {
  useTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  useTxCategories,
  transactionKeys,
} from '@/hooks/useTransactions';
import type { Transaction, TransactionType } from '@/services/api/transactionApi';
import type { Account } from '@/services/api/accountApi';

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

// ─── screen ───────────────────────────────────────────────────────────────────

export default function DineroScreen() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const accounts = accountsData?.accounts ?? [];
  const transactions = txData?.transactions ?? [];
  const grouped = useMemo(() => groupByDate(transactions), [transactions]);

  const onRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
      queryClient.invalidateQueries({ queryKey: transactionKeys.all }),
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
                style={[styles.accountChip, selectedAccountId === null && styles.accountChipActive]}
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
                    deleting={deleteTransaction.isPending && deleteTransaction.variables === tx.id}
                    isLast={i === group.items.length - 1}
                  />
                ))}
              </Card>
            </View>
          ))
        )}

        <View style={{ height: Layout.tabBarHeight + Layout.tabBarOffset + 16 }} />
      </ScreenContainer>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Plus size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      <TransactionFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        accounts={accounts}
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

  // Empty
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});

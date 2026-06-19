/**
 * PendingExpenses — Gastos pendientes del mes (mobile)
 * Réplica de la card "Gastos Pendientes" del dashboard web: lista los gastos
 * fijos pendientes (máx 5, ordenados por vencimiento), total estimado y pago
 * directo mediante un modal. Paridad con apps/web/src/pages/DashboardPage.tsx.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius } from '@/tokens';
import { usePayMonthlyExpense } from '@/hooks/useMonthlyExpenses';
import type { MonthlyExpense } from '@/services/api/monthlyExpenseApi';
import type { Account } from '@/services/api/accountApi';

interface Props {
  expenses: MonthlyExpense[];
  accounts: Account[];
}

const MAX_ROWS = 5;

function formatMoney(amount: number, currency = 'ARS'): string {
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

interface DueStatus {
  text: string;
  bg: string;
  fg: string;
  urgent: boolean;
}

/** Estado de vencimiento según el día del mes (espejo de la web). */
function getDueStatus(dueDay: number | null | undefined): DueStatus | null {
  if (!dueDay) return null;
  const currentDay = new Date().getDate();
  const daysUntilDue = dueDay - currentDay;

  if (daysUntilDue < 0) {
    return { text: 'Vencido', bg: '#FEE2E2', fg: '#B91C1C', urgent: true };
  }
  if (daysUntilDue === 0) {
    return { text: 'Vence hoy', bg: '#FEF3C7', fg: '#B45309', urgent: true };
  }
  if (daysUntilDue <= 3) {
    return { text: `Vence en ${daysUntilDue}d`, bg: '#FEF3C7', fg: '#B45309', urgent: false };
  }
  return { text: `Día ${dueDay}`, bg: '#F3F4F6', fg: '#6B7280', urgent: false };
}

// ─── Modal de pago ──────────────────────────────────────────────────────────

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

  // Al abrir: preseleccionar la primera cuenta (para traer su saldo) y limpiar el monto.
  useEffect(() => {
    if (visible) {
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
      setAmount('');
    }
  }, [visible, accounts]);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? null;
  const balance = selectedAccount?.balance ?? 0;
  const amountNum = parseFloat(amount);
  const validAmount = amount.trim() !== '' && !Number.isNaN(amountNum) && amountNum > 0;
  const exceedsBalance = selectedAccount != null && validAmount && amountNum > balance;
  const canSubmit = !!selectedAccount && validAmount && !exceedsBalance && !payMutation.isPending;

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  const handlePay = () => {
    if (!expense || !canSubmit) return;
    payMutation.mutate(
      { id: expense.id, dto: { amount: amountNum, accountId } },
      { onSuccess: handleClose }
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

          {expense && <Text style={styles.modalConcept}>{expense.concept}</Text>}

          {/* 1. Cuenta con la que se paga */}
          <Text style={styles.pickerLabel}>CUENTA</Text>
          {accounts.length === 0 ? (
            <Text style={styles.warnText}>No tenés cuentas disponibles para pagar.</Text>
          ) : (
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
                  {!!a.color && <View style={[styles.accountDot, { backgroundColor: a.color }]} />}
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
          )}

          {/* 2. Saldo de la cuenta seleccionada */}
          {selectedAccount && (
            <View style={styles.balanceBox}>
              <Text style={styles.balanceLabel}>Saldo disponible</Text>
              <Text style={styles.balanceValue}>
                {formatMoney(balance, selectedAccount.currency)}
              </Text>
            </View>
          )}

          {/* 3. Monto a pagar */}
          <Text style={styles.pickerLabel}>MONTO</Text>
          <TextInput
            style={[styles.amountInput, exceedsBalance && styles.amountInputError]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={Colors.ceilLight}
            keyboardType="numeric"
          />

          {/* 4. Validación contra el saldo */}
          {exceedsBalance && (
            <Text style={styles.warnText}>El monto supera el saldo disponible.</Text>
          )}

          {/* 5. Confirmar (habilitado sólo si cuenta + monto válido dentro del saldo) */}
          <TouchableOpacity
            style={[styles.confirmBtn, !canSubmit && styles.confirmBtnDisabled]}
            onPress={handlePay}
            disabled={!canSubmit}
          >
            <Text style={styles.confirmBtnText}>
              {payMutation.isPending ? 'Pagando...' : 'Confirmar pago'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Card principal ─────────────────────────────────────────────────────────

export function PendingExpenses({ expenses, accounts }: Props) {
  const [paying, setPaying] = useState<MonthlyExpense | null>(null);

  const pending = useMemo(() => expenses.filter((e) => e.status === 'pendiente'), [expenses]);

  const visible = useMemo(() => {
    const list = [...pending];
    // Sin día de vencimiento primero, luego por día ascendente (más cercano primero).
    list.sort((a, b) => {
      const da = a.recurringExpense?.dueDay;
      const db = b.recurringExpense?.dueDay;
      if (!da && db) return -1;
      if (da && !db) return 1;
      if (da && db) return da - db;
      return 0;
    });
    return list.slice(0, MAX_ROWS);
  }, [pending]);

  const totalPending = useMemo(
    () => pending.reduce((sum, e) => sum + Number(e.previousAmount || 0), 0),
    [pending]
  );

  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Gastos Pendientes</Text>
          <Text style={styles.subtitle}>Gastos fijos del mes</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/dinero')} activeOpacity={0.7}>
          <Text style={styles.link}>Ver todos →</Text>
        </TouchableOpacity>
      </View>

      {pending.length === 0 ? (
        <Card solid>
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>¡Todo pagado!</Text>
            <Text style={styles.emptySub}>No tenés gastos pendientes este mes</Text>
          </View>
        </Card>
      ) : (
        <Card padding={Spacing.md} solid>
          {visible.map((e, i) => {
            const due = getDueStatus(e.recurringExpense?.dueDay);
            return (
              <View key={e.id} style={[styles.row, i < visible.length - 1 && styles.rowDivider]}>
                <Text style={styles.icon}>{e.category?.icon || '📄'}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.concept} numberOfLines={1}>
                    {e.concept}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.amountPrev}>
                      {e.previousAmount
                        ? `~${formatMoney(e.previousAmount, e.recurringExpense?.currency)}`
                        : 'Sin monto previo'}
                    </Text>
                    {due && (
                      <View style={[styles.badge, { backgroundColor: due.bg }]}>
                        <Text style={[styles.badgeText, { color: due.fg }]}>{due.text}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={() => setPaying(e)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.payBtnText}>Pagar</Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total estimado:</Text>
            <Text style={styles.totalValue}>~{formatMoney(totalPending, 'ARS')}</Text>
          </View>
        </Card>
      )}

      <PayExpenseModal
        visible={!!paying}
        expense={paying}
        accounts={accounts}
        onClose={() => setPaying(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  link: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.vivid,
    paddingTop: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  icon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowBody: { flex: 1, minWidth: 0 },
  concept: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  amountPrev: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  badgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  payBtn: {
    backgroundColor: Colors.vivid,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  payBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
  },
  totalValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
  },

  // Empty
  empty: { alignItems: 'center', paddingVertical: Spacing.lg },
  emptyIcon: { fontSize: 30, marginBottom: 6 },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,31,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
  },
  modalConcept: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  amountInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: Colors.ink,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.line,
    marginBottom: Spacing.md,
  },
  amountInputError: {
    borderBottomColor: '#EF4444',
  },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
  },
  balanceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
  },
  warnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#B91C1C',
    marginBottom: Spacing.md,
  },
  pickerLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  pickerScroll: { marginBottom: Spacing.sm },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.bgTop,
  },
  pickerChipActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  accountDot: { width: 8, height: 8, borderRadius: 4 },
  pickerChipLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});

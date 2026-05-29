import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  ChevronLeft,
  CheckSquare,
  Repeat,
  Flame,
  RefreshCw,
  Calendar,
  Users,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, Gradients, Shadows, Typography } from '@/tokens';
import { useLifeDebt, useRecordDecision, useReviewRecurringExpense } from '@/hooks/useLifeDebt';
import type { LifeDebtItem, LifeDebtDecisionKind } from '@horus/shared';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayPlusDays(days: number): string {
  return format(addDays(new Date(), days), 'yyyy-MM-dd');
}

function agingLabel(days: number): string {
  if (days < 7) return `${days}d pendiente`;
  if (days < 30) return `${Math.floor(days / 7)}sem pendiente`;
  if (days < 365) return `${Math.floor(days / 30)}m pendiente`;
  return `${Math.floor(days / 365)}a pendiente`;
}

function itemTypeLabel(type: LifeDebtItem['type']): string {
  if (type === 'task') return 'Tarea';
  if (type === 'habit') return 'Hábito';
  return 'Gasto recurrente';
}

// ─── Item card ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<LifeDebtItem['type'], string> = {
  task: '#F59E0B',
  habit: '#3B82F6',
  recurring_expense: '#10B981',
};

function TypeIcon({ type, size = 16 }: { type: LifeDebtItem['type']; size?: number }) {
  const color = TYPE_COLORS[type];
  if (type === 'task') return <CheckSquare size={size} color={color} strokeWidth={1.5} />;
  if (type === 'habit') return <Flame size={size} color={color} strokeWidth={1.5} />;
  return <Repeat size={size} color={color} strokeWidth={1.5} />;
}

function DebtItemCard({
  item,
  onDecide,
  onReview,
  isReviewing,
}: {
  item: LifeDebtItem;
  onDecide: (item: LifeDebtItem) => void;
  onReview: (item: LifeDebtItem) => void;
  isReviewing: boolean;
}) {
  const isExpense = item.type === 'recurring_expense';
  const color = TYPE_COLORS[item.type];

  return (
    <Card solid style={styles.itemCard}>
      <View style={styles.itemTop}>
        <View style={[styles.typeTag, { backgroundColor: `${color}18` }]}>
          <TypeIcon type={item.type} size={12} />
          <Text style={[styles.typeTagLabel, { color }]}>{itemTypeLabel(item.type)}</Text>
        </View>
        <View style={[styles.agingBadge, item.agingDays > 30 && styles.agingBadgeOld]}>
          <Text style={[styles.agingText, item.agingDays > 30 && styles.agingTextOld]}>
            {agingLabel(item.agingDays)}
          </Text>
        </View>
      </View>

      <Text style={styles.itemTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.itemReason} numberOfLines={2}>
        {item.reason}
      </Text>

      {/* Metadata */}
      <View style={styles.metaRow}>
        {item.metadata.rescheduleCount != null && item.metadata.rescheduleCount > 0 && (
          <Text style={styles.metaChip}>↻ {item.metadata.rescheduleCount}× reprogramado</Text>
        )}
        {item.metadata.daysSinceLastCompletion != null && (
          <Text style={styles.metaChip}>
            {item.metadata.daysSinceLastCompletion}d sin completar
          </Text>
        )}
        {item.metadata.streakBeforeBreak != null && item.metadata.streakBeforeBreak > 0 && (
          <Text style={styles.metaChip}>Racha previa: {item.metadata.streakBeforeBreak}d</Text>
        )}
        {item.metadata.daysSinceLastReview != null && (
          <Text style={styles.metaChip}>{item.metadata.daysSinceLastReview}d sin revisar</Text>
        )}
      </View>

      {isExpense ? (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={() => onReview(item)}
          disabled={isReviewing}
          activeOpacity={0.8}
        >
          {isReviewing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <RefreshCw size={14} color="#fff" strokeWidth={2} />
              <Text style={styles.reviewBtnLabel}>Marcar revisado</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.decideBtn}
          onPress={() => onDecide(item)}
          activeOpacity={0.8}
        >
          <AlertTriangle size={14} color={Colors.vivid} strokeWidth={2} />
          <Text style={styles.decideBtnLabel}>Decidir ahora</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

// ─── Decision Modal ────────────────────────────────────────────────────────────

type DecisionStep = 'choose' | 'commit' | 'delete-confirm';

function DecisionModal({
  item,
  index,
  total,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  item: LifeDebtItem;
  index: number;
  total: number;
  onSubmit: (input: {
    decision: LifeDebtDecisionKind;
    commitDate?: string;
    reason?: string;
  }) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const [step, setStep] = useState<DecisionStep>('choose');
  const [commitDate, setCommitDate] = useState(todayPlusDays(7));
  const [reason, setReason] = useState('');

  useEffect(() => {
    setStep('choose');
    setCommitDate(todayPlusDays(7));
    setReason('');
  }, [item.id]);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={dmStyles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={dmStyles.sheet}>
          {/* Header gradient */}
          <LinearGradient
            colors={['#F43F5E', '#F97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dmStyles.header}
          >
            <View style={dmStyles.headerTop}>
              <Text style={dmStyles.counter}>
                Deuda {index + 1} de {total}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
            </View>
            <Text style={dmStyles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={dmStyles.itemReason} numberOfLines={2}>
              {item.reason}
            </Text>
          </LinearGradient>

          <View style={dmStyles.body}>
            {step === 'choose' && (
              <>
                <Text style={dmStyles.prompt}>¿Qué querés hacer? Sin zona gris.</Text>
                <TouchableOpacity
                  style={dmStyles.option}
                  onPress={() => setStep('commit')}
                  activeOpacity={0.75}
                >
                  <View style={[dmStyles.optionIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Calendar size={20} color="#6366F1" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={dmStyles.optionTitle}>Comprometer una fecha</Text>
                    <Text style={dmStyles.optionSub}>Vas a hacerlo. Definí cuándo.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={dmStyles.option}
                  onPress={() => onSubmit({ decision: 'delegate', reason: reason || undefined })}
                  disabled={isSubmitting}
                  activeOpacity={0.75}
                >
                  <View style={[dmStyles.optionIcon, { backgroundColor: '#FFFBEB' }]}>
                    <Users size={20} color="#F59E0B" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={dmStyles.optionTitle}>Delegar</Text>
                    <Text style={dmStyles.optionSub}>No es tu responsabilidad directa.</Text>
                  </View>
                  {isSubmitting && <ActivityIndicator size="small" color={Colors.muted} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={dmStyles.option}
                  onPress={() => setStep('delete-confirm')}
                  activeOpacity={0.75}
                >
                  <View style={[dmStyles.optionIcon, { backgroundColor: '#FEF2F2' }]}>
                    <Trash2 size={20} color="#EF4444" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={dmStyles.optionTitle}>Eliminar</Text>
                    <Text style={dmStyles.optionSub}>Ya no querés hacerlo. Soltalo.</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {step === 'commit' && (
              <>
                <Text style={dmStyles.prompt}>Comprometete con una fecha concreta.</Text>
                <Text style={dmStyles.fieldLabel}>Nueva fecha (YYYY-MM-DD)</Text>
                <TextInput
                  style={dmStyles.input}
                  value={commitDate}
                  onChangeText={setCommitDate}
                  placeholder="ej: 2026-06-15"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                />
                <Text style={dmStyles.fieldLabel}>Nota (opcional)</Text>
                <TextInput
                  style={[dmStyles.input, dmStyles.inputMulti]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="¿Por qué ahora sí?"
                  placeholderTextColor={Colors.muted}
                  multiline
                  numberOfLines={2}
                />
                <View style={dmStyles.btnRow}>
                  <TouchableOpacity
                    style={dmStyles.backBtn}
                    onPress={() => setStep('choose')}
                    disabled={isSubmitting}
                  >
                    <Text style={dmStyles.backBtnLabel}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      dmStyles.confirmBtn,
                      (!commitDate || isSubmitting) && dmStyles.btnDisabled,
                    ]}
                    onPress={() =>
                      onSubmit({ decision: 'commit', commitDate, reason: reason || undefined })
                    }
                    disabled={!commitDate || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={dmStyles.confirmBtnLabel}>Comprometer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === 'delete-confirm' && (
              <>
                <Text style={dmStyles.prompt}>
                  Vas a archivar "{item.title}". No podrás recuperarlo desde acá.
                </Text>
                <Text style={dmStyles.fieldLabel}>Nota (opcional)</Text>
                <TextInput
                  style={[dmStyles.input, dmStyles.inputMulti]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="¿Por qué soltarlo ahora?"
                  placeholderTextColor={Colors.muted}
                  multiline
                  numberOfLines={2}
                />
                <View style={dmStyles.btnRow}>
                  <TouchableOpacity
                    style={dmStyles.backBtn}
                    onPress={() => setStep('choose')}
                    disabled={isSubmitting}
                  >
                    <Text style={dmStyles.backBtnLabel}>Atrás</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dmStyles.deleteBtn, isSubmitting && dmStyles.btnDisabled]}
                    onPress={() => onSubmit({ decision: 'delete', reason: reason || undefined })}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={dmStyles.confirmBtnLabel}>Eliminar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DeudaDeVidaScreen() {
  const { data, isLoading, refetch } = useLifeDebt();
  const recordDecision = useRecordDecision();
  const reviewExpense = useReviewRecurringExpense();

  const [activeItem, setActiveItem] = useState<LifeDebtItem | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const decidableItems = data?.items.filter((i) => i.type !== 'recurring_expense') ?? [];

  const handleDecide = useCallback(
    (item: LifeDebtItem) => {
      const idx = decidableItems.findIndex((i) => i.id === item.id);
      setActiveIndex(idx >= 0 ? idx : 0);
      setActiveItem(item);
    },
    [decidableItems]
  );

  const handleSubmit = useCallback(
    (input: { decision: LifeDebtDecisionKind; commitDate?: string; reason?: string }) => {
      if (!activeItem) return;
      recordDecision.mutate(
        {
          itemType: activeItem.type,
          itemId: activeItem.id,
          decision: input.decision,
          commitDate: input.commitDate,
          reason: input.reason,
        },
        {
          onSuccess: () => {
            const nextIdx = activeIndex + 1;
            if (nextIdx >= decidableItems.length) {
              setActiveItem(null);
            } else {
              setActiveIndex(nextIdx);
              setActiveItem(decidableItems[nextIdx]);
            }
          },
        }
      );
    },
    [activeItem, activeIndex, decidableItems, recordDecision]
  );

  const handleReview = useCallback(
    (item: LifeDebtItem) => {
      reviewExpense.mutate(item.id);
    },
    [reviewExpense]
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.nudge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Deuda de Vida</Text>
          <Text style={styles.headerSub}>Items que necesitan una decisión clara</Text>
        </View>
        {data && data.totals.all > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{data.totals.all}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginTop: 48 }} />
        ) : !data || data.items.length === 0 ? (
          /* Empty state */
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌿</Text>
            <Text style={styles.emptyTitle}>Sin deuda pendiente</Text>
            <Text style={styles.emptySub}>Volvé pronto. Lo importante es no acumular.</Text>
          </View>
        ) : (
          <>
            {/* Summary row */}
            <View style={styles.summaryRow}>
              <SummaryCard label="Tareas" count={data.totals.tasks} color="#F59E0B" />
              <SummaryCard label="Hábitos" count={data.totals.habits} color="#3B82F6" />
              <SummaryCard label="Gastos" count={data.totals.recurringExpenses} color="#10B981" />
            </View>

            {/* Item list */}
            {data.items.map((item) => (
              <DebtItemCard
                key={`${item.type}:${item.id}`}
                item={item}
                onDecide={handleDecide}
                onReview={handleReview}
                isReviewing={reviewExpense.isPending && reviewExpense.variables === item.id}
              />
            ))}
          </>
        )}

        {/* Refresh */}
        {!isLoading && (
          <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
            <RefreshCw size={14} color={Colors.muted} strokeWidth={1.5} />
            <Text style={styles.refreshLabel}>Actualizar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {activeItem && (
        <DecisionModal
          item={activeItem}
          index={activeIndex}
          total={decidableItems.length}
          onSubmit={handleSubmit}
          onClose={() => setActiveItem(null)}
          isSubmitting={recordDecision.isPending}
        />
      )}
    </View>
  );
}

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[styles.summaryCard, { borderColor: `${color}40` }]}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.screenX,
    ...Shadows.nav,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  headerBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  content: {
    padding: Spacing.screenX,
    paddingBottom: 40,
  },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.md,
    alignItems: 'center',
  },
  summaryCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  // Item card
  itemCard: {
    marginBottom: Spacing.md,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  typeTagLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  agingBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  agingBadgeOld: {
    backgroundColor: '#FEF3C7',
  },
  agingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
  },
  agingTextOld: {
    color: '#92400E',
  },
  itemTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 4,
  },
  itemReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  metaChip: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.muted,
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  decideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.vivid,
    alignSelf: 'flex-start',
  },
  decideBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: '#10B981',
    alignSelf: 'flex-start',
  },
  reviewBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#fff',
  },
  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: Spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  // Refresh
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  refreshLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.muted,
  },
});

// ─── Decision Modal styles ─────────────────────────────────────────────────────

const dmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,14,31,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: 4,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  counter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.3,
  },
  itemReason: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  body: {
    padding: Spacing.lg,
  },
  prompt: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  optionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 1,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgTop,
  },
  inputMulti: {
    minHeight: 64,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.ice,
    alignItems: 'center',
  },
  backBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
  },
  deleteBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmBtnLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});

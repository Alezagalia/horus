import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Target,
  CheckCircle2,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import {
  useGoal,
  useUpdateGoal,
  useCreateKeyResult,
  useUpdateKeyResult,
  useDeleteKeyResult,
} from '@/hooks/useGoals';
import type { KeyResult, GoalStatus, UpdateGoalDTO, CreateKeyResultDTO } from '@horus/shared';

// ─── constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  en_progreso: { label: 'En progreso', color: Colors.vivid },
  completada: { label: 'Completada', color: '#22c55e' },
  cancelada: { label: 'Cancelada', color: '#ef4444' },
};

const PRIORITY_COLORS = { alta: '#ef4444', media: '#f97316', baja: Colors.muted };

// ─── key result row ───────────────────────────────────────────────────────────

function KrRow({
  kr,
  goalId,
  onEdit,
}: {
  kr: KeyResult;
  goalId: string;
  onEdit: (kr: KeyResult) => void;
}) {
  const deleteKr = useDeleteKeyResult();
  const pct = kr.targetValue > 0 ? Math.min(100, (kr.currentValue / kr.targetValue) * 100) : 0;

  const handleDelete = () =>
    Alert.alert('Eliminar sub-meta', `¿Eliminar "${kr.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteKr.mutate({ goalId, krId: kr.id }),
      },
    ]);

  return (
    <View style={styles.krRow}>
      <View style={styles.krTop}>
        <Text style={styles.krTitle} numberOfLines={2}>
          {kr.title}
        </Text>
        <TouchableOpacity onPress={() => onEdit(kr)} hitSlop={8} style={styles.krAction}>
          <Pencil size={13} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.krAction}>
          <Trash2 size={13} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
      <View style={styles.krProgress}>
        <View style={styles.krBar}>
          <View style={[styles.krFill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.krValues}>
          {kr.currentValue}/{kr.targetValue}
          {kr.unit ? ` ${kr.unit}` : ''}
        </Text>
      </View>
    </View>
  );
}

// ─── kr form modal ────────────────────────────────────────────────────────────

function KrFormModal({
  visible,
  goalId,
  kr,
  onClose,
}: {
  visible: boolean;
  goalId: string;
  kr?: KeyResult;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [unit, setUnit] = useState('');

  const createKr = useCreateKeyResult();
  const updateKr = useUpdateKeyResult();
  const isBusy = createKr.isPending || updateKr.isPending;

  useEffect(() => {
    if (visible) {
      setTitle(kr?.title ?? '');
      setTarget(String(kr?.targetValue ?? ''));
      setCurrent(String(kr?.currentValue ?? '0'));
      setUnit(kr?.unit ?? '');
    }
  }, [visible, kr]);

  const handleSave = async () => {
    if (!title.trim() || !target)
      return Alert.alert('Error', 'Título y valor objetivo son requeridos.');
    const dto: CreateKeyResultDTO = {
      title: title.trim(),
      targetValue: parseFloat(target),
      currentValue: parseFloat(current) || 0,
      unit: unit.trim() || undefined,
    };
    try {
      if (kr) {
        await updateKr.mutateAsync({ goalId, krId: kr.id, dto });
      } else {
        await createKr.mutateAsync({ goalId, dto });
      }
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la sub-meta.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{kr ? 'Editar sub-meta' : 'Nueva sub-meta'}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <X size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            {[
              { label: 'Título *', val: title, set: setTitle, kb: 'default' },
              { label: 'Valor objetivo *', val: target, set: setTarget, kb: 'numeric' },
              { label: 'Valor actual', val: current, set: setCurrent, kb: 'numeric' },
              { label: 'Unidad (ej: km, libros)', val: unit, set: setUnit, kb: 'default' },
            ].map(({ label, val, set, kb }) => (
              <View key={label} style={{ marginBottom: Spacing.sm }}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput
                  value={val}
                  onChangeText={set as (v: string) => void}
                  keyboardType={kb as any}
                  style={styles.formInput}
                  placeholderTextColor={Colors.muted}
                />
              </View>
            ))}

            <Button
              label={kr ? 'Guardar' : 'Crear'}
              onPress={handleSave}
              loading={isBusy}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── edit goal modal ──────────────────────────────────────────────────────────

function EditGoalModal({
  visible,
  goalId,
  initialStatus,
  onClose,
}: {
  visible: boolean;
  goalId: string;
  initialStatus: GoalStatus;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<GoalStatus>(initialStatus);
  const updateGoal = useUpdateGoal();

  useEffect(() => {
    if (visible) setStatus(initialStatus);
  }, [visible, initialStatus]);

  const handleSave = async () => {
    try {
      await updateGoal.mutateAsync({ id: goalId, dto: { status } as UpdateGoalDTO });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar la meta.');
    }
  };

  const statuses: GoalStatus[] = ['en_progreso', 'completada', 'cancelada'];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Cambiar estado</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          {statuses.map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  styles.statusOption,
                  status === s && { borderColor: cfg.color, backgroundColor: cfg.color + '12' },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                <Text style={[styles.statusLabel, status === s && { color: cfg.color }]}>
                  {cfg.label}
                </Text>
                {status === s && <CheckCircle2 size={16} color={cfg.color} />}
              </TouchableOpacity>
            );
          })}

          <Button
            label="Guardar"
            onPress={handleSave}
            loading={updateGoal.isPending}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export default function MetaDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: goal, isLoading } = useGoal(id);
  const [showEdit, setShowEdit] = useState(false);
  const [showKrForm, setShowKrForm] = useState(false);
  const [editingKr, setEditingKr] = useState<KeyResult | undefined>();

  if (isLoading || !goal) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.vivid} size="large" />
      </View>
    );
  }

  // progress ya viene en escala 0–100 desde el backend (no multiplicar por 100).
  const pct = Math.round(goal.progress ?? 0);
  const statusCfg = STATUS_CONFIG[goal.status];
  const priorityColor = PRIORITY_COLORS[goal.priority] ?? Colors.muted;
  const krs = goal.keyResults ?? [];
  const habits = goal.goalHabits ?? [];
  const tasks = goal.goalTasks ?? [];

  const daysLeft = goal.targetDate
    ? Math.max(0, differenceInDays(parseISO(goal.targetDate), new Date()))
    : null;

  const openKrEdit = (kr: KeyResult) => {
    setEditingKr(kr);
    setShowKrForm(true);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={Gradients.hero} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <X size={22} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {goal.title}
          </Text>
          <TouchableOpacity onPress={() => setShowEdit(true)} hitSlop={8}>
            <Pencil size={18} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <ProgressRing size={80} progress={pct} label={`${pct}%`} sublabel="progreso" />
          <View style={styles.heroMeta}>
            <View style={[styles.statusBadge, { backgroundColor: statusCfg.color + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                {statusCfg.label}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '22' }]}>
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                Prioridad {goal.priority}
              </Text>
            </View>
            {daysLeft !== null && (
              <View style={styles.dateBadge}>
                <Calendar size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.dateBadgeText}>{daysLeft} días restantes</Text>
              </View>
            )}
          </View>
        </View>

        {goal.description ? <Text style={styles.description}>{goal.description}</Text> : null}
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Results */}
        <View style={styles.sectionHeader}>
          <Target size={16} color={Colors.vivid} />
          <Text style={styles.sectionTitle}>Sub-metas ({krs.length})</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingKr(undefined);
              setShowKrForm(true);
            }}
            style={styles.addBtn}
            hitSlop={8}
          >
            <Plus size={16} color={Colors.vivid} strokeWidth={2} />
            <Text style={styles.addBtnLabel}>Agregar</Text>
          </TouchableOpacity>
        </View>

        {krs.length === 0 ? (
          <Text style={styles.emptyText}>Sin sub-metas. Agrega indicadores medibles.</Text>
        ) : (
          krs.map((kr) => <KrRow key={kr.id} kr={kr} goalId={goal.id} onEdit={openKrEdit} />)
        )}

        {/* Linked habits */}
        {habits.length > 0 && (
          <>
            <Text style={styles.sectionTitle2}>Hábitos vinculados</Text>
            {habits.map(({ habit }) => (
              <View key={habit.id} style={styles.linkedRow}>
                <Text style={styles.linkedIcon}>🎯</Text>
                <Text style={styles.linkedName}>{habit.name}</Text>
              </View>
            ))}
          </>
        )}

        {/* Linked tasks */}
        {tasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle2}>Tareas vinculadas</Text>
            {tasks.map(({ task }) => (
              <View key={task.id} style={styles.linkedRow}>
                <View
                  style={[
                    styles.taskStatus,
                    task.status === 'completada' && { backgroundColor: '#22c55e' },
                  ]}
                />
                <Text style={styles.linkedName} numberOfLines={1}>
                  {task.title}
                </Text>
                {task.dueDate && (
                  <Text style={styles.taskDue}>
                    {format(parseISO(task.dueDate), 'd MMM', { locale: es })}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      <KrFormModal
        visible={showKrForm}
        goalId={goal.id}
        kr={editingKr}
        onClose={() => {
          setShowKrForm(false);
          setEditingKr(undefined);
        }}
      />

      <EditGoalModal
        visible={showEdit}
        goalId={goal.id}
        initialStatus={goal.status}
        onClose={() => setShowEdit(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgTop },

  // header
  header: { paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#fff',
    marginHorizontal: Spacing.sm,
    textAlign: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  heroMeta: { flex: 1, gap: Spacing.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  priorityText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateBadgeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginTop: Spacing.sm,
  },

  // scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  // section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.ink },
  sectionTitle2: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.vivid + '12',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  addBtnLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.vivid },

  // key result rows
  krRow: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  krTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  krTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: Colors.ink,
    lineHeight: 20,
  },
  krAction: { padding: 3 },
  krProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  krBar: { flex: 1, height: 6, backgroundColor: Colors.line, borderRadius: 3, overflow: 'hidden' },
  krFill: { height: 6, backgroundColor: Colors.vivid, borderRadius: 3 },
  krValues: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.vivid, minWidth: 60 },

  // linked
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  linkedIcon: { fontSize: 16 },
  linkedName: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.ink },
  taskStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.line,
    borderWidth: 1.5,
    borderColor: Colors.muted,
  },
  taskDue: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted },

  // empty
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },
  formLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  formInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  statusLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.ink },
});

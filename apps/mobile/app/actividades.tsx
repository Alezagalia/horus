import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { format, addDays, subDays, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  Plus,
  X,
  Clock,
  Check,
  Edit2,
  Trash2,
  Zap,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Shadows } from '@/tokens';
import {
  useActivities,
  useAllActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useToggleActivityRecord,
  activityKeys,
} from '@/hooks/useActivities';
import type { Activity, CreateActivityDTO } from '@horus/shared';
import { ActivityPeriodicity, ActivityTimeMode } from '@horus/shared';

// ─── constants ────────────────────────────────────────────────────────────────

const PERIODICITY_LABEL: Record<ActivityPeriodicity, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
};

const PERIODICITY_COLOR: Record<ActivityPeriodicity, string> = {
  DAILY: '#10b981',
  WEEKLY: Colors.vivid,
  MONTHLY: '#f59e0b',
};

const PERIODICITY_BG: Record<ActivityPeriodicity, string> = {
  DAILY: '#d1fae5',
  WEEKLY: Colors.ice,
  MONTHLY: '#fef3c7',
};

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

const COLOR_OPTIONS = [
  '#1E6BFF',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#0ea5e9',
  '#6b7280',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatFixedTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Hoy';
  if (isYesterday(date)) return 'Ayer';
  return format(date, 'd MMM', { locale: es });
}

function sortActivitiesForDate(activities: Activity[]): Activity[] {
  const fixed = activities.filter(
    (a) => a.timeMode === ActivityTimeMode.FIXED && a.fixedHour != null
  );
  const after = activities.filter((a) => a.timeMode === ActivityTimeMode.AFTER_ACTIVITY);
  const unscheduled = activities.filter(
    (a) => a.timeMode === ActivityTimeMode.FIXED && a.fixedHour == null
  );
  fixed.sort((a, b) => {
    const ta = (a.fixedHour ?? 0) * 60 + (a.fixedMinute ?? 0);
    const tb = (b.fixedHour ?? 0) * 60 + (b.fixedMinute ?? 0);
    return ta - tb;
  });
  unscheduled.sort((a, b) => a.order - b.order);
  return [...fixed, ...after, ...unscheduled];
}

// ─── Activity Form Modal ───────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  emoji: string;
  color: string;
  periodicity: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  weekDays: number[];
  timesPerMonth: string;
  timeMode: 'FIXED' | 'AFTER_ACTIVITY';
  fixedHour: string;
  fixedMinute: string;
  afterActivityId: string;
  durationMinutes: string;
}

const defaultForm = (): FormState => ({
  name: '',
  description: '',
  emoji: '',
  color: Colors.vivid,
  periodicity: 'DAILY',
  weekDays: [],
  timesPerMonth: '1',
  timeMode: 'FIXED',
  fixedHour: '',
  fixedMinute: '',
  afterActivityId: '',
  durationMinutes: '',
});

function fromActivity(a: Activity): FormState {
  return {
    name: a.name,
    description: a.description ?? '',
    emoji: a.emoji ?? '',
    color: a.color ?? Colors.vivid,
    periodicity: a.periodicity as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    weekDays: [...a.weekDays],
    timesPerMonth: String(a.timesPerMonth ?? 1),
    timeMode: a.timeMode as 'FIXED' | 'AFTER_ACTIVITY',
    fixedHour: a.fixedHour != null ? String(a.fixedHour) : '',
    fixedMinute: a.fixedMinute != null ? String(a.fixedMinute) : '',
    afterActivityId: a.afterActivityId ?? '',
    durationMinutes: a.durationMinutes != null ? String(a.durationMinutes) : '',
  };
}

function ActivityFormModal({
  visible,
  onClose,
  editing,
  allActivities,
}: {
  visible: boolean;
  onClose: () => void;
  editing?: Activity;
  allActivities: Activity[];
}) {
  const [form, setForm] = useState<FormState>(() =>
    editing ? fromActivity(editing) : defaultForm()
  );

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();

  const reset = () => setForm(editing ? fromActivity(editing) : defaultForm());

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleWeekDay = (day: number) => {
    set(
      'weekDays',
      form.weekDays.includes(day) ? form.weekDays.filter((d) => d !== day) : [...form.weekDays, day]
    );
  };

  const canSubmit = form.name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const dto: CreateActivityDTO = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      emoji: form.emoji.trim() || undefined,
      color: form.color || undefined,
      periodicity: form.periodicity,
      weekDays: form.periodicity === 'WEEKLY' ? form.weekDays : [],
      timesPerMonth: form.periodicity === 'MONTHLY' ? parseInt(form.timesPerMonth) || 1 : undefined,
      timeMode: form.timeMode,
      fixedHour:
        form.timeMode === 'FIXED' && form.fixedHour !== '' ? parseInt(form.fixedHour) : null,
      fixedMinute:
        form.timeMode === 'FIXED' && form.fixedHour !== '' ? parseInt(form.fixedMinute) || 0 : null,
      afterActivityId:
        form.timeMode === 'AFTER_ACTIVITY' && form.afterActivityId ? form.afterActivityId : null,
      durationMinutes: form.durationMinutes !== '' ? parseInt(form.durationMinutes) : null,
    };

    if (editing) {
      updateActivity.mutate(
        { id: editing.id, dto },
        { onSuccess: handleClose, onError: () => Alert.alert('Error', 'No se pudo actualizar') }
      );
    } else {
      createActivity.mutate(dto, {
        onSuccess: handleClose,
        onError: () => Alert.alert('Error', 'No se pudo crear la actividad'),
      });
    }
  };

  const isPending = createActivity.isPending || updateActivity.isPending;

  const candidatesForAfter = allActivities.filter((a) => !editing || a.id !== editing.id);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <ScrollView
          style={s.modalSheet}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Editar actividad' : 'Nueva actividad'}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* Emoji + Name row */}
          <View style={s.row}>
            <TextInput
              style={s.emojiInput}
              value={form.emoji}
              onChangeText={(v) => set('emoji', v)}
              placeholder="🎯"
              placeholderTextColor={Colors.muted}
              maxLength={2}
            />
            <TextInput
              style={[s.input, { flex: 1 }]}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="Nombre de la actividad"
              placeholderTextColor={Colors.muted}
              autoFocus={!editing}
            />
          </View>

          {/* Description */}
          <TextInput
            style={[s.input, s.multilineInput]}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="Descripción (opcional)"
            placeholderTextColor={Colors.muted}
            multiline
            textAlignVertical="top"
          />

          {/* Color */}
          <Text style={s.label}>Color</Text>
          <View style={s.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.colorDot, { backgroundColor: c }, form.color === c && s.colorDotSelected]}
                onPress={() => set('color', c)}
                activeOpacity={0.8}
              />
            ))}
          </View>

          {/* Periodicity */}
          <Text style={s.label}>Periodicidad</Text>
          <View style={s.segmentRow}>
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.segment, form.periodicity === p && s.segmentActive]}
                onPress={() => set('periodicity', p)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.segmentLabel,
                    { color: form.periodicity === p ? '#fff' : Colors.muted },
                  ]}
                >
                  {PERIODICITY_LABEL[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Weekly: day selector */}
          {form.periodicity === 'WEEKLY' && (
            <>
              <Text style={s.label}>Días de la semana</Text>
              <View style={s.dayRow}>
                {DAY_NAMES.map((name, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[s.dayChip, form.weekDays.includes(idx) && s.dayChipActive]}
                    onPress={() => toggleWeekDay(idx)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.dayChipLabel,
                        { color: form.weekDays.includes(idx) ? '#fff' : Colors.muted },
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Monthly: timesPerMonth */}
          {form.periodicity === 'MONTHLY' && (
            <>
              <Text style={s.label}>Veces por mes</Text>
              <TextInput
                style={s.input}
                value={form.timesPerMonth}
                onChangeText={(v) => set('timesPerMonth', v.replace(/[^0-9]/g, ''))}
                placeholder="1"
                placeholderTextColor={Colors.muted}
                keyboardType="number-pad"
              />
            </>
          )}

          {/* Time mode */}
          <Text style={s.label}>Programación</Text>
          <View style={s.segmentRow}>
            <TouchableOpacity
              style={[s.segment, form.timeMode === 'FIXED' && s.segmentActive]}
              onPress={() => set('timeMode', 'FIXED')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.segmentLabel,
                  { color: form.timeMode === 'FIXED' ? '#fff' : Colors.muted },
                ]}
              >
                Hora fija
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.segment, form.timeMode === 'AFTER_ACTIVITY' && s.segmentActive]}
              onPress={() => set('timeMode', 'AFTER_ACTIVITY')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  s.segmentLabel,
                  { color: form.timeMode === 'AFTER_ACTIVITY' ? '#fff' : Colors.muted },
                ]}
              >
                Después de
              </Text>
            </TouchableOpacity>
          </View>

          {form.timeMode === 'FIXED' && (
            <>
              <Text style={s.label}>Hora (opcional)</Text>
              <View style={s.row}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={form.fixedHour}
                  onChangeText={(v) => set('fixedHour', v.replace(/[^0-9]/g, ''))}
                  placeholder="HH"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={s.timeSep}>:</Text>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  value={form.fixedMinute}
                  onChangeText={(v) => set('fixedMinute', v.replace(/[^0-9]/g, ''))}
                  placeholder="MM"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </>
          )}

          {form.timeMode === 'AFTER_ACTIVITY' && candidatesForAfter.length > 0 && (
            <>
              <Text style={s.label}>Después de</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: Spacing.sm }}
              >
                {candidatesForAfter.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[s.afterChip, form.afterActivityId === a.id && s.afterChipActive]}
                    onPress={() =>
                      set('afterActivityId', form.afterActivityId === a.id ? '' : a.id)
                    }
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        s.afterChipLabel,
                        { color: form.afterActivityId === a.id ? '#fff' : Colors.ink },
                      ]}
                    >
                      {a.emoji ? `${a.emoji} ` : ''}
                      {a.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* Duration */}
          <Text style={s.label}>Duración en minutos (opcional)</Text>
          <TextInput
            style={s.input}
            value={form.durationMinutes}
            onChangeText={(v) => set('durationMinutes', v.replace(/[^0-9]/g, ''))}
            placeholder="ej. 30"
            placeholderTextColor={Colors.muted}
            keyboardType="number-pad"
          />

          <Button
            label={editing ? 'Guardar cambios' : 'Crear actividad'}
            onPress={handleSubmit}
            loading={isPending}
            disabled={!canSubmit}
            style={{ marginTop: Spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Activity Item (Hoy tab) ───────────────────────────────────────────────────

function ActivityItem({ activity, dateStr }: { activity: Activity; dateStr: string }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(activity.record?.notes ?? '');
  const toggleRecord = useToggleActivityRecord();
  const isCompleted = activity.record?.completed ?? false;
  const isMonthlyFull =
    activity.periodicity === ActivityPeriodicity.MONTHLY &&
    activity.timesPerMonth != null &&
    (activity.monthlyCompletions ?? 0) >= activity.timesPerMonth &&
    !isCompleted;

  const handleToggle = () => {
    toggleRecord.mutate({
      id: activity.id,
      dto: { date: dateStr, completed: !isCompleted },
    });
  };

  const handleSaveNotes = () => {
    toggleRecord.mutate({
      id: activity.id,
      dto: { date: dateStr, completed: isCompleted, notes: notes.trim() || null },
    });
  };

  const timeLabel =
    activity.timeMode === ActivityTimeMode.FIXED && activity.fixedHour != null
      ? formatFixedTime(activity.fixedHour, activity.fixedMinute ?? 0)
      : activity.timeMode === ActivityTimeMode.AFTER_ACTIVITY && activity.afterActivity
        ? `↳ ${activity.afterActivity.name}`
        : null;

  return (
    <Card solid style={[s.activityItem, isMonthlyFull && s.activityItemDim]}>
      <View style={s.activityRow}>
        {/* Toggle */}
        <TouchableOpacity
          style={[s.checkCircle, isCompleted && s.checkCircleActive]}
          onPress={handleToggle}
          disabled={toggleRecord.isPending || isMonthlyFull}
          activeOpacity={0.75}
        >
          {toggleRecord.isPending ? (
            <ActivityIndicator size="small" color={isCompleted ? '#fff' : Colors.muted} />
          ) : isCompleted ? (
            <Check size={14} color="#fff" strokeWidth={2.5} />
          ) : null}
        </TouchableOpacity>

        {/* Info */}
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => setExpanded((e) => !e)}
          activeOpacity={0.7}
        >
          <View style={s.activityMeta}>
            {activity.emoji ? <Text style={s.activityEmoji}>{activity.emoji}</Text> : null}
            <Text style={[s.activityName, isCompleted && s.activityNameDone]} numberOfLines={1}>
              {activity.name}
            </Text>
          </View>
          <View style={s.activityBadges}>
            {timeLabel && (
              <View style={s.badge}>
                <Clock size={10} color={Colors.muted} strokeWidth={1.5} />
                <Text style={s.badgeText}>{timeLabel}</Text>
              </View>
            )}
            {activity.durationMinutes != null && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{activity.durationMinutes} min</Text>
              </View>
            )}
            {activity.periodicity === ActivityPeriodicity.MONTHLY &&
              activity.timesPerMonth != null && (
                <View style={[s.badge, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[s.badgeText, { color: '#d97706' }]}>
                    {activity.monthlyCompletions ?? 0}/{activity.timesPerMonth}
                  </Text>
                </View>
              )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Expandible */}
      {expanded && (
        <View style={s.expandedSection}>
          {activity.description ? <Text style={s.expandedDesc}>{activity.description}</Text> : null}
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agregar notas..."
            placeholderTextColor={Colors.muted}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity style={s.saveNotesBtn} onPress={handleSaveNotes}>
            <Text style={s.saveNotesBtnLabel}>Guardar notas</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

// ─── Manage Item ──────────────────────────────────────────────────────────────

function ManageItem({
  activity,
  onEdit,
  onDelete,
  deleting,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const handleDelete = () => {
    Alert.alert('Eliminar actividad', `¿Eliminar "${activity.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onDelete },
    ]);
  };

  const periodColor = PERIODICITY_COLOR[activity.periodicity];
  const periodBg = PERIODICITY_BG[activity.periodicity];

  return (
    <Card solid style={s.manageItem}>
      <View style={s.manageRow}>
        {activity.emoji ? (
          <Text style={s.manageEmoji}>{activity.emoji}</Text>
        ) : (
          <View style={[s.emojiPlaceholder, { backgroundColor: activity.color ?? Colors.ice }]}>
            <Zap size={14} color="#fff" strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.manageName} numberOfLines={1}>
            {activity.name}
          </Text>
          <View style={s.activityBadges}>
            <View style={[s.periodBadge, { backgroundColor: periodBg }]}>
              <Text style={[s.periodBadgeLabel, { color: periodColor }]}>
                {PERIODICITY_LABEL[activity.periodicity]}
              </Text>
            </View>
            {activity.durationMinutes != null && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{activity.durationMinutes} min</Text>
              </View>
            )}
          </View>
        </View>
        <View style={s.manageActions}>
          <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Edit2 size={15} color={Colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            disabled={deleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.muted} />
            ) : (
              <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type TabType = 'today' | 'manage';

export default function ActividadesScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | undefined>();

  const queryClient = useQueryClient();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const {
    data: todayActivities = [],
    isLoading: loadingToday,
    isFetching: fetchingToday,
  } = useActivities(dateStr);

  const {
    data: allActivities = [],
    isLoading: loadingAll,
    isFetching: fetchingAll,
  } = useAllActivities();

  const deleteActivity = useDeleteActivity();

  const onRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: activityKeys.all });
  }, [queryClient]);

  const sortedToday = sortActivitiesForDate(todayActivities);

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingActivity(undefined);
  };

  const isLoading = activeTab === 'today' ? loadingToday : loadingAll;
  const isFetching = activeTab === 'today' ? fetchingToday : fetchingAll;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer onRefresh={onRefresh} refreshing={isFetching && !isLoading}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={Colors.ink} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Actividades</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Tabs */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'today' && s.tabActive]}
            onPress={() => setActiveTab('today')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabLabel, activeTab === 'today' && s.tabLabelActive]}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'manage' && s.tabActive]}
            onPress={() => setActiveTab('manage')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabLabel, activeTab === 'manage' && s.tabLabelActive]}>Gestionar</Text>
          </TouchableOpacity>
        </View>

        {/* Tab: Today */}
        {activeTab === 'today' && (
          <>
            {/* Date navigation */}
            <View style={s.dateNav}>
              <TouchableOpacity
                onPress={() => setSelectedDate((d) => subDays(d, 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color={Colors.ink} />
              </TouchableOpacity>
              <Text style={s.dateLabel}>{formatDateLabel(selectedDate)}</Text>
              <TouchableOpacity
                onPress={() => setSelectedDate((d) => addDays(d, 1))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />
            ) : sortedToday.length === 0 ? (
              <Card solid style={s.emptyCard}>
                <Zap size={36} color={Colors.ceilLight} strokeWidth={1} />
                <Text style={s.emptyTitle}>Sin actividades</Text>
                <Text style={s.emptySub}>No hay actividades programadas para este día</Text>
              </Card>
            ) : (
              sortedToday.map((a) => <ActivityItem key={a.id} activity={a} dateStr={dateStr} />)
            )}
          </>
        )}

        {/* Tab: Manage */}
        {activeTab === 'manage' && (
          <>
            {isLoading ? (
              <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 32 }} />
            ) : allActivities.length === 0 ? (
              <Card solid style={s.emptyCard}>
                <Zap size={36} color={Colors.ceilLight} strokeWidth={1} />
                <Text style={s.emptyTitle}>Sin actividades</Text>
                <Text style={s.emptySub}>Creá tu primera actividad recurrente</Text>
              </Card>
            ) : (
              allActivities.map((a) => (
                <ManageItem
                  key={a.id}
                  activity={a}
                  onEdit={() => handleEdit(a)}
                  onDelete={() => deleteActivity.mutate(a.id)}
                  deleting={deleteActivity.isPending && deleteActivity.variables === a.id}
                />
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScreenContainer>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => {
          setActiveTab('manage');
          setShowForm(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#fff" strokeWidth={2} />
      </TouchableOpacity>

      <ActivityFormModal
        visible={showForm}
        onClose={handleCloseForm}
        editing={editingActivity}
        allActivities={allActivities}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.ink,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    ...Shadows.account,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.ink,
  },

  // Date nav
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  dateLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: Colors.ink,
  },

  // Activity item
  activityItem: {
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  activityItemDim: {
    opacity: 0.5,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkCircleActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    flex: 1,
  },
  activityNameDone: {
    textDecorationLine: 'line-through',
    color: Colors.muted,
  },
  activityBadges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.muted,
  },

  // Expanded
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  expandedDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.ink,
    height: 72,
  },
  saveNotesBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.ice,
    borderRadius: Radius.pill,
  },
  saveNotesBtnLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.vivid,
  },

  // Manage item
  manageItem: {
    marginBottom: Spacing.sm,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  manageEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  emojiPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: 4,
  },
  manageActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  periodBadgeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing['2xl'],
    width: 52,
    height: 52,
    borderRadius: Radius.fab,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },

  // Empty
  emptyCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
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
    maxHeight: '90%',
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

  // Form
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  multilineInput: {
    height: 72,
    textAlignVertical: 'top',
  },
  emojiInput: {
    width: 52,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 22,
    color: Colors.ink,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    alignItems: 'center',
    backgroundColor: Colors.bgTop,
  },
  segmentActive: {
    backgroundColor: Colors.vivid,
  },
  segmentLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  dayRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgTop,
  },
  dayChipActive: {
    backgroundColor: Colors.vivid,
  },
  dayChipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  timeSep: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  afterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bgTop,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  afterChipActive: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  afterChipLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});

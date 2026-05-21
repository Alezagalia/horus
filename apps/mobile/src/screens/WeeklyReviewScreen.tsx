/**
 * WeeklyReviewScreen
 * F-03 - Revisión Semanal / Check-in
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWeekStats,
  getCurrentReview,
  listQuestions,
  updateReview,
  createQuestion,
} from '../api/weeklyReview.api';
import { getGoals } from '../api/goals.api';

// ─── Week helpers ──────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${monday.toLocaleDateString('es', opts)} – ${sunday.toLocaleDateString('es', opts)}`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WeeklyReviewScreen() {
  const queryClient = useQueryClient();
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOf(new Date()));
  const weekStart = currentMonday.toISOString();

  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['weekly-review', 'stats', weekStart],
    queryFn: () => getWeekStats(weekStart),
    enabled: !!weekStart,
  });

  const {
    data: review,
    isLoading: reviewLoading,
    refetch: refetchReview,
  } = useQuery({
    queryKey: ['weekly-review', 'current', weekStart],
    queryFn: () => getCurrentReview(weekStart),
    enabled: !!weekStart,
  });

  const { data: questions = [], refetch: refetchQuestions } = useQuery({
    queryKey: ['weekly-review', 'questions'],
    queryFn: listQuestions,
  });

  const { data: goalsData } = useQuery({
    queryKey: ['goals', 'en_progreso'],
    queryFn: () => getGoals('en_progreso'),
  });

  const activeGoals = goalsData ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateReview>[1] }) =>
      updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review', 'current', weekStart] });
      queryClient.invalidateQueries({ queryKey: ['weekly-review', 'history'] });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (text: string) => createQuestion(text, questions.length),
    onSuccess: () => {
      setNewQuestion('');
      refetchQuestions();
    },
  });

  const isLoading = statsLoading || reviewLoading;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchStats(), refetchReview(), refetchQuestions()]);
  }, [refetchStats, refetchReview, refetchQuestions]);

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoalIds((prev) =>
      prev.includes(goalId) ? prev.filter((id) => id !== goalId) : [...prev, goalId]
    );
  };

  const handleTaskToggle = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSave = async (complete = false) => {
    if (!review) return;
    setSaving(true);
    try {
      const answers = questions
        .filter((q) => (localAnswers[q.id] || '').trim())
        .map((q) => ({ questionId: q.id, answer: localAnswers[q.id] }));

      const focusGoalIds = selectedGoalIds.length
        ? selectedGoalIds
        : review.focusGoals.map((fg) => fg.goalId);

      const focusTaskIds = selectedTaskIds.length
        ? selectedTaskIds
        : review.focusTasks.map((ft) => ft.taskId);

      await updateMutation.mutateAsync({
        id: review.id,
        data: {
          answers,
          focusGoalIds,
          focusTaskIds,
          ...(complete ? { completedAt: new Date().toISOString() } : {}),
        },
      });
      Alert.alert('Éxito', complete ? '¡Revisión completada! 🎉' : 'Revisión guardada');
    } catch {
      Alert.alert('Error', 'No se pudo guardar la revisión');
    } finally {
      setSaving(false);
    }
  };

  const isCompleted = !!review?.completedAt;

  // Goals shown in planner: merge active goals + already-selected goals from server
  const plannerGoals =
    activeGoals.length > 0
      ? activeGoals
      : (review?.focusGoals ?? []).map((fg) => ({
          id: fg.goalId,
          title: fg.goal?.title ?? fg.goalId,
          status: fg.goal?.status ?? 'en_progreso',
          priority: fg.goal?.priority,
        }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />}
    >
      <Text style={styles.title}>📋 Revisión Semanal</Text>

      {/* Week navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => {
            const prev = new Date(currentMonday);
            prev.setDate(prev.getDate() - 7);
            setCurrentMonday(prev);
          }}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.weekLabelContainer}>
          <Text style={styles.weekLabel}>{formatWeekLabel(currentMonday)}</Text>
          {isCompleted && <Text style={styles.completedBadge}>✓ Completada</Text>}
        </View>
        <TouchableOpacity
          onPress={() => {
            const next = new Date(currentMonday);
            next.setDate(next.getDate() + 7);
            if (next <= getMondayOf(new Date())) setCurrentMonday(next);
          }}
          style={styles.navBtn}
        >
          <Text style={styles.navBtnText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Stats cards */}
      {statsLoading ? (
        <ActivityIndicator style={{ marginVertical: 24 }} color="#7C3AED" />
      ) : stats ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          <StatCard
            emoji="🎯"
            label="Hábitos"
            value={`${stats.habits.rate}%`}
            sub={`${stats.habits.completed} completos`}
          />
          <StatCard
            emoji="✅"
            label="Tareas"
            value={`${stats.tasks.completed}`}
            sub="completadas"
          />
          <StatCard
            emoji="💸"
            label="Balance"
            value={`${stats.finance.balance >= 0 ? '+' : ''}${stats.finance.balance.toLocaleString('es', { maximumFractionDigits: 0 })}`}
            sub={`Ing: ${stats.finance.income.toLocaleString('es', { maximumFractionDigits: 0 })}`}
          />
          <StatCard
            emoji="🏆"
            label="Metas activas"
            value={`${stats.goals.length}`}
            sub={`${stats.goals.filter((g) => g.progress > 50).length} >50%`}
          />
          <StatCard
            emoji="📅"
            label="Eventos"
            value={`${stats.events.completed}/${stats.events.total}`}
            sub="completados"
          />
        </ScrollView>
      ) : null}

      {/* Reflection questions */}
      <Text style={styles.sectionTitle}>💭 Reflexión</Text>
      {questions.map((q) => (
        <View key={q.id} style={styles.questionCard}>
          <Text style={styles.questionText}>{q.text}</Text>
          <TextInput
            style={styles.answerInput}
            multiline
            numberOfLines={3}
            placeholder="Tu respuesta..."
            placeholderTextColor="#9CA3AF"
            value={
              localAnswers[q.id] ?? review?.answers.find((a) => a.questionId === q.id)?.answer ?? ''
            }
            onChangeText={(text) => setLocalAnswers((prev) => ({ ...prev, [q.id]: text }))}
          />
        </View>
      ))}

      {/* Add question inline */}
      <View style={styles.addQuestionRow}>
        <TextInput
          style={styles.addQuestionInput}
          placeholder="+ Nueva pregunta..."
          placeholderTextColor="#8B5CF6"
          value={newQuestion}
          onChangeText={setNewQuestion}
        />
        {newQuestion.trim() ? (
          <TouchableOpacity
            onPress={() => createQuestionMutation.mutate(newQuestion.trim())}
            style={styles.addQuestionBtn}
            disabled={createQuestionMutation.isPending}
          >
            <Text style={styles.addQuestionBtnText}>
              {createQuestionMutation.isPending ? '…' : 'Agregar'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Metas foco */}
      <Text style={styles.sectionTitle}>🚀 ¿En qué metas te enfocas la próxima semana?</Text>
      {plannerGoals.length === 0 ? (
        <Text style={styles.emptyText}>No tienes metas activas.</Text>
      ) : (
        <View style={styles.goalsContainer}>
          {plannerGoals.map((g) => {
            const selected =
              selectedGoalIds.includes(g.id) ||
              (!selectedGoalIds.length &&
                (review?.focusGoals ?? []).some((fg) => fg.goalId === g.id));
            return (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalChip, selected && styles.goalChipSelected]}
                onPress={() => handleGoalToggle(g.id)}
              >
                <Text style={[styles.goalChipText, selected && styles.goalChipTextSelected]}>
                  🏆 {g.title}
                </Text>
                {selected && <Text style={styles.goalChipCheck}> ✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tareas concretas */}
      {review && review.focusTasks.length > 0 && (
        <>
          <Text style={styles.subSectionTitle}>Tareas concretas</Text>
          <View style={styles.chipsContainer}>
            {review.focusTasks.map((ft) => {
              const selected = selectedTaskIds.includes(ft.taskId) || !selectedTaskIds.length;
              return (
                <TouchableOpacity
                  key={ft.taskId}
                  style={[styles.chip, styles.chipTask, selected && styles.chipTaskSelected]}
                  onPress={() => handleTaskToggle(ft.taskId)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTaskTextSelected]}>
                    {ft.task?.title?.length > 28
                      ? ft.task?.title?.slice(0, 28) + '…'
                      : ft.task?.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Guardando…' : 'Guardar borrador'}</Text>
        </TouchableOpacity>
        {!isCompleted && (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => handleSave(true)}
            disabled={saving}
          >
            <Text style={styles.completeBtnText}>
              {saving ? 'Completando…' : '✓ Completar revisión'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },

  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 18, color: '#6B7280' },
  weekLabelContainer: { flex: 1, alignItems: 'center' },
  weekLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  completedBadge: {
    fontSize: 11,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginTop: 4,
  },

  statsRow: { marginBottom: 16 },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statSub: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  subSectionTitle: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },

  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  questionText: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  answerInput: {
    fontSize: 13,
    color: '#374151',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  addQuestionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addQuestionInput: {
    flex: 1,
    fontSize: 13,
    color: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
  },
  addQuestionBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addQuestionBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },

  // Goals planner
  goalsContainer: { gap: 8, marginBottom: 4 },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  goalChipSelected: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  goalChipText: { fontSize: 13, color: '#6D28D9', fontWeight: '600', flex: 1 },
  goalChipTextSelected: { color: '#FFFFFF' },
  goalChipCheck: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

  // Task chips
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipTask: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  chipTaskSelected: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipTaskTextSelected: { color: '#FFFFFF' },

  actions: { marginTop: 24, gap: 12 },
  saveBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  completeBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  completeBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

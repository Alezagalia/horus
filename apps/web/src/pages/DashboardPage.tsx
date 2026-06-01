/**
 * Dashboard Page - Glassmorphism Design
 * Sprint 11 - US-096, US-097
 * Connected to real API data
 * UX Enhancement: Interactive habit checkboxes
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useHabits, useToggleHabitComplete } from '@/hooks/useHabits';
import { useActivities, useToggleActivityRecord } from '@/hooks/useActivities';
import { useHabitMoments } from '@/hooks/useHabitMoments';
import { DailyTimeline } from '@/components/dashboard/DailyTimeline';
import { useFeaturedGoal } from '@/hooks/useGoals';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCurrentMonthlyExpenses, usePayMonthlyExpense } from '@/hooks/useMonthlyExpenses';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';
import type { MonthlyExpense, Currency } from '@horus/shared';

// Animated Counter Hook (Reserved for future stat cards)
function _useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}
void _useAnimatedCounter; // Reserved for future use

// Helper to check if habit is scheduled for today — mirrors backend debiaRealizarseEnFecha
function isHabitScheduledForToday(habit: {
  periodicity: string;
  weekDays: number[];
  createdAt: string;
}): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();

  switch (habit.periodicity) {
    case 'DAILY':
      if (habit.weekDays.length > 0) return habit.weekDays.includes(dayOfWeek);
      return true;
    case 'WEEKLY':
      return habit.weekDays.includes(dayOfWeek);
    case 'MONTHLY': {
      const createdDate = new Date(habit.createdAt);
      return today.getDate() === createdDate.getDate();
    }
    case 'CUSTOM':
      if (habit.weekDays.length > 0) return habit.weekDays.includes(dayOfWeek);
      return true;
    default:
      return true;
  }
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Fetch real data from APIs
  const { data: featuredGoal } = useFeaturedGoal();
  const { data: habitsData, isLoading: habitsLoading } = useHabits();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();

  // Fetch calendar events for the next 7 days
  const today = new Date();
  const sevenDaysLater = addDays(today, 7);
  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents({
    from: startOfDay(today).toISOString(),
    to: endOfDay(sevenDaysLater).toISOString(),
  });

  // Fetch monthly expenses and accounts for pending expenses section
  const { data: monthlyExpensesData } = useCurrentMonthlyExpenses();
  const { data: accounts = [] } = useAccounts();
  const payMutation = usePayMonthlyExpense();

  // State for pay modal
  const [payingExpense, setPayingExpense] = useState<MonthlyExpense | null>(null);
  const [payFormData, setPayFormData] = useState({
    amount: 0,
    accountId: '',
    paidDate: new Date().toISOString().split('T')[0],
  });

  // Mutation for toggling habit completion
  const toggleCompleteMutation = useToggleHabitComplete();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Activities and habit moments for DailyTimeline
  const { data: activitiesData } = useActivities(todayStr);
  const { data: habitMomentsData } = useHabitMoments();
  const toggleActivityMutation = useToggleActivityRecord();

  // Process habits for today
  const todayHabits = useMemo(() => {
    if (!habitsData) return [];

    return habitsData
      .filter((h) => h.isActive && isHabitScheduledForToday(h))
      .map((habit) => {
        const lastCompleted = habit.lastCompletedDate
          ? new Date(habit.lastCompletedDate).toISOString().split('T')[0]
          : null;
        const isCompletedToday = lastCompleted === todayStr;

        return {
          id: habit.id,
          name: habit.name,
          completed: isCompletedToday,
          categoryIcon: habit.category?.icon || '📋',
          categoryColor: habit.category?.color || '#6366f1',
          currentStreak: habit.currentStreak,
          type: habit.type,
          targetValue: habit.targetValue,
          timeOfDay: habit.timeOfDay ?? '',
        };
      });
  }, [habitsData, todayStr]);

  // Handler for toggling habit completion (newCompleted = desired new state)
  const handleToggleHabit = (habitId: string, newCompleted: boolean) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) return;

    toggleCompleteMutation.mutate(
      {
        habitId,
        data: {
          date: todayStr,
          completed: newCompleted,
          value: habit.type === 'NUMERIC' && newCompleted ? habit.targetValue : undefined,
        },
      },
      {
        onSuccess: () => {
          if (newCompleted) {
            toast.success(`¡${habit.name} completado!`, { icon: '✅', duration: 2000 });

            // Check if all habits are now completed
            const otherHabits = todayHabits.filter((h) => h.id !== habitId);
            const allOthersCompleted = otherHabits.every((h) => h.completed);
            if (allOthersCompleted && otherHabits.length > 0) {
              setTimeout(() => {
                toast.success('¡Felicitaciones! Completaste todos tus hábitos de hoy', {
                  icon: '🎉',
                  duration: 4000,
                });
              }, 500);
            }
          } else {
            toast('Hábito desmarcado', { icon: '↩️', duration: 1500 });
          }
        },
      }
    );
  };

  // Today's events for DailyTimeline
  const todayEvents = useMemo(() => {
    if (!eventsData) return [];
    return eventsData.filter((e) => isToday(new Date(e.startDateTime)));
  }, [eventsData]);

  // Handler for toggling activity completion
  const handleToggleActivity = (activityId: string, completed: boolean) => {
    toggleActivityMutation.mutate({ activityId, data: { date: todayStr, completed, notes: null } });
  };

  // Calculate stats
  const stats = useMemo(() => {
    const activeHabits = habitsData?.filter((h) => h.isActive).length || 0;
    const pendingTasks = tasksData?.filter((t) => t.status !== 'completed').length || 0;
    const overdueTasks =
      tasksData?.filter((t) => {
        if (!t.dueDate || t.status === 'completed') return false;
        return new Date(t.dueDate) < new Date(todayStr);
      }).length || 0;

    return { activeHabits, pendingTasks, overdueTasks };
  }, [habitsData, tasksData, todayStr]);

  // Completion percentage (used in hero section quick stats)
  const completedCount = todayHabits.filter((h) => h.completed).length;
  const totalCount = todayHabits.length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const _getRelativeDate = (dueDate: string) => {
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Hace ${Math.abs(diffDays)}d`, urgent: true };
    if (diffDays === 0) return { text: 'Hoy', urgent: true };
    if (diffDays === 1) return { text: 'Manana', urgent: false };
    return { text: `En ${diffDays}d`, urgent: false };
  };
  void _getRelativeDate; // Reserved for future use

  // Pending monthly expenses (sorted: no due day first, then by due day ascending)
  const pendingExpenses = useMemo(() => {
    if (!monthlyExpensesData?.monthlyExpenses) return [];
    const pending = monthlyExpensesData.monthlyExpenses.filter((e) => e.status === 'pendiente');

    // Sort: first those WITHOUT due day, then those WITH due day sorted ascending (closest first)
    pending.sort((a, b) => {
      const dueDayA = a.recurringExpense?.dueDay;
      const dueDayB = b.recurringExpense?.dueDay;

      // No due day comes first
      if (!dueDayA && dueDayB) return -1;
      if (dueDayA && !dueDayB) return 1;
      // Both have due day: sort ascending (closest first)
      if (dueDayA && dueDayB) return dueDayA - dueDayB;
      // Both without due day: keep original order
      return 0;
    });

    return pending.slice(0, 5); // Max 5 items
  }, [monthlyExpensesData]);

  // Helper to get due day status
  const getDueDayStatus = (dueDay: number | null | undefined) => {
    if (!dueDay) return null;

    const today = new Date();
    const currentDay = today.getDate();
    const daysUntilDue = dueDay - currentDay;

    if (daysUntilDue < 0) {
      return { text: 'Vencido', class: 'bg-red-100 text-red-700', urgent: true };
    } else if (daysUntilDue === 0) {
      return { text: 'Vence hoy', class: 'bg-amber-100 text-amber-700', urgent: true };
    } else if (daysUntilDue <= 3) {
      return {
        text: `Vence en ${daysUntilDue}d`,
        class: 'bg-amber-100 text-amber-700',
        urgent: false,
      };
    } else {
      return { text: `Día ${dueDay}`, class: 'bg-gray-100 text-gray-600', urgent: false };
    }
  };

  const totalPending = useMemo(() => {
    return pendingExpenses.reduce((sum, e) => sum + (e.previousAmount || 0), 0);
  }, [pendingExpenses]);

  // Ensure accounts is an array
  const accountsList = Array.isArray(accounts) ? accounts : [];
  const activeAccounts = accountsList.filter((acc) => acc.isActive);

  // Handle opening pay modal
  const handleOpenPayModal = (expense: MonthlyExpense) => {
    setPayingExpense(expense);
    setPayFormData({
      amount: expense.previousAmount || 0,
      accountId: '',
      paidDate: new Date().toISOString().split('T')[0],
    });
  };

  // Handle pay submit
  const handlePaySubmit = () => {
    if (!payingExpense || !payFormData.accountId) return;

    payMutation.mutate(
      {
        id: payingExpense.id,
        data: {
          amount: payFormData.amount,
          accountId: payFormData.accountId,
          paidDate: new Date(`${payFormData.paidDate}T12:00:00`).toISOString(),
        },
      },
      {
        onSuccess: () => {
          setPayingExpense(null);
        },
      }
    );
  };

  const isLoading = habitsLoading || tasksLoading || eventsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Toaster position="top-right" />

      {/* Hero Section */}
      <div className="hero-gradient rounded-3xl p-8 md:p-10 text-white relative overflow-hidden animate-fade-in">
        <div className="relative z-10">
          <p className="text-white/80 text-lg mb-1">{getGreeting()}</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {user?.name?.split(' ')[0] || 'Usuario'}
          </h1>
          <p className="text-white/70 text-lg max-w-xl">
            Aqui tienes un resumen de tu dia. Manten el enfoque y alcanza tus metas.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/30">
              <p className="text-white/70 text-sm">Habitos hoy</p>
              <p className="text-2xl font-bold">
                {completedCount}/{totalCount}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/30">
              <p className="text-white/70 text-sm">Tareas urgentes</p>
              <p className="text-2xl font-bold">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 blur-3xl" />
      </div>

      {/* Featured Goal */}
      {featuredGoal && (
        <div
          className="animate-slide-up opacity-0 delay-100"
          style={{ animationFillMode: 'forwards' }}
        >
          <button
            onClick={() => navigate(`/goals/${featuredGoal.id}`)}
            className="w-full text-left"
          >
            <div className="glass-card p-5 border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    {featuredGoal.category?.icon ? (
                      <span className="text-xl">{featuredGoal.category.icon}</span>
                    ) : (
                      <span className="text-xl">🏆</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Meta destacada
                    </p>
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {featuredGoal.title}
                    </h3>
                    {featuredGoal.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {featuredGoal.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-bold text-amber-600">{featuredGoal.progress}%</p>
                  <p className="text-xs text-gray-500">progreso</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all"
                    style={{ width: `${Math.min(featuredGoal.progress, 100)}%` }}
                  />
                </div>
              </div>
              {/* KRs + links */}
              {((featuredGoal.keyResults?.length ?? 0) > 0 ||
                featuredGoal.linkedHabitsCount > 0 ||
                featuredGoal.linkedTasksCount > 0) && (
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                  {(featuredGoal.keyResults?.length ?? 0) > 0 && (
                    <span>🎯 {featuredGoal.keyResults?.length} KRs</span>
                  )}
                  {featuredGoal.linkedHabitsCount > 0 && (
                    <span>🔄 {featuredGoal.linkedHabitsCount} hábitos</span>
                  )}
                  {featuredGoal.linkedTasksCount > 0 && (
                    <span>✅ {featuredGoal.linkedTasksCount} tareas</span>
                  )}
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Timeline */}
        <DailyTimeline
          habits={todayHabits}
          activities={activitiesData ?? []}
          events={todayEvents}
          habitMoments={habitMomentsData ?? []}
          onToggleHabit={handleToggleHabit}
          onToggleActivity={handleToggleActivity}
          isToggling={toggleCompleteMutation.isPending || toggleActivityMutation.isPending}
        />

        {/* Pending Monthly Expenses Card */}
        <div
          className="glass-card p-6 animate-slide-up opacity-0 delay-500"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Gastos Pendientes</h2>
              <p className="text-sm text-gray-500">Gastos fijos del mes</p>
            </div>
            <button
              onClick={() => navigate('/monthly-expenses')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              Ver todos
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {pendingExpenses.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-600 font-medium">¡Todo pagado!</p>
              <p className="text-sm text-gray-500 mt-1">No tienes gastos pendientes este mes</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {pendingExpenses.map((expense) => {
                  const dueStatus = getDueDayStatus(expense.recurringExpense?.dueDay);
                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                        dueStatus?.urgent
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">
                          {expense.category?.icon || '📄'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {expense.concept}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-gray-500">
                              {expense.previousAmount
                                ? `~${formatCurrency(expense.previousAmount, (expense.recurringExpense?.currency || 'ARS') as Currency)}`
                                : 'Sin monto previo'}
                            </p>
                            {dueStatus && (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded font-medium ${dueStatus.class}`}
                              >
                                {dueStatus.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenPayModal(expense)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0 ml-2"
                      >
                        Pagar
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total estimado:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ~{formatCurrency(totalPending, 'ARS')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {payingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setPayingExpense(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Pagar: {payingExpense.concept}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{payingExpense.category?.name}</p>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={payFormData.amount}
                    onChange={(e) =>
                      setPayFormData({ ...payFormData, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta</label>
                  <select
                    value={payFormData.accountId}
                    onChange={(e) => setPayFormData({ ...payFormData, accountId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar cuenta</option>
                    {activeAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.icon} {acc.name} ({formatCurrency(acc.currentBalance, acc.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={payFormData.paidDate}
                    onChange={(e) => setPayFormData({ ...payFormData, paidDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setPayingExpense(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePaySubmit}
                  disabled={
                    !payFormData.accountId || payFormData.amount <= 0 || payMutation.isPending
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {payMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

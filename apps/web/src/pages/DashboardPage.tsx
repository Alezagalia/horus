/**
 * Dashboard Page - Glassmorphism Design
 * Sprint 11 - US-096, US-097
 * Connected to real API data
 * UX Enhancement: Interactive habit checkboxes
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfDay, endOfDay, isToday, isTomorrow, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Toaster, toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useHabits, useToggleHabitComplete } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useCurrentMonthlyExpenses, usePayMonthlyExpense } from '@/hooks/useMonthlyExpenses';
import { useAccounts } from '@/hooks/useAccounts';
import { formatCurrency } from '@/utils/currency';
import type { CalendarEvent, MonthlyExpense, Currency } from '@horus/shared';

// Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 1000) {
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

// Progress Ring Component
function ProgressRing({
  percentage,
  size = 160,
  strokeWidth = 12,
  className = ''
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200/50"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gradient">{Math.round(percentage)}%</span>
        <span className="text-sm text-gray-500">completado</span>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  gradient,
  delay = 0
}: {
  icon: string;
  label: string;
  value: number;
  gradient: string;
  delay?: number;
}) {
  const animatedValue = useAnimatedCounter(value, 1000);

  return (
    <div
      className="glass-card p-5 animate-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{animatedValue}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Helper to check if habit is scheduled for today
function isHabitScheduledForToday(habit: { periodicity: string; weekDays: number[] }): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();

  switch (habit.periodicity) {
    case 'DAILY':
      return true;
    case 'WEEKLY':
      return habit.weekDays.includes(dayOfWeek);
    case 'MONTHLY':
      return true;
    case 'CUSTOM':
      return habit.weekDays.includes(dayOfWeek);
    default:
      return true;
  }
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  // Fetch real data from APIs
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
        };
      });
  }, [habitsData, todayStr]);

  // Handler for toggling habit completion
  const handleToggleHabit = (habitId: string, currentlyCompleted: boolean) => {
    const habit = todayHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const newCompleted = !currentlyCompleted;

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
                  duration: 4000
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

  // Unified agenda: tasks with due date + calendar events
  type AgendaItem = {
    id: string;
    type: 'task' | 'event';
    title: string;
    date: Date;
    priority?: 'alta' | 'media' | 'baja';
    time?: string; // For events: "14:00 - 15:00"
    location?: string | null;
    isAllDay?: boolean;
    categoryIcon?: string;
  };

  const upcomingAgenda = useMemo(() => {
    const items: AgendaItem[] = [];
    const now = new Date();
    const maxDate = addDays(now, 7);

    // Add tasks with due date
    if (tasksData) {
      tasksData
        .filter((t) => t.status !== 'completed' && t.dueDate)
        .forEach((task) => {
          const dueDate = new Date(task.dueDate!);
          if (dueDate <= maxDate) {
            items.push({
              id: task.id,
              type: 'task',
              title: task.title,
              date: dueDate,
              priority: task.priority,
              categoryIcon: task.categoryIcon,
            });
          }
        });
    }

    // Add calendar events
    if (eventsData) {
      eventsData
        .filter((e) => e.status !== 'cancelado')
        .forEach((event) => {
          const eventDate = new Date(event.startDateTime);
          const endDate = new Date(event.endDateTime);

          // Format time for non-all-day events
          let timeStr: string | undefined;
          if (!event.isAllDay) {
            const startTime = format(eventDate, 'HH:mm');
            const endTime = format(endDate, 'HH:mm');
            timeStr = `${startTime} - ${endTime}`;
          }

          items.push({
            id: event.id,
            type: 'event',
            title: event.title,
            date: eventDate,
            time: timeStr,
            location: event.location,
            isAllDay: event.isAllDay,
            categoryIcon: event.category?.icon || '📅',
          });
        });
    }

    // Sort by date/time
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    return items.slice(0, 6);
  }, [tasksData, eventsData]);

  // Group agenda items by day
  const groupedAgenda = useMemo(() => {
    const groups: { label: string; date: Date; items: AgendaItem[] }[] = [];

    upcomingAgenda.forEach((item) => {
      const itemDate = startOfDay(item.date);
      let group = groups.find((g) => isSameDay(g.date, itemDate));

      if (!group) {
        let label: string;
        if (isToday(itemDate)) {
          label = 'Hoy';
        } else if (isTomorrow(itemDate)) {
          label = 'Mañana';
        } else {
          label = format(itemDate, "EEEE d 'de' MMMM", { locale: es });
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        group = { label, date: itemDate, items: [] };
        groups.push(group);
      }

      group.items.push(item);
    });

    return groups;
  }, [upcomingAgenda]);

  // Calculate stats
  const stats = useMemo(() => {
    const activeHabits = habitsData?.filter((h) => h.isActive).length || 0;
    const pendingTasks = tasksData?.filter((t) => t.status !== 'completed').length || 0;
    const overdueTasks = tasksData?.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date(todayStr);
    }).length || 0;

    return { activeHabits, pendingTasks, overdueTasks };
  }, [habitsData, tasksData, todayStr]);

  // Best streak
  const bestStreak = useMemo(() => {
    if (!habitsData || habitsData.length === 0) return null;

    const habitsWithStreak = habitsData.filter((h) => h.currentStreak > 0);
    if (habitsWithStreak.length === 0) return null;

    const best = habitsWithStreak.reduce((prev, curr) =>
      curr.currentStreak > prev.currentStreak ? curr : prev
    );

    return {
      habitName: best.name,
      streakDays: best.currentStreak,
    };
  }, [habitsData]);

  // Completion percentage
  const completedCount = todayHabits.filter((h) => h.completed).length;
  const totalCount = todayHabits.length;
  const habitsCompletionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getRelativeDate = (dueDate: string) => {
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

  const getPriorityStyles = (priority: 'alta' | 'media' | 'baja') => {
    const styles = {
      alta: 'bg-gradient-to-r from-red-500 to-orange-500 text-white',
      media: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
      baja: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
    };
    return styles[priority];
  };

  // Pending monthly expenses (sorted: no due day first, then by due day ascending)
  const pendingExpenses = useMemo(() => {
    if (!monthlyExpensesData?.monthlyExpenses) return [];
    const pending = monthlyExpensesData.monthlyExpenses
      .filter((e) => e.status === 'pendiente');

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
      return { text: `Vence en ${daysUntilDue}d`, class: 'bg-amber-100 text-amber-700', urgent: false };
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
      {/* @ts-expect-error - react-hot-toast has type compatibility issues with React 18/19 */}
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
              <p className="text-2xl font-bold">{completedCount}/{totalCount}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/30">
              <p className="text-white/70 text-sm">Racha maxima</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                <span className="streak-fire">🔥</span> {bestStreak?.streakDays || 0}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Habits Progress Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Habitos de Hoy</h2>
              <p className="text-sm text-gray-500">Tu progreso del dia</p>
            </div>
            <button
              onClick={() => navigate('/habits/today')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              Ver todos
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-8">
            <ProgressRing percentage={habitsCompletionPercentage} />

            <div className="flex-1 space-y-3">
              {todayHabits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tienes habitos para hoy</p>
                  <button
                    onClick={() => navigate('/habits')}
                    className="text-sm text-indigo-600 hover:text-indigo-500 mt-2"
                  >
                    Crear un habito
                  </button>
                </div>
              ) : (
                todayHabits.slice(0, 4).map((habit, index) => (
                  <button
                    key={habit.id}
                    onClick={() => handleToggleHabit(habit.id, habit.completed)}
                    disabled={toggleCompleteMutation.isPending}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group ${
                      habit.completed
                        ? 'bg-green-50 border border-green-100 hover:bg-green-100'
                        : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm'
                    } ${toggleCompleteMutation.isPending ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      habit.completed
                        ? 'bg-green-500 text-white scale-100'
                        : 'bg-white border-2 border-gray-200 group-hover:border-green-400 group-hover:scale-105'
                    }`}>
                      {habit.completed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg">{habit.categoryIcon}</span>
                    <span className={`flex-1 text-sm font-medium transition-colors ${
                      habit.completed ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.currentStreak > 0 && (
                      <span className="badge-gradient text-xs">
                        🔥 {habit.currentStreak}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Unified Agenda Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Próximamente</h2>
              <p className="text-sm text-gray-500">Tu agenda de los próximos días</p>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              Ver calendario
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {groupedAgenda.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3 opacity-50">📅</div>
                <p className="text-gray-500">No tienes eventos ni tareas próximas</p>
                <div className="flex justify-center gap-3 mt-4">
                  <button
                    onClick={() => navigate('/tasks')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Crear tarea
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => navigate('/calendar')}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Crear evento
                  </button>
                </div>
              </div>
            ) : (
              groupedAgenda.map((group, groupIndex) => (
                <div key={group.label}>
                  {/* Day Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${
                      group.label === 'Hoy' ? 'text-indigo-600' : 'text-gray-500'
                    }`}>
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Items for this day */}
                  <div className="space-y-2">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => navigate(item.type === 'task' ? '/tasks' : '/calendar')}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                          item.type === 'event'
                            ? 'bg-purple-50 hover:bg-purple-100 border border-purple-100'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          item.type === 'event'
                            ? 'bg-purple-500 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          <span className="text-sm">{item.type === 'event' ? '📅' : '📝'}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {/* Event time */}
                            {item.type === 'event' && item.time && (
                              <span className="text-xs text-purple-600 font-medium">
                                🕐 {item.time}
                              </span>
                            )}
                            {/* Event all day */}
                            {item.type === 'event' && item.isAllDay && (
                              <span className="text-xs text-purple-600 font-medium">
                                Todo el día
                              </span>
                            )}
                            {/* Event location */}
                            {item.type === 'event' && item.location && (
                              <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                📍 {item.location}
                              </span>
                            )}
                            {/* Task priority */}
                            {item.type === 'task' && item.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityStyles(item.priority)}`}>
                                {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Type indicator */}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.type === 'event'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.type === 'event' ? 'Evento' : 'Tarea'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Best Streak Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Tu Mejor Racha</h2>

          {bestStreak ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 shadow-2xl shadow-orange-500/30 mb-6 float-animation">
                <span className="text-5xl streak-fire">🔥</span>
              </div>
              <div className="mb-4">
                <p className="text-6xl font-bold text-gradient-warm">{bestStreak.streakDays}</p>
                <p className="text-gray-500 uppercase tracking-wider text-sm font-medium mt-1">dias consecutivos</p>
              </div>
              <p className="text-lg font-medium text-gray-700">{bestStreak.habitName}</p>
              <p className="text-sm text-gray-500 mt-2">Sigue asi!</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl opacity-30 mb-4">🔥</div>
              <p className="text-gray-500">Aun no tienes rachas</p>
              <p className="text-sm text-gray-400 mt-1">Completa habitos diarios para comenzar</p>
            </div>
          )}
        </div>

        {/* Pending Monthly Expenses Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
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
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
                        dueStatus?.urgent ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{expense.category?.icon || '📄'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{expense.concept}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs text-gray-500">
                              {expense.previousAmount
                                ? `~${formatCurrency(expense.previousAmount, (expense.recurringExpense?.currency || 'ARS') as Currency)}`
                                : 'Sin monto previo'}
                            </p>
                            {dueStatus && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${dueStatus.class}`}>
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
              <p className="text-sm text-gray-500 mb-4">
                {payingExpense.category?.name}
              </p>

              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={payFormData.amount}
                    onChange={(e) => setPayFormData({ ...payFormData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cuenta
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
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
                  disabled={!payFormData.accountId || payFormData.amount <= 0 || payMutation.isPending}
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

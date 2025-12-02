/**
 * Dashboard Page - Glassmorphism Design
 * Sprint 11 - US-096, US-097
 * Connected to real API data
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/authStore';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';

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
        };
      });
  }, [habitsData, todayStr]);

  // Process tasks
  const upcomingTasks = useMemo(() => {
    if (!tasksData) return [];

    return tasksData
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        // Sort by due date, then priority
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        const priorityOrder = { alta: 0, media: 1, baja: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 4);
  }, [tasksData]);

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

  const isLoading = habitsLoading || tasksLoading;

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="📋"
          label="Habitos Activos"
          value={stats.activeHabits}
          gradient="from-blue-500 to-indigo-600"
          delay={100}
        />
        <StatCard
          icon="✅"
          label="Completados Hoy"
          value={completedCount}
          gradient="from-green-500 to-emerald-600"
          delay={200}
        />
        <StatCard
          icon="📝"
          label="Tareas Pendientes"
          value={stats.pendingTasks}
          gradient="from-amber-500 to-orange-600"
          delay={300}
        />
        <StatCard
          icon="⚠️"
          label="Tareas Vencidas"
          value={stats.overdueTasks}
          gradient="from-red-500 to-rose-600"
          delay={400}
        />
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
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      habit.completed
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      habit.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-white border-2 border-gray-200'
                    }`}>
                      {habit.completed ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : null}
                    </div>
                    <span className="text-lg">{habit.categoryIcon}</span>
                    <span className={`flex-1 text-sm font-medium ${
                      habit.completed ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {habit.name}
                    </span>
                    {habit.currentStreak > 0 && (
                      <span className="badge-gradient text-xs">
                        🔥 {habit.currentStreak}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tareas Proximas</h2>
              <p className="text-sm text-gray-500">Lo que viene en tu agenda</p>
            </div>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
            >
              Ver todas
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No tienes tareas pendientes</p>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-sm text-indigo-600 hover:text-indigo-500 mt-2"
                >
                  Crear una tarea
                </button>
              </div>
            ) : (
              upcomingTasks.map((task, index) => {
                const dateInfo = task.dueDate ? getRelativeDate(task.dueDate) : null;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group cursor-pointer"
                    style={{ animationDelay: `${(index + 5) * 100}ms` }}
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="w-6 h-6 rounded-lg border-2 border-gray-300 group-hover:border-indigo-400 transition-colors flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getPriorityStyles(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                        {dateInfo && (
                          <span className={`text-xs font-medium ${
                            dateInfo.urgent ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {dateInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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

        {/* Quick Actions Card */}
        <div className="glass-card p-6 animate-slide-up opacity-0 delay-500" style={{ animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Acciones Rapidas</h2>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '✅', label: 'Nuevo Habito', path: '/habits', gradient: 'from-green-500 to-emerald-600' },
              { icon: '📝', label: 'Nueva Tarea', path: '/tasks', gradient: 'from-blue-500 to-indigo-600' },
              { icon: '📅', label: 'Ver Calendario', path: '/calendar', gradient: 'from-purple-500 to-pink-600' },
              { icon: '💰', label: 'Finanzas', path: '/accounts', gradient: 'from-amber-500 to-orange-600' },
            ].map((action, index) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-2xl bg-gradient-to-br ${action.gradient} text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex flex-col items-center gap-2`}
                style={{ animationDelay: `${(index + 7) * 100}ms` }}
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

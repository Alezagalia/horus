/**
 * Root App Component
 * Sprint 11 - US-095, US-096, US-104
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/MainLayout';
import { KeyboardShortcutsProvider } from '@/components/KeyboardShortcutsProvider';
import { LoadingFallback } from '@/components/LoadingFallback';
import { useAuthStore } from '@/stores/authStore';

// Lazy loading de páginas públicas
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);

// Lazy loading de páginas protegidas
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const HabitsTodayPage = lazy(() =>
  import('@/pages/HabitsTodayPage').then((m) => ({ default: m.HabitsTodayPage }))
);
const HabitsPage = lazy(() =>
  import('@/pages/HabitsPage').then((m) => ({ default: m.HabitsPage }))
);
const HabitStatsPage = lazy(() =>
  import('@/pages/HabitStatsPage').then((m) => ({ default: m.HabitStatsPage }))
);
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const CalendarPage = lazy(() =>
  import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage }))
);
const CategoriesPage = lazy(() =>
  import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage }))
);
const GoogleCallbackPage = lazy(() =>
  import('@/pages/GoogleCallbackPage').then((m) => ({ default: m.GoogleCallbackPage }))
);
const AccountsPage = lazy(() =>
  import('@/pages/AccountsPage').then((m) => ({ default: m.AccountsPage }))
);
const AccountDetailPage = lazy(() =>
  import('@/pages/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage }))
);
const RecurringExpensesPage = lazy(() =>
  import('@/pages/RecurringExpensesPage').then((m) => ({ default: m.RecurringExpensesPage }))
);
const MonthlyExpensesPage = lazy(() =>
  import('@/pages/MonthlyExpensesPage').then((m) => ({ default: m.MonthlyExpensesPage }))
);
const ExercisesPage = lazy(() =>
  import('@/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage }))
);
const RoutinesPage = lazy(() =>
  import('@/pages/RoutinesPage').then((m) => ({ default: m.RoutinesPage }))
);
const RoutineDetailPage = lazy(() =>
  import('@/pages/RoutineDetailPage').then((m) => ({ default: m.RoutineDetailPage }))
);
const RoutineFormPage = lazy(() =>
  import('@/pages/RoutineFormPage').then((m) => ({ default: m.RoutineFormPage }))
);
const ExecuteRoutinePage = lazy(() =>
  import('@/pages/ExecuteRoutinePage').then((m) => ({ default: m.ExecuteRoutinePage }))
);
const WorkoutHistoryPage = lazy(() =>
  import('@/pages/WorkoutHistoryPage').then((m) => ({ default: m.WorkoutHistoryPage }))
);
const WorkoutDetailPage = lazy(() =>
  import('@/pages/WorkoutDetailPage').then((m) => ({ default: m.WorkoutDetailPage }))
);
const WorkoutStatsPage = lazy(() =>
  import('@/pages/WorkoutStatsPage').then((m) => ({ default: m.WorkoutStatsPage }))
);

export function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <KeyboardShortcutsProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/calendar/google-callback" element={<GoogleCallbackPage />} />

            {/* Protected routes with MainLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits/today"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <HabitsTodayPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <HabitsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/habits/:id/stats"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <HabitStatsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <TasksPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CalendarPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <CategoriesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AccountsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounts/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AccountDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/recurring-expenses"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RecurringExpensesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monthly-expenses"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <MonthlyExpensesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercises"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExercisesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RoutinesPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RoutineDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/routines/:id/edit"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <RoutineFormPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/execute/:routineId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExecuteRoutinePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <WorkoutHistoryPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workouts/:id"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <WorkoutDetailPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <WorkoutStatsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </KeyboardShortcutsProvider>
    </BrowserRouter>
  );
}

/**
 * Tab Navigator
 * Sprint 1 - Authentication System
 *
 * Bottom tabs for authenticated users
 */

import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import { HomeScreen } from '../screens/HomeScreen';
import { HabitsListScreenWrapper } from '../screens/HabitsListScreenWrapper';
import { HabitosDiariosScreen } from '../screens/HabitosDiariosScreen';
import { HabitFormScreenWrapper } from '../screens/HabitFormScreenWrapper';
import { HabitDetailScreenWrapper } from '../screens/HabitDetailScreenWrapper';
import { HabitStatsScreen } from '../screens/HabitStatsScreen';
import { HabitAuditScreenWrapper } from '../screens/HabitAuditScreenWrapper';
import { TareasScreen } from '../screens/TareasScreen';
import { CreateTaskScreen } from '../screens/CreateTaskScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { ExercisesScreen } from '../screens/ExercisesScreen';
import { RoutinesScreen } from '../screens/RoutinesScreen';
import { RoutineDetailScreen } from '../screens/RoutineDetailScreen';
import { RoutineFormScreen } from '../screens/RoutineFormScreen';
import { ExecuteRoutineScreen } from '../screens/ExecuteRoutineScreen';
import { WorkoutHistoryScreen } from '../screens/WorkoutHistoryScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ResourcesScreen } from '../screens/ResourcesScreen';
import { CreateResourceScreen } from '../screens/CreateResourceScreen';
import { ResourceDetailScreen } from '../screens/ResourceDetailScreen';
// Settings screen - Sprint 3
import { SettingsScreen } from '../screens/SettingsScreen';
// Calendar screens - Sprint 4
import { CalendarScreen } from '../screens/CalendarScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { EditEventScreen } from '../screens/EditEventScreen';
// Finance screens - Sprint 2
import { FinanceHomeScreen } from '../screens/FinanceHomeScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AccountDetailScreen } from '../screens/AccountDetailScreen';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { CreateTransactionScreen } from '../screens/CreateTransactionScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { RecurringExpensesScreen } from '../screens/RecurringExpensesScreen';
import { CreateRecurringExpenseScreen } from '../screens/CreateRecurringExpenseScreen';
import { MonthlyExpensesScreen } from '../screens/MonthlyExpensesScreen';
import { PayExpenseScreen } from '../screens/PayExpenseScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const HabitsStack = createNativeStackNavigator();
const TasksStack = createNativeStackNavigator();
const FinanceStack = createNativeStackNavigator();
const MoreStack = createNativeStackNavigator();

// Home Stack
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="Dashboard"
      component={HomeScreen}
      options={{ title: 'Horus', headerShown: false }}
    />
  </HomeStack.Navigator>
);

// Habits Stack
const HabitsStackNavigator = () => (
  <HabitsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <HabitsStack.Screen
      name="HabitsList"
      component={HabitsListScreenWrapper}
      options={{ title: 'Mis Hábitos' }}
    />
    <HabitsStack.Screen
      name="HabitosHoy"
      component={HabitosDiariosScreen}
      options={{ title: 'Hábitos de Hoy' }}
    />
    <HabitsStack.Screen
      name="HabitForm"
      component={HabitFormScreenWrapper}
      options={{ title: 'Hábito', presentation: 'modal' }}
    />
    <HabitsStack.Screen
      name="HabitDetail"
      component={HabitDetailScreenWrapper}
      options={{ title: 'Detalle del Hábito' }}
    />
    <HabitsStack.Screen
      name="HabitStats"
      component={HabitStatsScreen}
      options={{ title: 'Estadísticas' }}
    />
    <HabitsStack.Screen
      name="HabitAudit"
      component={HabitAuditScreenWrapper}
      options={{ title: 'Historial de Cambios' }}
    />
  </HabitsStack.Navigator>
);

// Tasks Stack
const TasksStackNavigator = () => (
  <TasksStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <TasksStack.Screen name="TasksList" component={TareasScreen} options={{ title: 'Tareas' }} />
    <TasksStack.Screen
      name="CreateTask"
      component={CreateTaskScreen}
      options={{ title: 'Nueva Tarea', presentation: 'modal' }}
    />
    <TasksStack.Screen
      name="TaskDetail"
      component={TaskDetailScreen}
      options={{ title: 'Detalle de Tarea' }}
    />
  </TasksStack.Navigator>
);

// Finance Stack - Sprint 2
const FinanceStackNavigator = () => (
  <FinanceStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#4F46E5' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <FinanceStack.Screen
      name="FinanceHome"
      component={FinanceHomeScreen}
      options={{ title: 'Finanzas', headerShown: false }}
    />
    <FinanceStack.Screen
      name="Accounts"
      component={AccountsScreen}
      options={{ title: 'Cuentas' }}
    />
    <FinanceStack.Screen
      name="AccountDetail"
      component={AccountDetailScreen}
      options={{ title: 'Detalle de Cuenta' }}
    />
    <FinanceStack.Screen
      name="CreateAccount"
      component={CreateAccountScreen}
      options={{ title: 'Nueva Cuenta', presentation: 'modal' }}
    />
    <FinanceStack.Screen
      name="Transactions"
      component={TransactionsScreen}
      options={{ title: 'Transacciones' }}
    />
    <FinanceStack.Screen
      name="CreateTransaction"
      component={CreateTransactionScreen}
      options={{ title: 'Nueva Transacción', presentation: 'modal' }}
    />
    <FinanceStack.Screen
      name="Transfer"
      component={TransferScreen}
      options={{ title: 'Transferir', presentation: 'modal' }}
    />
    <FinanceStack.Screen
      name="RecurringExpenses"
      component={RecurringExpensesScreen}
      options={{ title: 'Gastos Recurrentes' }}
    />
    <FinanceStack.Screen
      name="CreateRecurringExpense"
      component={CreateRecurringExpenseScreen}
      options={{ title: 'Nueva Plantilla', presentation: 'modal' }}
    />
    <FinanceStack.Screen
      name="MonthlyExpenses"
      component={MonthlyExpensesScreen}
      options={{ title: 'Gastos Mensuales' }}
    />
    <FinanceStack.Screen
      name="PayExpense"
      component={PayExpenseScreen}
      options={{ title: 'Pagar Gasto', presentation: 'modal' }}
    />
  </FinanceStack.Navigator>
);

// More Stack (Fitness, Resources, etc.)
const MoreStackNavigator = () => (
  <MoreStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2196F3' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <MoreStack.Screen name="MoreMenu" component={CategoriesScreen} options={{ title: 'Más' }} />
    <MoreStack.Screen
      name="Exercises"
      component={ExercisesScreen}
      options={{ title: 'Ejercicios' }}
    />
    <MoreStack.Screen name="Routines" component={RoutinesScreen} options={{ title: 'Rutinas' }} />
    <MoreStack.Screen
      name="RoutineDetail"
      component={RoutineDetailScreen}
      options={{ title: 'Detalle de Rutina' }}
    />
    <MoreStack.Screen
      name="RoutineForm"
      component={RoutineFormScreen}
      options={{ title: 'Crear/Editar Rutina', presentation: 'modal' }}
    />
    <MoreStack.Screen
      name="ExecuteRoutine"
      component={ExecuteRoutineScreen}
      options={{ title: 'Entrenar', headerShown: false }}
    />
    <MoreStack.Screen
      name="WorkoutHistory"
      component={WorkoutHistoryScreen}
      options={{ title: 'Historial' }}
    />
    <MoreStack.Screen
      name="WorkoutDetail"
      component={WorkoutDetailScreen}
      options={{ title: 'Detalle del Entrenamiento' }}
    />
    <MoreStack.Screen name="Stats" component={StatsScreen} options={{ title: 'Estadísticas' }} />
    <MoreStack.Screen
      name="Resources"
      component={ResourcesScreen}
      options={{ title: 'Conocimiento' }}
    />
    <MoreStack.Screen
      name="CreateResource"
      component={CreateResourceScreen}
      options={{ title: 'Nuevo Recurso', presentation: 'modal', headerShown: false }}
    />
    <MoreStack.Screen
      name="ResourceDetail"
      component={ResourceDetailScreen}
      options={{ title: 'Detalle del Recurso' }}
    />
    <MoreStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{ title: 'Configuración' }}
    />
    <MoreStack.Screen
      name="Calendar"
      component={CalendarScreen}
      options={{ title: 'Calendario' }}
    />
    <MoreStack.Screen
      name="CreateEvent"
      component={CreateEventScreen}
      options={{ title: 'Nuevo Evento', presentation: 'modal' }}
    />
    <MoreStack.Screen
      name="EditEvent"
      component={EditEventScreen}
      options={{ title: 'Editar Evento', presentation: 'modal' }}
    />
  </MoreStack.Navigator>
);

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'Inicio',
          tabBarIcon: () => <Text>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="HabitsTab"
        component={HabitsStackNavigator}
        options={{
          title: 'Hábitos',
          tabBarIcon: () => <Text>🎯</Text>,
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksStackNavigator}
        options={{
          title: 'Tareas',
          tabBarIcon: () => <Text>✅</Text>,
        }}
      />
      <Tab.Screen
        name="FinanceTab"
        component={FinanceStackNavigator}
        options={{
          title: 'Finanzas',
          tabBarIcon: () => <Text>💰</Text>,
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{
          title: 'Más',
          tabBarIcon: () => <Text>⚙️</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

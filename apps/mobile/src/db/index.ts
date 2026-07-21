import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';
import * as Crypto from 'expo-crypto';
import { schema } from './schema';
import { migrations } from './migrations';
import { Account } from './models/Account';
import { Category } from './models/Category';
import { Transaction } from './models/Transaction';
import { RecurringExpense } from './models/RecurringExpense';
import { MonthlyExpenseInstance } from './models/MonthlyExpenseInstance';
import { Budget } from './models/Budget';
import { SavingsGoal } from './models/SavingsGoal';
import { Habit } from './models/Habit';
import { HabitRecord } from './models/HabitRecord';
import { Task } from './models/Task';
import { TaskChecklistItem } from './models/TaskChecklistItem';
import { Goal } from './models/Goal';
import { KeyResult } from './models/KeyResult';
import { GoalHabit } from './models/GoalHabit';
import { GoalTask } from './models/GoalTask';
import { Event } from './models/Event';
import { Resource } from './models/Resource';
import { Food } from './models/Food';
import { Recipe } from './models/Recipe';
import { RecipeIngredient } from './models/RecipeIngredient';
import { MealPlan } from './models/MealPlan';
import { MealEntry } from './models/MealEntry';
import { MealEntryItem } from './models/MealEntryItem';
import { NutritionLog } from './models/NutritionLog';
import { NutritionLogItem } from './models/NutritionLogItem';
import { ShoppingList } from './models/ShoppingList';
import { ShoppingListItem } from './models/ShoppingListItem';
import { Exercise } from './models/Exercise';
import { Routine } from './models/Routine';
import { RoutineExercise } from './models/RoutineExercise';
import { Workout } from './models/Workout';
import { WorkoutExercise } from './models/WorkoutExercise';
import { WorkoutSet } from './models/WorkoutSet';

// IDs locales = UUID v4: el id generado en el cliente ES el id final en
// Postgres (el push crea con ese id, idempotente). El generador default de
// Watermelon (nanoid 16) no pasa las validaciones UUID del backend.
setGenerator(() => Crypto.randomUUID());

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  // jsi: true usa el adapter JSI nativo (rápido, síncrono). Validado en el
  // spike Fase 0 con New Arch OFF / Paper.
  jsi: true,
  onSetUpError: (error) => {
    // eslint-disable-next-line no-console
    console.error('[WatermelonDB] setup error', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    Account,
    Category,
    Transaction,
    RecurringExpense,
    MonthlyExpenseInstance,
    Budget,
    SavingsGoal,
    Habit,
    HabitRecord,
    Task,
    TaskChecklistItem,
    Goal,
    KeyResult,
    GoalHabit,
    GoalTask,
    Event,
    Resource,
    Food,
    Recipe,
    RecipeIngredient,
    MealPlan,
    MealEntry,
    MealEntryItem,
    NutritionLog,
    NutritionLogItem,
    ShoppingList,
    ShoppingListItem,
    Exercise,
    Routine,
    RoutineExercise,
    Workout,
    WorkoutExercise,
    WorkoutSet,
  ],
});

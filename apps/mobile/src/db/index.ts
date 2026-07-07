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
  ],
});

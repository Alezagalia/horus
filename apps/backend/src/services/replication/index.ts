/**
 * Replicación offline-first (WatermelonDB `synchronize()`) — Fase 1: dominio
 * Dinero completo (accounts, categories [scopes de dinero], transactions,
 * recurring_expenses, monthly_expense_instances, budgets, savings_goals).
 * Fase 2: Hábitos (habits, habit_records), Tareas (tasks,
 * task_checklist_items), Metas (goals, key_results, goal_habits, goal_tasks)
 * y Eventos (events), más las categories de sus scopes. Fase 3: Recursos
 * (resources). Fase 4: Nutrición (foods, recipes, recipe_ingredients,
 * meal_plans, meal_entries, meal_entry_items, nutrition_logs,
 * nutrition_log_items, shopping_lists, shopping_list_items) y Fitness
 * (exercises, routines, routine_exercises, workouts, workout_exercises,
 * workout_sets).
 *
 * Contrato:
 *  - pull: { changes: { <tabla>: { created, updated, deleted } }, timestamp }
 *    (filas del userId con updatedAt > lastPulledAt; deleted = tombstones;
 *    snake_case; timestamps en ms). Si lastPulledAt es anterior al horizonte
 *    de retención de tombstones → { fullResyncRequired: true }.
 *  - push: aplica el batch completo en UNA transacción Prisma, idempotente por
 *    id de cliente, manteniendo las invariantes de dominio (saldos derivados,
 *    pares de transferencia, claim de pago mensual). Conflictos: LWW client-
 *    wins; excepciones: tombstone gana, claim gana.
 *
 * (Distinto de `/api/sync`, que es el sync de Google Calendar.)
 */

import { prisma } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import { createPushContext } from './push-context.js';
import { TOMBSTONE_RETENTION_DAYS } from './tombstone.service.js';
import { FullResyncResult, PullResult, PushChanges, TableChanges } from './types.js';
import * as accounts from './tables/account.replication.js';
import * as categories from './tables/category.replication.js';
import * as transactions from './tables/transaction.replication.js';
import * as recurringExpenses from './tables/recurringExpense.replication.js';
import * as monthlyExpenseInstances from './tables/monthlyExpenseInstance.replication.js';
import * as budgets from './tables/budget.replication.js';
import * as savingsGoals from './tables/savingsGoal.replication.js';
import * as habits from './tables/habit.replication.js';
import * as habitRecords from './tables/habitRecord.replication.js';
import * as tasks from './tables/task.replication.js';
import * as taskChecklistItems from './tables/taskChecklistItem.replication.js';
import * as goals from './tables/goal.replication.js';
import * as keyResults from './tables/keyResult.replication.js';
import * as goalLinks from './tables/goalLink.replication.js';
import * as events from './tables/event.replication.js';
import * as resources from './tables/resource.replication.js';
import * as foods from './tables/food.replication.js';
import * as recipes from './tables/recipe.replication.js';
import * as mealPlans from './tables/mealPlan.replication.js';
import * as nutritionLogs from './tables/nutritionLog.replication.js';
import * as shoppingLists from './tables/shoppingList.replication.js';
import * as exercises from './tables/exercise.replication.js';
import * as routines from './tables/routine.replication.js';
import * as workouts from './tables/workout.replication.js';

/** Límite de sanidad por tabla en el pull: con usuarios chicos no debería
 * alcanzarse nunca; si se alcanza, hay que implementar paginación. */
const PULL_SANITY_LIMIT = 10_000;

function splitByCreated<TModel extends { createdAt: Date }, TRaw>(
  rows: TModel[],
  lastPulledAt: number,
  toRaw: (row: TModel) => TRaw,
  deleted: string[]
): TableChanges<TRaw> {
  const created: TRaw[] = [];
  const updated: TRaw[] = [];
  for (const row of rows) {
    if (row.createdAt.getTime() > lastPulledAt) created.push(toRaw(row));
    else updated.push(toRaw(row));
  }
  return { created, updated, deleted };
}

export const replicationService = {
  /**
   * @param fullTables Tablas que el cliente pide COMPLETAS ignorando su
   * lastPulledAt: es el soporte de migración de Watermelon — cuando una
   * migración de schema agrega una tabla nueva, el cliente ya tiene un
   * lastPulledAt viejo y el pull incremental jamás le traería las filas
   * históricas de esa tabla.
   */
  async pull(
    userId: string,
    lastPulledAt: number,
    fullTables: string[] = []
  ): Promise<PullResult | FullResyncResult> {
    // Capturado ANTES de las queries: lo que se modifique mientras corre el pull
    // se re-entrega en el próximo (updated es idempotente en Watermelon).
    const timestamp = Date.now();

    // Cliente dormido más que la retención de tombstones: pudo perderse deletes
    // ya purgados → debe resetear su copia local y pullear desde 0.
    const retentionHorizon = timestamp - TOMBSTONE_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    if (lastPulledAt > 0 && lastPulledAt < retentionHorizon) {
      return { fullResyncRequired: true, timestamp };
    }

    const since = new Date(lastPulledAt || 0);
    const changedWhere = { userId, updatedAt: { gt: since } };
    // Para las tablas en fullTables el pull es desde 0 (todas las filas van
    // como `created`, upsert idempotente en Watermelon).
    const sinceMsFor = (table: string): number => (fullTables.includes(table) ? 0 : lastPulledAt);
    const whereFor = (table: string) => (fullTables.includes(table) ? { userId } : changedWhere);

    const [
      accountRows,
      categoryRows,
      transactionRows,
      recurringRows,
      instanceRows,
      budgetRows,
      goalRows,
      habitRows,
      habitRecordRows,
      taskRows,
      checklistItemRows,
      goalRowsRepl,
      keyResultRows,
      goalHabitRows,
      goalTaskRows,
      eventRows,
      resourceRows,
      foodRows,
      recipeRows,
      recipeIngredientRows,
      mealPlanRows,
      mealEntryRows,
      mealEntryItemRows,
      nutritionLogRows,
      nutritionLogItemRows,
      shoppingListRows,
      shoppingListItemRows,
      exerciseRows,
      routineRows,
      routineExerciseRows,
      workoutRows,
      workoutExerciseRows,
      workoutSetRows,
      tombstones,
    ] = await Promise.all([
      prisma.account.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.category.findMany({
        where: { ...whereFor('categories'), scope: { in: categories.REPLICATED_SCOPES } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.transaction.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.recurringExpense.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.monthlyExpenseInstance.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.budget.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.savingsGoal.findMany({ where: changedWhere, take: PULL_SANITY_LIMIT }),
      prisma.habit.findMany({ where: whereFor('habits'), take: PULL_SANITY_LIMIT }),
      prisma.habitRecord.findMany({ where: whereFor('habit_records'), take: PULL_SANITY_LIMIT }),
      prisma.task.findMany({ where: whereFor('tasks'), take: PULL_SANITY_LIMIT }),
      // El item no tiene userId propio: se filtra vía su task
      prisma.taskChecklistItem.findMany({
        where: fullTables.includes('task_checklist_items')
          ? { task: { userId } }
          : { task: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.goal.findMany({ where: whereFor('goals'), take: PULL_SANITY_LIMIT }),
      // KR/links no tienen userId propio: se filtran vía su goal
      prisma.keyResult.findMany({
        where: fullTables.includes('key_results')
          ? { goal: { userId } }
          : { goal: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      // Sin updatedAt en Prisma: van COMPLETOS en cada pull (pocas filas,
      // upsert idempotente); p.ej. un cambio de krId no bumpea nada.
      prisma.goalHabit.findMany({ where: { goal: { userId } }, take: PULL_SANITY_LIMIT }),
      prisma.goalTask.findMany({ where: { goal: { userId } }, take: PULL_SANITY_LIMIT }),
      prisma.event.findMany({ where: whereFor('events'), take: PULL_SANITY_LIMIT }),
      prisma.resource.findMany({ where: whereFor('resources'), take: PULL_SANITY_LIMIT }),
      prisma.food.findMany({ where: whereFor('foods'), take: PULL_SANITY_LIMIT }),
      prisma.recipe.findMany({ where: whereFor('recipes'), take: PULL_SANITY_LIMIT }),
      // Los hijos de nutrición/fitness no tienen userId propio: se filtran vía su padre
      prisma.recipeIngredient.findMany({
        where: fullTables.includes('recipe_ingredients')
          ? { recipe: { userId } }
          : { recipe: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.mealPlan.findMany({ where: whereFor('meal_plans'), take: PULL_SANITY_LIMIT }),
      prisma.mealEntry.findMany({
        where: fullTables.includes('meal_entries')
          ? { mealPlan: { userId } }
          : { mealPlan: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.mealEntryItem.findMany({
        where: fullTables.includes('meal_entry_items')
          ? { mealEntry: { mealPlan: { userId } } }
          : { mealEntry: { mealPlan: { userId } }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.nutritionLog.findMany({ where: whereFor('nutrition_logs'), take: PULL_SANITY_LIMIT }),
      prisma.nutritionLogItem.findMany({
        where: fullTables.includes('nutrition_log_items')
          ? { nutritionLog: { userId } }
          : { nutritionLog: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.shoppingList.findMany({ where: whereFor('shopping_lists'), take: PULL_SANITY_LIMIT }),
      prisma.shoppingListItem.findMany({
        where: fullTables.includes('shopping_list_items')
          ? { shoppingList: { userId } }
          : { shoppingList: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.exercise.findMany({ where: whereFor('exercises'), take: PULL_SANITY_LIMIT }),
      prisma.routine.findMany({ where: whereFor('routines'), take: PULL_SANITY_LIMIT }),
      prisma.routineExercise.findMany({
        where: fullTables.includes('routine_exercises')
          ? { routine: { userId } }
          : { routine: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.workout.findMany({ where: whereFor('workouts'), take: PULL_SANITY_LIMIT }),
      prisma.workoutExercise.findMany({
        where: fullTables.includes('workout_exercises')
          ? { workout: { userId } }
          : { workout: { userId }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.workoutSet.findMany({
        where: fullTables.includes('workout_sets')
          ? { workoutExercise: { workout: { userId } } }
          : { workoutExercise: { workout: { userId } }, updatedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
      prisma.replicationTombstone.findMany({
        where: { userId, deletedAt: { gt: since } },
        take: PULL_SANITY_LIMIT,
      }),
    ]);

    const rowCount =
      accountRows.length +
      categoryRows.length +
      transactionRows.length +
      recurringRows.length +
      instanceRows.length +
      budgetRows.length +
      goalRows.length +
      habitRows.length +
      habitRecordRows.length +
      taskRows.length +
      checklistItemRows.length +
      goalRowsRepl.length +
      keyResultRows.length +
      goalHabitRows.length +
      goalTaskRows.length +
      eventRows.length +
      resourceRows.length +
      foodRows.length +
      recipeRows.length +
      recipeIngredientRows.length +
      mealPlanRows.length +
      mealEntryRows.length +
      mealEntryItemRows.length +
      nutritionLogRows.length +
      nutritionLogItemRows.length +
      shoppingListRows.length +
      shoppingListItemRows.length +
      exerciseRows.length +
      routineRows.length +
      routineExerciseRows.length +
      workoutRows.length +
      workoutExerciseRows.length +
      workoutSetRows.length;
    if (rowCount >= PULL_SANITY_LIMIT) {
      logger.warn(
        `[replication] pull de ${rowCount} filas para user ${userId}: evaluar paginación`
      );
    }

    const deletedByTable = new Map<string, string[]>();
    for (const t of tombstones) {
      const list = deletedByTable.get(t.tableName) ?? [];
      list.push(t.rowId);
      deletedByTable.set(t.tableName, list);
    }
    const deletedFor = (table: string): string[] => deletedByTable.get(table) ?? [];

    return {
      changes: {
        accounts: splitByCreated(accountRows, lastPulledAt, accounts.toRaw, deletedFor('accounts')),
        categories: splitByCreated(
          categoryRows,
          sinceMsFor('categories'),
          categories.toRaw,
          deletedFor('categories')
        ),
        transactions: splitByCreated(
          transactionRows,
          lastPulledAt,
          transactions.toRaw,
          deletedFor('transactions')
        ),
        recurring_expenses: splitByCreated(
          recurringRows,
          lastPulledAt,
          recurringExpenses.toRaw,
          deletedFor('recurring_expenses')
        ),
        monthly_expense_instances: splitByCreated(
          instanceRows,
          lastPulledAt,
          monthlyExpenseInstances.toRaw,
          deletedFor('monthly_expense_instances')
        ),
        budgets: splitByCreated(budgetRows, lastPulledAt, budgets.toRaw, deletedFor('budgets')),
        savings_goals: splitByCreated(
          goalRows,
          lastPulledAt,
          savingsGoals.toRaw,
          deletedFor('savings_goals')
        ),
        habits: splitByCreated(habitRows, sinceMsFor('habits'), habits.toRaw, deletedFor('habits')),
        habit_records: splitByCreated(
          habitRecordRows,
          sinceMsFor('habit_records'),
          habitRecords.toRaw,
          deletedFor('habit_records')
        ),
        tasks: splitByCreated(taskRows, sinceMsFor('tasks'), tasks.toRaw, deletedFor('tasks')),
        task_checklist_items: splitByCreated(
          checklistItemRows,
          sinceMsFor('task_checklist_items'),
          taskChecklistItems.toRaw,
          deletedFor('task_checklist_items')
        ),
        goals: splitByCreated(goalRowsRepl, sinceMsFor('goals'), goals.toRaw, deletedFor('goals')),
        key_results: splitByCreated(
          keyResultRows,
          sinceMsFor('key_results'),
          keyResults.toRaw,
          deletedFor('key_results')
        ),
        goal_habits: splitByCreated(
          goalHabitRows,
          lastPulledAt,
          goalLinks.goalHabitToRaw,
          deletedFor('goal_habits')
        ),
        goal_tasks: splitByCreated(
          goalTaskRows,
          lastPulledAt,
          goalLinks.goalTaskToRaw,
          deletedFor('goal_tasks')
        ),
        events: splitByCreated(eventRows, sinceMsFor('events'), events.toRaw, deletedFor('events')),
        resources: splitByCreated(
          resourceRows,
          sinceMsFor('resources'),
          resources.toRaw,
          deletedFor('resources')
        ),
        foods: splitByCreated(foodRows, sinceMsFor('foods'), foods.toRaw, deletedFor('foods')),
        recipes: splitByCreated(
          recipeRows,
          sinceMsFor('recipes'),
          recipes.toRaw,
          deletedFor('recipes')
        ),
        recipe_ingredients: splitByCreated(
          recipeIngredientRows,
          sinceMsFor('recipe_ingredients'),
          recipes.ingredientToRaw,
          deletedFor('recipe_ingredients')
        ),
        meal_plans: splitByCreated(
          mealPlanRows,
          sinceMsFor('meal_plans'),
          mealPlans.toRaw,
          deletedFor('meal_plans')
        ),
        meal_entries: splitByCreated(
          mealEntryRows,
          sinceMsFor('meal_entries'),
          mealPlans.entryToRaw,
          deletedFor('meal_entries')
        ),
        meal_entry_items: splitByCreated(
          mealEntryItemRows,
          sinceMsFor('meal_entry_items'),
          mealPlans.itemToRaw,
          deletedFor('meal_entry_items')
        ),
        nutrition_logs: splitByCreated(
          nutritionLogRows,
          sinceMsFor('nutrition_logs'),
          nutritionLogs.toRaw,
          deletedFor('nutrition_logs')
        ),
        nutrition_log_items: splitByCreated(
          nutritionLogItemRows,
          sinceMsFor('nutrition_log_items'),
          nutritionLogs.itemToRaw,
          deletedFor('nutrition_log_items')
        ),
        shopping_lists: splitByCreated(
          shoppingListRows,
          sinceMsFor('shopping_lists'),
          shoppingLists.toRaw,
          deletedFor('shopping_lists')
        ),
        shopping_list_items: splitByCreated(
          shoppingListItemRows,
          sinceMsFor('shopping_list_items'),
          shoppingLists.itemToRaw,
          deletedFor('shopping_list_items')
        ),
        exercises: splitByCreated(
          exerciseRows,
          sinceMsFor('exercises'),
          exercises.toRaw,
          deletedFor('exercises')
        ),
        routines: splitByCreated(
          routineRows,
          sinceMsFor('routines'),
          routines.toRaw,
          deletedFor('routines')
        ),
        routine_exercises: splitByCreated(
          routineExerciseRows,
          sinceMsFor('routine_exercises'),
          routines.exerciseToRaw,
          deletedFor('routine_exercises')
        ),
        workouts: splitByCreated(
          workoutRows,
          sinceMsFor('workouts'),
          workouts.toRaw,
          deletedFor('workouts')
        ),
        workout_exercises: splitByCreated(
          workoutExerciseRows,
          sinceMsFor('workout_exercises'),
          workouts.exerciseToRaw,
          deletedFor('workout_exercises')
        ),
        workout_sets: splitByCreated(
          workoutSetRows,
          sinceMsFor('workout_sets'),
          workouts.setToRaw,
          deletedFor('workout_sets')
        ),
      },
      timestamp,
    };
  },

  async push(userId: string, changes: PushChanges, lastPulledAt: number = 0): Promise<void> {
    // Resumen de lo recibido por tabla — sin esto los pushes son invisibles
    // en prod y los descartes silenciosos (p.ej. categoría inválida) indebuggeables
    const summary = Object.entries(changes)
      .map(([table, c]) => {
        const n = (c?.created?.length ?? 0) + (c?.updated?.length ?? 0) + (c?.deleted?.length ?? 0);
        return n > 0 ? `${table}:${n}` : null;
      })
      .filter(Boolean)
      .join(' ');
    logger.info(`[replication] push user=${userId.slice(0, 8)} ${summary || '(vacío)'}`);

    // Side-effects externos (Google Calendar) que los handlers encolan durante
    // el tx y se ejecutan best-effort después del commit.
    let postCommit: Array<() => Promise<void>> = [];

    await prisma.$transaction(async (tx) => {
      const ctx = createPushContext(tx, userId, lastPulledAt);
      postCommit = ctx.postCommit;

      // Orden por FKs: cuentas y categorías primero; deletes de transactions
      // ANTES que sus creates/updates (revertir saldos primero).
      await accounts.applyCreated(ctx, changes.accounts?.created ?? []);
      await accounts.applyUpdated(ctx, changes.accounts?.updated ?? []);

      await categories.applyCreated(ctx, changes.categories?.created ?? []);
      await categories.applyUpdated(ctx, changes.categories?.updated ?? []);

      await recurringExpenses.applyCreated(ctx, changes.recurring_expenses?.created ?? []);
      await recurringExpenses.applyUpdated(ctx, changes.recurring_expenses?.updated ?? []);

      await budgets.applyCreated(ctx, changes.budgets?.created ?? []);
      await budgets.applyUpdated(ctx, changes.budgets?.updated ?? []);

      await savingsGoals.applyCreated(ctx, changes.savings_goals?.created ?? []);
      await savingsGoals.applyUpdated(ctx, changes.savings_goals?.updated ?? []);

      // Claims de pago antes que las transactions (pobla skippedInstanceIds)
      await monthlyExpenseInstances.applyCreated(
        ctx,
        changes.monthly_expense_instances?.created ?? []
      );
      await monthlyExpenseInstances.applyUpdated(
        ctx,
        changes.monthly_expense_instances?.updated ?? []
      );

      await transactions.applyDeleted(ctx, changes.transactions?.deleted ?? []);
      await transactions.applyCreated(ctx, changes.transactions?.created ?? []);
      await transactions.applyUpdated(ctx, changes.transactions?.updated ?? []);

      // Hábitos: primero los habits (FK de los records), después los records;
      // al final UN recalc de racha por hábito afectado (server autoritativo).
      await habits.applyCreated(ctx, changes.habits?.created ?? []);
      await habits.applyUpdated(ctx, changes.habits?.updated ?? []);

      const affectedA = await habitRecords.applyCreated(ctx, changes.habit_records?.created ?? []);
      const affectedB = await habitRecords.applyUpdated(ctx, changes.habit_records?.updated ?? []);
      for (const habitId of new Set([...affectedA, ...affectedB])) {
        await habitRecords.recalcStreak(ctx, habitId);
      }

      // Tareas: deletes primero (tombstone gana sobre creates degradados),
      // después la task (FK del checklist) y al final sus items.
      await tasks.applyDeleted(ctx, changes.tasks?.deleted ?? []);
      await tasks.applyCreated(ctx, changes.tasks?.created ?? []);
      await tasks.applyUpdated(ctx, changes.tasks?.updated ?? []);

      await taskChecklistItems.applyDeleted(ctx, changes.task_checklist_items?.deleted ?? []);
      await taskChecklistItems.applyCreated(ctx, changes.task_checklist_items?.created ?? []);
      await taskChecklistItems.applyUpdated(ctx, changes.task_checklist_items?.updated ?? []);

      // Metas: goal (FK de KRs/links) → KRs → links (FK a habit/task/kr)
      await goals.applyCreated(ctx, changes.goals?.created ?? []);
      await goals.applyUpdated(ctx, changes.goals?.updated ?? []);
      goals.warnOnDeleted(changes.goals?.deleted ?? []);

      await keyResults.applyCreated(ctx, changes.key_results?.created ?? []);
      await keyResults.applyUpdated(ctx, changes.key_results?.updated ?? []);

      await goalLinks.deleteGoalHabits(ctx, changes.goal_habits?.deleted ?? []);
      await goalLinks.applyGoalHabits(ctx, [
        ...(changes.goal_habits?.created ?? []),
        ...(changes.goal_habits?.updated ?? []),
      ]);
      await goalLinks.deleteGoalTasks(ctx, changes.goal_tasks?.deleted ?? []);
      await goalLinks.applyGoalTasks(ctx, [
        ...(changes.goal_tasks?.created ?? []),
        ...(changes.goal_tasks?.updated ?? []),
      ]);

      // Eventos: deletes primero (tombstone gana), luego creates/updates
      await events.applyDeleted(ctx, changes.events?.deleted ?? []);
      await events.applyCreated(ctx, changes.events?.created ?? []);
      await events.applyUpdated(ctx, changes.events?.updated ?? []);

      await resources.applyDeleted(ctx, changes.resources?.deleted ?? []);
      await resources.applyCreated(ctx, changes.resources?.created ?? []);
      await resources.applyUpdated(ctx, changes.resources?.updated ?? []);

      // Nutrición: foods primero (FK de ingredientes/items). Los creates que
      // colisionan por clave única (nombre, semana, fecha) se fusionan y el
      // remap corrige las referencias de los hijos de este mismo push.
      const foodRemap = await foods.applyCreated(ctx, changes.foods?.created ?? []);
      await foods.applyUpdated(ctx, changes.foods?.updated ?? []);

      await recipes.applyCreated(ctx, changes.recipes?.created ?? []);
      await recipes.applyUpdated(ctx, changes.recipes?.updated ?? []);
      await recipes.deleteIngredients(ctx, changes.recipe_ingredients?.deleted ?? []);
      await recipes.applyIngredients(
        ctx,
        [
          ...(changes.recipe_ingredients?.created ?? []),
          ...(changes.recipe_ingredients?.updated ?? []),
        ],
        foodRemap
      );

      // Planes de comida: deletes primero (tombstone gana), plan → entries → items
      await mealPlans.applyDeleted(ctx, changes.meal_plans?.deleted ?? []);
      const planRemap = await mealPlans.applyCreated(ctx, changes.meal_plans?.created ?? []);
      await mealPlans.applyUpdated(ctx, changes.meal_plans?.updated ?? []);

      await mealPlans.deleteEntries(ctx, changes.meal_entries?.deleted ?? []);
      await mealPlans.applyEntries(
        ctx,
        [...(changes.meal_entries?.created ?? []), ...(changes.meal_entries?.updated ?? [])],
        planRemap
      );
      await mealPlans.deleteEntryItems(ctx, changes.meal_entry_items?.deleted ?? []);
      await mealPlans.applyEntryItems(
        ctx,
        [
          ...(changes.meal_entry_items?.created ?? []),
          ...(changes.meal_entry_items?.updated ?? []),
        ],
        foodRemap
      );

      await nutritionLogs.applyDeleted(ctx, changes.nutrition_logs?.deleted ?? []);
      const logRemap = await nutritionLogs.applyCreated(ctx, changes.nutrition_logs?.created ?? []);
      await nutritionLogs.applyUpdated(ctx, changes.nutrition_logs?.updated ?? []);

      await nutritionLogs.deleteItems(ctx, changes.nutrition_log_items?.deleted ?? []);
      await nutritionLogs.applyItems(
        ctx,
        [
          ...(changes.nutrition_log_items?.created ?? []),
          ...(changes.nutrition_log_items?.updated ?? []),
        ],
        logRemap,
        foodRemap
      );

      // Listas de compras después de transactions (transaction_id) y meal plans
      await shoppingLists.applyDeleted(ctx, changes.shopping_lists?.deleted ?? []);
      await shoppingLists.applyCreated(ctx, changes.shopping_lists?.created ?? [], planRemap);
      await shoppingLists.applyUpdated(ctx, changes.shopping_lists?.updated ?? [], planRemap);

      await shoppingLists.deleteItems(ctx, changes.shopping_list_items?.deleted ?? []);
      await shoppingLists.applyItems(
        ctx,
        [
          ...(changes.shopping_list_items?.created ?? []),
          ...(changes.shopping_list_items?.updated ?? []),
        ],
        foodRemap
      );

      // Fitness: exercises primero (FK de rutinas/workouts); sus deletes al
      // FINAL (los deletes de rutinas/workouts pueden liberar referencias).
      const exerciseRemap = await exercises.applyCreated(ctx, changes.exercises?.created ?? []);
      await exercises.applyUpdated(ctx, changes.exercises?.updated ?? []);

      await routines.applyDeleted(ctx, changes.routines?.deleted ?? []);
      await routines.applyCreated(ctx, changes.routines?.created ?? []);
      await routines.applyUpdated(ctx, changes.routines?.updated ?? []);

      await routines.deleteExercises(ctx, changes.routine_exercises?.deleted ?? []);
      await routines.applyExercises(
        ctx,
        [
          ...(changes.routine_exercises?.created ?? []),
          ...(changes.routine_exercises?.updated ?? []),
        ],
        exerciseRemap
      );

      // Workouts: workout → workout_exercises → sets, deletes primero en cada nivel
      await workouts.applyDeleted(ctx, changes.workouts?.deleted ?? []);
      await workouts.applyCreated(ctx, changes.workouts?.created ?? []);
      await workouts.applyUpdated(ctx, changes.workouts?.updated ?? []);

      await workouts.deleteExercises(ctx, changes.workout_exercises?.deleted ?? []);
      await workouts.applyExercises(
        ctx,
        [
          ...(changes.workout_exercises?.created ?? []),
          ...(changes.workout_exercises?.updated ?? []),
        ],
        exerciseRemap
      );

      await workouts.deleteSets(ctx, changes.workout_sets?.deleted ?? []);
      await workouts.applySets(ctx, [
        ...(changes.workout_sets?.created ?? []),
        ...(changes.workout_sets?.updated ?? []),
      ]);

      await exercises.applyDeleted(ctx, changes.exercises?.deleted ?? []);

      // deleted de tablas soft-delete no debería llegar
      for (const table of [
        'accounts',
        'categories',
        'recurring_expenses',
        'budgets',
        'savings_goals',
        'habits',
        'habit_records',
        'key_results',
        'foods',
        'recipes',
      ] as const) {
        const deleted = changes[table]?.deleted ?? [];
        if (deleted.length > 0) {
          logger.warn(
            `[replication] deleted de ${table} ignorado (soft delete via is_active): ${deleted.join(',')}`
          );
        }
      }
    });

    // Fuera del tx: llamadas a Google Calendar (best-effort, errores logueados)
    for (const effect of postCommit) {
      await effect();
    }
  },
};

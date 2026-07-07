import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Goal as GoalModel } from './models/Goal';
import { KeyResult as KeyResultModel } from './models/KeyResult';
import { GoalHabit as GoalHabitModel } from './models/GoalHabit';
import { GoalTask as GoalTaskModel } from './models/GoalTask';
import { Habit as HabitModel } from './models/Habit';
import { Task as TaskModel } from './models/Task';
import { Category as CategoryModel } from './models/Category';
import type {
  GoalWithProgress,
  GoalLinkedHabit,
  GoalLinkedTask,
  KeyResult,
  GoalPriority,
  GoalStatus,
} from '@horus/shared';

/**
 * Lecturas locales del dominio Metas (offline-first Fase 2c). Devuelve
 * GoalWithProgress con el MISMO cálculo de progreso que goal.service.ts:
 * promedio de KRs activos (capped 100%) o, sin KRs, ratio de tareas
 * vinculadas completadas.
 */

const goals = () => database.get<GoalModel>('goals');
const keyResults = () => database.get<KeyResultModel>('key_results');
const goalHabits = () => database.get<GoalHabitModel>('goal_habits');
const goalTasks = () => database.get<GoalTaskModel>('goal_tasks');
const habits = () => database.get<HabitModel>('habits');
const tasks = () => database.get<TaskModel>('tasks');
const categories = () => database.get<CategoryModel>('categories');

function calculateProgress(
  krs: Array<{ targetValue: number; currentValue: number }>,
  linkedTaskStatuses: string[]
): number {
  if (krs.length > 0) {
    const avg =
      krs.reduce((sum, kr) => {
        return sum + (kr.targetValue > 0 ? Math.min(kr.currentValue / kr.targetValue, 1) : 0);
      }, 0) / krs.length;
    return Math.round(avg * 100);
  }
  if (linkedTaskStatuses.length > 0) {
    const done = linkedTaskStatuses.filter((s) => s === 'completada').length;
    return Math.round((done / linkedTaskStatuses.length) * 100);
  }
  return 0;
}

interface GoalContext {
  krsByGoal: Map<string, KeyResultModel[]>;
  habitLinksByGoal: Map<string, GoalHabitModel[]>;
  taskLinksByGoal: Map<string, GoalTaskModel[]>;
  habitById: Map<string, HabitModel>;
  taskById: Map<string, TaskModel>;
  categoryById: Map<string, CategoryModel>;
}

async function loadContext(): Promise<GoalContext> {
  const [krRows, habitLinkRows, taskLinkRows, habitRows, taskRows, categoryRows] =
    await Promise.all([
      keyResults().query(Q.where('is_active', true)).fetch(),
      goalHabits().query().fetch(),
      goalTasks().query().fetch(),
      habits().query().fetch(),
      tasks().query().fetch(),
      categories().query().fetch(),
    ]);

  const groupBy = <T extends { goalId: string }>(rows: T[]): Map<string, T[]> => {
    const map = new Map<string, T[]>();
    for (const row of rows) {
      (map.get(row.goalId) ?? map.set(row.goalId, []).get(row.goalId)!).push(row);
    }
    return map;
  };

  return {
    krsByGoal: groupBy(krRows),
    habitLinksByGoal: groupBy(habitLinkRows),
    taskLinksByGoal: groupBy(taskLinkRows),
    habitById: new Map(habitRows.map((h) => [h.id, h])),
    taskById: new Map(taskRows.map((t) => [t.id, t])),
    categoryById: new Map(categoryRows.map((c) => [c.id, c])),
  };
}

function toGoalWithProgress(g: GoalModel, ctx: GoalContext): GoalWithProgress {
  const krs = (ctx.krsByGoal.get(g.id) ?? []).sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  const habitLinks = ctx.habitLinksByGoal.get(g.id) ?? [];
  const taskLinks = ctx.taskLinksByGoal.get(g.id) ?? [];
  const category = g.categoryId ? ctx.categoryById.get(g.categoryId) : undefined;

  const goalHabitsOut: GoalLinkedHabit[] = habitLinks
    .filter((l) => ctx.habitById.has(l.habitId))
    .map((l) => {
      const habit = ctx.habitById.get(l.habitId)!;
      return {
        habitId: l.habitId,
        krId: l.krId ?? null,
        habit: {
          id: habit.id,
          name: habit.name,
          type: habit.type,
          color: habit.color ?? null,
          lastCompletedDate: habit.lastCompletedDate ? habit.lastCompletedDate.toISOString() : null,
        },
      };
    });

  const goalTasksOut: GoalLinkedTask[] = taskLinks
    .filter((l) => ctx.taskById.has(l.taskId))
    .map((l) => {
      const task = ctx.taskById.get(l.taskId)!;
      return {
        taskId: l.taskId,
        task: {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        },
      };
    });

  return {
    id: g.id,
    userId: '',
    categoryId: g.categoryId ?? null,
    title: g.title,
    description: g.description ?? null,
    priority: g.priority as GoalPriority,
    status: g.status as GoalStatus,
    targetDate: g.targetDate ? g.targetDate.toISOString() : null,
    completedAt: g.completedAt ? g.completedAt.toISOString() : null,
    isActive: g.isActive,
    isFeatured: g.isFeatured,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
    category: category
      ? {
          id: category.id,
          name: category.name,
          icon: category.icon ?? null,
          color: category.color ?? null,
        }
      : null,
    keyResults: krs.map(
      (kr): KeyResult => ({
        id: kr.id,
        goalId: kr.goalId,
        title: kr.title,
        targetValue: kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit ?? null,
        isActive: kr.isActive,
        createdAt: kr.createdAt.toISOString(),
        updatedAt: kr.updatedAt.toISOString(),
      })
    ),
    progress: calculateProgress(
      krs,
      goalTasksOut.map((gt) => gt.task.status)
    ),
    linkedHabitsCount: goalHabitsOut.length,
    linkedTasksCount: goalTasksOut.length,
    goalHabits: goalHabitsOut,
    goalTasks: goalTasksOut,
  };
}

/** GET /goals(?status=) — activas, createdAt desc. */
export async function listGoalsLocal(status?: string): Promise<GoalWithProgress[]> {
  const clauses = [Q.where('is_active', true)];
  if (status) clauses.push(Q.where('status', status));
  const rows = await goals()
    .query(...clauses)
    .fetch();
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const ctx = await loadContext();
  return rows.map((g) => toGoalWithProgress(g, ctx));
}

/** GET /goals/:id */
export async function getGoalByIdLocal(goalId: string): Promise<GoalWithProgress> {
  const goal = await goals().find(goalId);
  const ctx = await loadContext();
  return toGoalWithProgress(goal, ctx);
}

/** GET /goals/featured — la única con isFeatured=true (o null). */
export async function getFeaturedGoalLocal(): Promise<GoalWithProgress | null> {
  const rows = await goals()
    .query(Q.where('is_active', true), Q.where('is_featured', true))
    .fetch();
  if (rows.length === 0) return null;
  const ctx = await loadContext();
  return toGoalWithProgress(rows[0], ctx);
}

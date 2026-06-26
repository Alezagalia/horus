/**
 * Data Export Service (S-02.1)
 *
 * Builds a complete JSON snapshot of everything a user owns (GDPR "right to
 * data portability"). Security artifacts (password, refresh token, password-reset
 * and email-verification tokens) are intentionally excluded — they are not the
 * user's personal data and would be a needless secret to hand out.
 *
 * v1 is synchronous. If export size becomes a problem, move to an async job that
 * emails a download link.
 */

import { prisma } from '../lib/prisma.js';

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const where = { where: { userId } } as const;

  const [
    user,
    categories,
    habits,
    habitRecords,
    habitMoments,
    notificationSettings,
    tasks,
    events,
    goals,
    weeklyReviews,
    reviewQuestions,
    accounts,
    transactions,
    budgets,
    recurringExpenses,
    monthlyExpenses,
    savingsGoals,
    exercises,
    routines,
    workouts,
    resources,
    foods,
    recipes,
    mealPlans,
    nutritionLogs,
    shoppingLists,
    activities,
    activityRecords,
    insights,
    lifeDebtDecisions,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerifiedAt: true,
        hourlyRate: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.category.findMany(where),
    prisma.habit.findMany(where),
    prisma.habitRecord.findMany(where),
    prisma.habitMoment.findMany(where),
    prisma.notificationSetting.findMany(where),
    prisma.task.findMany({ ...where, include: { checklistItems: true } }),
    prisma.event.findMany(where),
    prisma.goal.findMany({ ...where, include: { keyResults: true } }),
    prisma.weeklyReview.findMany({
      ...where,
      include: { answers: true, focusGoals: true, focusTasks: true },
    }),
    prisma.reviewQuestion.findMany(where),
    prisma.account.findMany(where),
    prisma.transaction.findMany(where),
    prisma.budget.findMany(where),
    prisma.recurringExpense.findMany(where),
    prisma.monthlyExpenseInstance.findMany(where),
    prisma.savingsGoal.findMany(where),
    prisma.exercise.findMany(where),
    prisma.routine.findMany({ ...where, include: { routineExercises: true } }),
    prisma.workout.findMany({
      ...where,
      include: { workoutExercises: { include: { workoutSets: true } } },
    }),
    prisma.resource.findMany(where),
    prisma.food.findMany(where),
    prisma.recipe.findMany({ ...where, include: { ingredients: true } }),
    prisma.mealPlan.findMany({ ...where, include: { entries: { include: { items: true } } } }),
    prisma.nutritionLog.findMany({ ...where, include: { items: true } }),
    prisma.shoppingList.findMany({ ...where, include: { items: true } }),
    prisma.activity.findMany(where),
    prisma.activityRecord.findMany(where),
    prisma.insight.findMany(where),
    prisma.lifeDebtDecision.findMany(where),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    schemaNote:
      'Exportación completa de datos de la cuenta. Excluye credenciales y tokens internos de seguridad.',
    user,
    productivity: {
      categories,
      habits,
      habitRecords,
      habitMoments,
      notificationSettings,
      tasks,
      events,
    },
    goals: { goals, weeklyReviews, reviewQuestions },
    finance: { accounts, transactions, budgets, recurringExpenses, monthlyExpenses, savingsGoals },
    fitness: { exercises, routines, workouts },
    nutrition: { foods, recipes, mealPlans, nutritionLogs, shoppingLists },
    other: { resources, activities, activityRecords, insights, lifeDebtDecisions },
  };
}

export const dataExportService = {
  exportUserData,
};

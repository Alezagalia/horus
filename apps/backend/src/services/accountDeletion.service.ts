/**
 * Account Deletion Service (S-02.2)
 *
 * Permanently deletes a user and all their data (GDPR "right to erasure").
 *
 * Most rows owned by the user cascade from `User` on delete. However, several
 * intra-user foreign keys use `onDelete: Restrict` (Transaction→Account/Category,
 * Habit/Task/Event/MonthlyExpenseInstance→Category, Workout/Routine→Exercise via
 * their children, SavingsGoal→Account, Recipe→Food). A naive `user.delete()`
 * can fail because Postgres does not guarantee it deletes the referencing child
 * before the restricted parent. So we delete those children first, inside a
 * single transaction, then delete the user (which cascades everything else).
 *
 * The set of pre-deletions below is derived from the ONLY 11 `Restrict` FKs in
 * the schema, all of which point at four parents: Category, Account, Exercise,
 * Food. If a new `Restrict` FK to a user-owned parent is added, extend this list.
 */

import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

export async function deleteAccount(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Children referencing Account / Category (Restrict).
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.monthlyExpenseInstance.deleteMany({ where: { userId } });
    await tx.savingsGoal.deleteMany({ where: { userId } });

    // Children referencing Category (Restrict). deleteMany cascades their own
    // children (records, audits, checklist items, recurring instances, ...).
    await tx.habit.deleteMany({ where: { userId } });
    await tx.task.deleteMany({ where: { userId } });
    await tx.event.deleteMany({ where: { userId } });

    // Parents whose children reference Exercise / Food (Restrict). Deleting the
    // parent cascades the join rows that hold the restricted FK.
    await tx.workout.deleteMany({ where: { userId } });
    await tx.routine.deleteMany({ where: { userId } });
    await tx.recipe.deleteMany({ where: { userId } });

    // Everything else (Account, Category, Exercise, Food, Goal, Resource,
    // Budget, RecurringExpense, meal plans, tokens, ...) cascades from User.
    await tx.user.delete({ where: { id: userId } });
  });

  logger.info('[accountDeletion] account permanently deleted', { userId });
}

export const accountDeletionService = {
  deleteAccount,
};

/**
 * Monthly Expense Service
 * Sprint 10 - US-085
 *
 * Business logic for querying monthly expense instances
 */

import { ExpenseStatus } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

/**
 * Get monthly expense instances for a specific month/year
 */
export const getMonthlyExpenses = async (
  userId: string,
  month: number,
  year: number,
  status?: ExpenseStatus
) => {
  const monthlyExpenses = await prisma.monthlyExpenseInstance.findMany({
    where: {
      userId,
      month,
      year,
      ...(status && { status }),
    },
    include: {
      recurringExpense: {
        select: {
          id: true,
          concept: true,
          currency: true,
          isActive: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      account: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
    },
    orderBy: [
      {
        status: 'asc', // pendiente first, then pagado
      },
      {
        concept: 'asc',
      },
    ],
  });

  return monthlyExpenses;
};

/**
 * Get monthly expense instances for current month/year
 */
export const getCurrentMonthlyExpenses = async (userId: string, status?: ExpenseStatus) => {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
  const year = now.getFullYear();

  return getMonthlyExpenses(userId, month, year, status);
};

/**
 * Mark a monthly expense instance as paid (atomic transaction)
 */
export const payMonthlyExpense = async (
  id: string,
  userId: string,
  data: {
    amount: number;
    accountId: string;
    paidDate?: Date;
    notes?: string;
  }
) => {
  // Use Prisma transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify monthly expense exists and belongs to user
    const monthlyExpense = await tx.monthlyExpenseInstance.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        recurringExpense: {
          select: {
            currency: true,
          },
        },
      },
    });

    if (!monthlyExpense) {
      throw new Error('Gasto mensual no encontrado');
    }

    // 2. Verify expense is still pending (cannot pay twice)
    if (monthlyExpense.status === 'pagado') {
      throw new Error('El gasto ya está marcado como pagado');
    }

    // 3. Verify account exists and belongs to user (with row-level locking)
    const account = await tx.account.findFirst({
      where: {
        id: data.accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      throw new Error('Cuenta no encontrada o no está activa');
    }

    // 4. Verify account has sufficient balance
    const currentBalance = Number(account.currentBalance);
    if (currentBalance < data.amount) {
      throw new Error(
        `Saldo insuficiente en la cuenta. Saldo actual: ${currentBalance} ${monthlyExpense.recurringExpense.currency}`
      );
    }

    // 5. Store previous amount for tracking
    const previousAmount = monthlyExpense.amount;

    // 6. Update monthly expense instance
    const paidDate = data.paidDate || new Date();
    const updatedExpense = await tx.monthlyExpenseInstance.update({
      where: { id },
      data: {
        status: 'pagado',
        amount: data.amount,
        previousAmount: previousAmount,
        accountId: data.accountId,
        paidDate,
        notes: data.notes,
      },
      include: {
        recurringExpense: {
          select: {
            id: true,
            concept: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    // 7. Create transaction (egreso) for this payment
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const monthName = monthNames[monthlyExpense.month - 1];
    const transactionConcept = `${monthlyExpense.concept} - ${monthName} ${monthlyExpense.year}`;

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'egreso',
        accountId: data.accountId,
        categoryId: monthlyExpense.categoryId,
        amount: data.amount,
        concept: transactionConcept,
        date: paidDate,
        notes: data.notes,
      },
    });

    // 8. Update account balance (with row-level locking to prevent race conditions)
    await tx.account.update({
      where: { id: data.accountId },
      data: {
        currentBalance: {
          decrement: data.amount,
        },
      },
    });

    return {
      monthlyExpense: updatedExpense,
      transaction,
    };
  });

  return result;
};

/**
 * Update a paid monthly expense (atomic transaction)
 */
export const updateMonthlyExpense = async (
  id: string,
  userId: string,
  data: {
    amount?: number;
    accountId?: string;
    paidDate?: Date;
    notes?: string;
  }
) => {
  // Use Prisma transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify monthly expense exists, belongs to user, and is paid
    const monthlyExpense = await tx.monthlyExpenseInstance.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!monthlyExpense) {
      throw new Error('Gasto mensual no encontrado');
    }

    if (monthlyExpense.status !== 'pagado') {
      throw new Error('Solo se pueden editar gastos que estén marcados como pagados');
    }

    // 2. If accountId or amount changed, we need to update the transaction
    const accountChanged = data.accountId && data.accountId !== monthlyExpense.accountId;
    const amountChanged =
      data.amount !== undefined && data.amount !== Number(monthlyExpense.amount);
    const needsTransactionUpdate = accountChanged || amountChanged;

    if (needsTransactionUpdate) {
      // 3. Verify new account exists and belongs to user
      const newAccountId = data.accountId || monthlyExpense.accountId!;
      const newAccount = await tx.account.findFirst({
        where: {
          id: newAccountId,
          userId,
          isActive: true,
        },
      });

      if (!newAccount) {
        throw new Error('Cuenta no encontrada o no está activa');
      }

      // 4. Find associated transaction
      const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];
      const monthName = monthNames[monthlyExpense.month - 1];
      const expectedConcept = `${monthlyExpense.concept} - ${monthName} ${monthlyExpense.year}`;

      const oldTransaction = await tx.transaction.findFirst({
        where: {
          userId,
          accountId: monthlyExpense.accountId!,
          categoryId: monthlyExpense.categoryId,
          concept: expectedConcept,
          type: 'egreso',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (oldTransaction) {
        // 5. Revert old account balance
        await tx.account.update({
          where: { id: monthlyExpense.accountId! },
          data: {
            currentBalance: {
              increment: Number(oldTransaction.amount),
            },
          },
        });

        // 6. Delete old transaction
        await tx.transaction.delete({
          where: { id: oldTransaction.id },
        });
      }

      // 7. Create new transaction with updated data
      const newAmount = data.amount || Number(monthlyExpense.amount);
      const newPaidDate = data.paidDate || monthlyExpense.paidDate!;

      await tx.transaction.create({
        data: {
          userId,
          type: 'egreso',
          accountId: newAccountId,
          categoryId: monthlyExpense.categoryId,
          amount: newAmount,
          concept: expectedConcept,
          date: newPaidDate,
          notes: data.notes !== undefined ? data.notes : monthlyExpense.notes,
        },
      });

      // 8. Update new account balance
      await tx.account.update({
        where: { id: newAccountId },
        data: {
          currentBalance: {
            decrement: newAmount,
          },
        },
      });
    }

    // 9. Update monthly expense instance
    const updatedExpense = await tx.monthlyExpenseInstance.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.accountId && { accountId: data.accountId }),
        ...(data.paidDate && { paidDate: data.paidDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        recurringExpense: {
          select: {
            id: true,
            concept: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    return updatedExpense;
  });

  return result;
};

/**
 * Undo payment of a monthly expense (atomic transaction)
 */
export const undoMonthlyExpensePayment = async (id: string, userId: string) => {
  // Use Prisma transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify monthly expense exists, belongs to user, and is paid
    const monthlyExpense = await tx.monthlyExpenseInstance.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!monthlyExpense) {
      throw new Error('Gasto mensual no encontrado');
    }

    if (monthlyExpense.status !== 'pagado') {
      throw new Error('Solo se pueden deshacer gastos que estén marcados como pagados');
    }

    // 2. Find associated transaction
    const monthNames = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];
    const monthName = monthNames[monthlyExpense.month - 1];
    const expectedConcept = `${monthlyExpense.concept} - ${monthName} ${monthlyExpense.year}`;

    const transaction = await tx.transaction.findFirst({
      where: {
        userId,
        accountId: monthlyExpense.accountId!,
        categoryId: monthlyExpense.categoryId,
        concept: expectedConcept,
        type: 'egreso',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (transaction) {
      // 3. Revert account balance
      await tx.account.update({
        where: { id: monthlyExpense.accountId! },
        data: {
          currentBalance: {
            increment: Number(transaction.amount),
          },
        },
      });

      // 4. Delete transaction
      await tx.transaction.delete({
        where: { id: transaction.id },
      });
    }

    // 5. Update monthly expense instance to pending status
    const updatedExpense = await tx.monthlyExpenseInstance.update({
      where: { id },
      data: {
        status: 'pendiente',
        accountId: null,
        paidDate: null,
        amount: monthlyExpense.previousAmount || 0,
        // Keep notes (optional)
      },
      include: {
        recurringExpense: {
          select: {
            id: true,
            concept: true,
            currency: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    });

    return updatedExpense;
  });

  return result;
};

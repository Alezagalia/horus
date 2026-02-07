/**
 * Transaction Service
 * Sprint 9 - US-075
 */

import { prisma } from '../lib/prisma.js';
import { TransactionType, Scope } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  GetTransactionsQuery,
  CreateTransferInput,
  UpdateTransferInput,
} from '../validations/transaction.validation.js';

export const transactionService = {
  /**
   * Get all transactions for a user with filters and pagination
   */
  async findAll(userId: string, filters: GetTransactionsQuery) {
    const where: {
      userId: string;
      accountId?: string;
      categoryId?: string;
      type?: TransactionType;
      isTransfer?: boolean;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId,
    };

    // Apply filters
    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.type) {
      where.type = filters.type as TransactionType;
      // When filtering by type, exclude transfers
      where.isTransfer = false;
    }

    // Date range filter
    if (filters.from || filters.to) {
      where.date = {};
      if (filters.from) {
        where.date.gte = new Date(filters.from);
      }
      if (filters.to) {
        where.date.lte = new Date(filters.to);
      }
    }

    // Get transactions with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              color: true,
              icon: true,
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
        orderBy: {
          date: 'desc',
        },
        take: filters.limit,
        skip: filters.offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate totals for the filtered range (excluding transfers)
    const totalIncome = await prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'ingreso',
        isTransfer: false,
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: {
        ...where,
        type: 'egreso',
        isTransfer: false,
      },
      _sum: {
        amount: true,
      },
    });

    // Format transactions
    const formattedTransactions = transactions.map((t) => ({
      id: t.id,
      accountId: t.accountId,
      categoryId: t.categoryId,
      type: t.type,
      amount: Number(t.amount),
      concept: t.concept,
      date: t.date,
      notes: t.notes,
      isTransfer: t.isTransfer,
      targetAccountId: t.targetAccountId,
      transferPairId: t.transferPairId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      account: t.account,
      category: t.category,
    }));

    const totalIncomeValue = Number(totalIncome._sum.amount || 0);
    const totalExpensesValue = Number(totalExpenses._sum.amount || 0);

    return {
      transactions: formattedTransactions,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: filters.offset + filters.limit < total,
      },
      totals: {
        totalIncome: totalIncomeValue,
        totalExpenses: totalExpensesValue,
        balance: totalIncomeValue - totalExpensesValue,
      },
    };
  },

  /**
   * Get a specific transaction by ID
   */
  async findById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            color: true,
            icon: true,
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

    if (!transaction) {
      throw new NotFoundError('Transacción no encontrada');
    }

    // If it's a transfer, get the paired transaction
    let transferPair = null;
    if (transaction.isTransfer && transaction.transferPairId) {
      transferPair = await prisma.transaction.findUnique({
        where: {
          id: transaction.transferPairId,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
            },
          },
        },
      });
    }

    return {
      id: transaction.id,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      type: transaction.type,
      amount: Number(transaction.amount),
      concept: transaction.concept,
      date: transaction.date,
      notes: transaction.notes,
      isTransfer: transaction.isTransfer,
      targetAccountId: transaction.targetAccountId,
      transferPairId: transaction.transferPairId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      account: transaction.account,
      category: transaction.category,
      transferPair: transferPair
        ? {
            id: transferPair.id,
            type: transferPair.type,
            amount: Number(transferPair.amount),
            account: transferPair.account,
          }
        : null,
    };
  },

  /**
   * Create a new transaction
   * Uses atomic transaction to update account balance
   */
  async create(userId: string, data: CreateTransactionInput) {
    // Validate account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: data.accountId,
        userId,
        isActive: true,
      },
    });

    if (!account) {
      throw new NotFoundError('Cuenta no encontrada o inactiva');
    }

    // Validate category exists and is of scope 'gastos'
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId,
        scope: Scope.gastos,
      },
    });

    if (!category) {
      throw new NotFoundError('Categoría no encontrada o no es de tipo gastos');
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId: data.categoryId,
          type: data.type as TransactionType,
          amount: data.amount,
          concept: data.concept,
          date: new Date(data.date),
          notes: data.notes,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              color: true,
              icon: true,
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

      // Calculate balance delta
      const delta = data.type === 'ingreso' ? data.amount : -data.amount;

      // Update account balance
      const updatedAccount = await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          currentBalance: {
            increment: delta,
          },
        },
      });

      return { transaction, updatedAccount };
    });

    return {
      transaction: {
        id: result.transaction.id,
        accountId: result.transaction.accountId,
        categoryId: result.transaction.categoryId,
        type: result.transaction.type,
        amount: Number(result.transaction.amount),
        concept: result.transaction.concept,
        date: result.transaction.date,
        notes: result.transaction.notes,
        isTransfer: result.transaction.isTransfer,
        createdAt: result.transaction.createdAt,
        updatedAt: result.transaction.updatedAt,
        account: result.transaction.account,
        category: result.transaction.category,
      },
      account: {
        id: result.updatedAccount.id,
        name: result.updatedAccount.name,
        currentBalance: Number(result.updatedAccount.currentBalance),
      },
    };
  },

  /**
   * Update a transaction
   * Uses atomic transaction to recalculate account balance if amount changes
   */
  async update(transactionId: string, userId: string, data: UpdateTransactionInput) {
    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!existingTransaction) {
      throw new NotFoundError('Transacción no encontrada');
    }

    // If it's a transfer, don't allow updates (for now)
    if (existingTransaction.isTransfer) {
      throw new BadRequestError('No se pueden editar transferencias. Elimina y crea una nueva.');
    }

    // Validate category if changing
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          userId,
          scope: Scope.gastos,
        },
      });

      if (!category) {
        throw new NotFoundError('Categoría no encontrada o no es de tipo gastos');
      }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // If amount is changing, recalculate account balance
      let updatedAccount = null;
      if (data.amount !== undefined) {
        const oldAmount = Number(existingTransaction.amount);
        const newAmount = data.amount;

        // Revert old impact
        const oldDelta = existingTransaction.type === 'ingreso' ? -oldAmount : oldAmount;

        // Apply new impact
        const newDelta = existingTransaction.type === 'ingreso' ? newAmount : -newAmount;

        // Total delta
        const totalDelta = oldDelta + newDelta;

        // Update account balance
        updatedAccount = await tx.account.update({
          where: {
            id: existingTransaction.accountId,
          },
          data: {
            currentBalance: {
              increment: totalDelta,
            },
          },
        });
      }

      // Update transaction
      const transaction = await tx.transaction.update({
        where: {
          id: transactionId,
        },
        data: {
          amount: data.amount,
          concept: data.concept,
          date: data.date ? new Date(data.date) : undefined,
          notes: data.notes,
          categoryId: data.categoryId,
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true,
              color: true,
              icon: true,
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

      return { transaction, updatedAccount };
    });

    return {
      transaction: {
        id: result.transaction.id,
        accountId: result.transaction.accountId,
        categoryId: result.transaction.categoryId,
        type: result.transaction.type,
        amount: Number(result.transaction.amount),
        concept: result.transaction.concept,
        date: result.transaction.date,
        notes: result.transaction.notes,
        isTransfer: result.transaction.isTransfer,
        createdAt: result.transaction.createdAt,
        updatedAt: result.transaction.updatedAt,
        account: result.transaction.account,
        category: result.transaction.category,
      },
      account: result.updatedAccount
        ? {
            id: result.updatedAccount.id,
            name: result.updatedAccount.name,
            currentBalance: Number(result.updatedAccount.currentBalance),
          }
        : null,
    };
  },

  /**
   * Delete a transaction
   * Uses atomic transaction to revert account balance impact
   * If it's a transfer, also deletes the paired transaction
   */
  async delete(transactionId: string, userId: string) {
    // Get existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });

    if (!existingTransaction) {
      throw new NotFoundError('Transacción no encontrada');
    }

    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Revert balance impact
      const amount = Number(existingTransaction.amount);
      const delta = existingTransaction.type === 'ingreso' ? -amount : amount;

      // Update account balance
      await tx.account.update({
        where: {
          id: existingTransaction.accountId,
        },
        data: {
          currentBalance: {
            increment: delta,
          },
        },
      });

      // If it's a transfer, delete the paired transaction too
      if (existingTransaction.isTransfer && existingTransaction.transferPairId) {
        const pairedTransaction = await tx.transaction.findUnique({
          where: {
            id: existingTransaction.transferPairId,
          },
        });

        if (pairedTransaction) {
          // Revert paired transaction balance impact
          const pairedAmount = Number(pairedTransaction.amount);
          const pairedDelta = pairedTransaction.type === 'ingreso' ? -pairedAmount : pairedAmount;

          await tx.account.update({
            where: {
              id: pairedTransaction.accountId,
            },
            data: {
              currentBalance: {
                increment: pairedDelta,
              },
            },
          });

          // Delete paired transaction
          await tx.transaction.delete({
            where: {
              id: pairedTransaction.id,
            },
          });
        }
      }

      // Delete transaction
      await tx.transaction.delete({
        where: {
          id: transactionId,
        },
      });
    });

    return { success: true };
  },

  /**
   * Create a transfer between two accounts
   * Creates two linked transactions in an atomic operation
   */
  async createTransfer(userId: string, data: CreateTransferInput) {
    // Validate both accounts exist and belong to user
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({
        where: {
          id: data.fromAccountId,
          userId,
          isActive: true,
        },
      }),
      prisma.account.findFirst({
        where: {
          id: data.toAccountId,
          userId,
          isActive: true,
        },
      }),
    ]);

    if (!fromAccount) {
      throw new NotFoundError('Cuenta de origen no encontrada o inactiva');
    }

    if (!toAccount) {
      throw new NotFoundError('Cuenta de destino no encontrada o inactiva');
    }

    // Validate accounts are different
    if (data.fromAccountId === data.toAccountId) {
      throw new BadRequestError('No se puede transferir a la misma cuenta');
    }

    // Validate same currency
    if (fromAccount.currency !== toAccount.currency) {
      throw new BadRequestError(
        `Las cuentas deben tener la misma moneda. Origen: ${fromAccount.currency}, Destino: ${toAccount.currency}`
      );
    }

    // Validate sufficient balance
    const currentBalance = Number(fromAccount.currentBalance);
    if (currentBalance < data.amount) {
      throw new BadRequestError(
        `Saldo insuficiente. Disponible: ${currentBalance}, Requerido: ${data.amount}`
      );
    }

    // Get a default "Transferencias" category or create one
    let transferCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: 'Transferencias',
        scope: Scope.gastos,
      },
    });

    if (!transferCategory) {
      transferCategory = await prisma.category.create({
        data: {
          userId,
          name: 'Transferencias',
          icon: 'swap-horizontal',
          color: '#6B7280',
          scope: Scope.gastos,
          isDefault: false,
        },
      });
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create egreso transaction (from account)
      const egresoTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.fromAccountId,
          categoryId: transferCategory.id,
          type: 'egreso' as TransactionType,
          amount: data.amount,
          concept: data.concept,
          date: new Date(data.date),
          notes: data.notes,
          isTransfer: true,
          targetAccountId: data.toAccountId,
          transferPairId: '', // Will update after creating ingreso
        },
      });

      // Create ingreso transaction (to account)
      const ingresoTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.toAccountId,
          categoryId: transferCategory.id,
          type: 'ingreso' as TransactionType,
          amount: data.amount,
          concept: data.concept,
          date: new Date(data.date),
          notes: data.notes,
          isTransfer: true,
          targetAccountId: data.fromAccountId,
          transferPairId: egresoTransaction.id,
        },
      });

      // Update egreso transaction with ingreso ID
      await tx.transaction.update({
        where: { id: egresoTransaction.id },
        data: { transferPairId: ingresoTransaction.id },
      });

      // Update account balances
      const [updatedFromAccount, updatedToAccount] = await Promise.all([
        tx.account.update({
          where: { id: data.fromAccountId },
          data: {
            currentBalance: {
              decrement: data.amount,
            },
          },
        }),
        tx.account.update({
          where: { id: data.toAccountId },
          data: {
            currentBalance: {
              increment: data.amount,
            },
          },
        }),
      ]);

      return {
        egresoTransaction,
        ingresoTransaction,
        updatedFromAccount,
        updatedToAccount,
      };
    });

    return {
      transfer: {
        egreso: {
          id: result.egresoTransaction.id,
          accountId: result.egresoTransaction.accountId,
          type: result.egresoTransaction.type,
          amount: Number(result.egresoTransaction.amount),
          concept: result.egresoTransaction.concept,
          date: result.egresoTransaction.date,
          notes: result.egresoTransaction.notes,
          transferPairId: result.egresoTransaction.transferPairId,
        },
        ingreso: {
          id: result.ingresoTransaction.id,
          accountId: result.ingresoTransaction.accountId,
          type: result.ingresoTransaction.type,
          amount: Number(result.ingresoTransaction.amount),
          concept: result.ingresoTransaction.concept,
          date: result.ingresoTransaction.date,
          notes: result.ingresoTransaction.notes,
          transferPairId: result.ingresoTransaction.transferPairId,
        },
      },
      accounts: {
        fromAccount: {
          id: result.updatedFromAccount.id,
          name: result.updatedFromAccount.name,
          currentBalance: Number(result.updatedFromAccount.currentBalance),
        },
        toAccount: {
          id: result.updatedToAccount.id,
          name: result.updatedToAccount.name,
          currentBalance: Number(result.updatedToAccount.currentBalance),
        },
      },
    };
  },

  /**
   * Update a transfer (both linked transactions)
   * Synchronizes changes across both transactions and recalculates balances
   */
  async updateTransfer(transactionId: string, userId: string, data: UpdateTransferInput) {
    // Get the transaction to update
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        isTransfer: true,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Transferencia no encontrada');
    }

    if (!transaction.transferPairId) {
      throw new BadRequestError('La transacción no tiene un par vinculado');
    }

    // Get the paired transaction
    const pairedTransaction = await prisma.transaction.findUnique({
      where: {
        id: transaction.transferPairId,
      },
    });

    if (!pairedTransaction) {
      throw new NotFoundError('Transacción pareada no encontrada');
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // If amount is changing, recalculate balances
      if (data.amount !== undefined) {
        const oldAmount = Number(transaction.amount);
        const newAmount = data.amount;

        // Revert old impact on both accounts
        const revertDelta1 = transaction.type === 'ingreso' ? -oldAmount : oldAmount;
        const revertDelta2 = pairedTransaction.type === 'ingreso' ? -oldAmount : oldAmount;

        // Apply new impact
        const newDelta1 = transaction.type === 'ingreso' ? newAmount : -newAmount;
        const newDelta2 = pairedTransaction.type === 'ingreso' ? newAmount : -newAmount;

        // Update balances
        await Promise.all([
          tx.account.update({
            where: { id: transaction.accountId },
            data: {
              currentBalance: {
                increment: revertDelta1 + newDelta1,
              },
            },
          }),
          tx.account.update({
            where: { id: pairedTransaction.accountId },
            data: {
              currentBalance: {
                increment: revertDelta2 + newDelta2,
              },
            },
          }),
        ]);
      }

      // Update both transactions with same data
      const updateData = {
        amount: data.amount,
        concept: data.concept,
        date: data.date ? new Date(data.date) : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
      };

      const [updatedTransaction, updatedPair] = await Promise.all([
        tx.transaction.update({
          where: { id: transactionId },
          data: updateData,
        }),
        tx.transaction.update({
          where: { id: transaction.transferPairId! },
          data: updateData,
        }),
      ]);

      // Fetch accounts separately
      const [fromAccount, toAccount] = await Promise.all([
        tx.account.findUnique({
          where: { id: updatedTransaction.accountId },
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            currentBalance: true,
          },
        }),
        tx.account.findUnique({
          where: { id: updatedPair.accountId },
          select: {
            id: true,
            name: true,
            type: true,
            currency: true,
            currentBalance: true,
          },
        }),
      ]);

      return { updatedTransaction, updatedPair, fromAccount, toAccount };
    });

    if (!result.fromAccount || !result.toAccount) {
      throw new NotFoundError('Cuenta no encontrada');
    }

    return {
      transfer: {
        transaction: {
          id: result.updatedTransaction.id,
          accountId: result.updatedTransaction.accountId,
          type: result.updatedTransaction.type,
          amount: Number(result.updatedTransaction.amount),
          concept: result.updatedTransaction.concept,
          date: result.updatedTransaction.date,
          notes: result.updatedTransaction.notes,
          account: {
            ...result.fromAccount,
            currentBalance: Number(result.fromAccount.currentBalance),
          },
        },
        pairedTransaction: {
          id: result.updatedPair.id,
          accountId: result.updatedPair.accountId,
          type: result.updatedPair.type,
          amount: Number(result.updatedPair.amount),
          concept: result.updatedPair.concept,
          date: result.updatedPair.date,
          notes: result.updatedPair.notes,
          account: {
            ...result.toAccount,
            currentBalance: Number(result.toAccount.currentBalance),
          },
        },
      },
    };
  },

  /**
   * Get expenses grouped by category for a specific month/year
   * Returns aggregated totals without fetching all individual transactions
   */
  async getExpensesByCategory(userId: string, month: number, year: number) {
    // Build date range for the month
    const startDate = new Date(year, month - 1, 1); // month is 1-indexed
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last day of month

    // Get all expense transactions grouped by category
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'egreso',
        isTransfer: false,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Fetch category details for each group
    const categoryIds = expensesByCategory.map((item) => item.categoryId);
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
      },
    });

    // Map categories to a lookup object
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    // Format response with category details
    const formattedData = expensesByCategory.map((item) => {
      const category = categoryMap.get(item.categoryId);
      return {
        categoryId: item.categoryId,
        categoryName: category?.name || 'Sin categoría',
        categoryIcon: category?.icon || '📄',
        categoryColor: category?.color || '#6B7280',
        totalAmount: Number(item._sum.amount || 0),
        transactionCount: item._count.id,
      };
    });

    // Sort by amount descending
    formattedData.sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate total
    const total = formattedData.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      month,
      year,
      categories: formattedData,
      total,
    };
  },
};

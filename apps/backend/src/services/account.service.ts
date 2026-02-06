/**
 * Account Service
 * Sprint 9 - US-074
 */

import { prisma } from '../lib/prisma.js';
import { AccountType } from '../generated/prisma/client.js';
import { NotFoundError, BadRequestError } from '../middlewares/error.middleware.js';
import {
  CreateAccountInput,
  UpdateAccountInput,
  accountColors,
  accountIcons,
} from '../validations/account.validation.js';

export const accountService = {
  /**
   * Get all active accounts for a user
   * Includes transaction count per account and total balance by currency
   */
  async findAll(userId: string) {
    // Get all active accounts
    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total balance by currency
    const balanceByCurrency: Record<string, number> = {};

    accounts.forEach((account) => {
      const balance = Number(account.currentBalance);
      if (balanceByCurrency[account.currency]) {
        balanceByCurrency[account.currency] += balance;
      } else {
        balanceByCurrency[account.currency] = balance;
      }
    });

    // Format response
    const formattedAccounts = accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      color: account.color,
      icon: account.icon,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      transactionCount: account._count.transactions,
    }));

    return {
      accounts: formattedAccounts,
      totalBalanceByCurrency: balanceByCurrency,
    };
  },

  /**
   * Get a specific account by ID
   * Includes statistics: total income, total expenses, last transaction
   */
  async findById(accountId: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      include: {
        transactions: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Cuenta no encontrada');
    }

    // Calculate statistics
    const stats = await prisma.transaction.aggregate({
      where: {
        accountId,
        userId,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const totalIncome = await prisma.transaction.aggregate({
      where: {
        accountId,
        userId,
        type: 'ingreso',
      },
      _sum: {
        amount: true,
      },
    });

    const totalExpenses = await prisma.transaction.aggregate({
      where: {
        accountId,
        userId,
        type: 'egreso',
      },
      _sum: {
        amount: true,
      },
    });

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      color: account.color,
      icon: account.icon,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      statistics: {
        totalIncome: Number(totalIncome._sum.amount || 0),
        totalExpenses: Number(totalExpenses._sum.amount || 0),
        transactionCount: stats._count,
        lastTransaction: account.transactions[0] || null,
      },
    };
  },

  /**
   * Create a new account
   */
  async create(userId: string, data: CreateAccountInput) {
    // Set default color and icon based on account type if not provided
    const color = data.color || accountColors[data.type as keyof typeof accountColors];
    const icon = data.icon || accountIcons[data.type as keyof typeof accountIcons];

    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type as AccountType,
        currency: data.currency,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance, // Set currentBalance = initialBalance on creation
        color,
        icon,
      },
    });

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      color: account.color,
      icon: account.icon,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  },

  /**
   * Update an account
   * Allows updating: name, color, icon, initialBalance, currency
   * Does NOT allow updating: type
   */
  async update(accountId: string, userId: string, data: UpdateAccountInput) {
    // Verify account exists and belongs to user
    const existingAccount = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!existingAccount) {
      throw new NotFoundError('Cuenta no encontrada');
    }

    // Calculate new currentBalance if initialBalance is being updated
    let newCurrentBalance = existingAccount.currentBalance;
    if (data.initialBalance !== undefined) {
      const initialBalanceDiff = data.initialBalance - Number(existingAccount.initialBalance);
      newCurrentBalance = Number(existingAccount.currentBalance) + initialBalanceDiff;
    }

    // Update account
    const account = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
        initialBalance: data.initialBalance,
        currentBalance: data.initialBalance !== undefined ? newCurrentBalance : undefined,
        currency: data.currency,
      },
    });

    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: Number(account.initialBalance),
      currentBalance: Number(account.currentBalance),
      color: account.color,
      icon: account.icon,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  },

  /**
   * Deactivate an account (soft delete)
   * Validates that the account doesn't have transactions
   */
  async deactivate(accountId: string, userId: string) {
    // Verify account exists and belongs to user
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Cuenta no encontrada');
    }

    // Validate that account has no transactions
    if (account._count.transactions > 0) {
      throw new BadRequestError(
        'No se puede desactivar cuenta con transacciones. Elimínalas primero.'
      );
    }

    // Soft delete (set isActive = false)
    const updatedAccount = await prisma.account.update({
      where: {
        id: accountId,
      },
      data: {
        isActive: false,
      },
    });

    return {
      id: updatedAccount.id,
      name: updatedAccount.name,
      type: updatedAccount.type,
      currency: updatedAccount.currency,
      initialBalance: Number(updatedAccount.initialBalance),
      currentBalance: Number(updatedAccount.currentBalance),
      color: updatedAccount.color,
      icon: updatedAccount.icon,
      isActive: updatedAccount.isActive,
      createdAt: updatedAccount.createdAt,
      updatedAt: updatedAccount.updatedAt,
    };
  },
};

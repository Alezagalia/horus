/**
 * Savings Goal Shared Types
 * Metas de Ahorro vinculadas a Cuentas
 */

export type SavingsGoalStatus = 'en_progreso' | 'completada' | 'cancelada';

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  targetAmount: number;
  targetDate?: string | null;
  notes?: string | null;
  status: SavingsGoalStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoalAccount {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: string;
  currentBalance: number;
}

export interface SavingsGoalWithProgress extends SavingsGoal {
  account: SavingsGoalAccount;
  savedAmount: number;
  remaining: number;
  progress: number;
}

export interface CreateSavingsGoalDTO {
  name: string;
  accountId: string;
  targetAmount: number;
  targetDate?: string | null;
  notes?: string | null;
}

export interface UpdateSavingsGoalDTO {
  name?: string;
  targetAmount?: number;
  targetDate?: string | null;
  notes?: string | null;
  status?: SavingsGoalStatus;
}

export interface SavingsGoalsResponse {
  message: string;
  savingsGoals: SavingsGoalWithProgress[];
  count: number;
}

export interface SavingsGoalResponse {
  message: string;
  savingsGoal: SavingsGoalWithProgress;
}

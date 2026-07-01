import { axiosInstance } from '../axios';
import { postIdempotent } from '../idempotent';
import type {
  RecurringExpense,
  CreateRecurringExpenseDTO,
  UpdateRecurringExpenseDTO,
} from '@horus/shared';

export type { RecurringExpense };

export const recurringExpenseApi = {
  list: async (activeOnly?: boolean): Promise<RecurringExpense[]> => {
    const { data } = await axiosInstance.get('/recurring-expenses', {
      params: activeOnly !== undefined ? { activeOnly } : undefined,
    });
    return data.recurringExpenses ?? [];
  },

  // Backward-compat alias used by useRecurringExpensesCount
  listActive: async (): Promise<RecurringExpense[]> => recurringExpenseApi.list(true),

  create: async (dto: CreateRecurringExpenseDTO): Promise<RecurringExpense> => {
    const data = await postIdempotent<any>('/recurring-expenses', dto);
    return data.recurringExpense ?? data;
  },

  update: async (id: string, dto: UpdateRecurringExpenseDTO): Promise<RecurringExpense> => {
    const { data } = await axiosInstance.put(`/recurring-expenses/${id}`, dto);
    return data.recurringExpense ?? data;
  },

  remove: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/recurring-expenses/${id}`);
  },
};

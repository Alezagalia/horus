import { axiosInstance } from '../axios';

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  isActive: boolean;
}

export const recurringExpenseApi = {
  listActive: async (): Promise<RecurringExpense[]> => {
    const { data } = await axiosInstance.get('/recurring-expenses', {
      params: { activeOnly: true },
    });
    return data.recurringExpenses ?? data ?? [];
  },
};

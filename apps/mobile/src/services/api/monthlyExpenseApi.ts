import { axiosInstance } from '../axios';
import { putIdempotent } from '../idempotent';
import type {
  MonthlyExpense,
  MonthlyExpensesResponse,
  PayMonthlyExpenseDTO,
  UpdateMonthlyExpenseDTO,
} from '@horus/shared';

export type { MonthlyExpense };

export const monthlyExpenseApi = {
  list: async (month: number, year: number): Promise<MonthlyExpensesResponse> => {
    const { data } = await axiosInstance.get(`/monthly-expenses/${month}/${year}`);
    return data;
  },

  pay: async (id: string, dto: PayMonthlyExpenseDTO): Promise<MonthlyExpense> => {
    const data = await putIdempotent<any>(`/monthly-expenses/${id}/pay`, dto);
    return data.monthlyExpense ?? data;
  },

  update: async (id: string, dto: UpdateMonthlyExpenseDTO): Promise<MonthlyExpense> => {
    const data = await putIdempotent<any>(`/monthly-expenses/${id}`, dto);
    return data.monthlyExpense ?? data;
  },

  undo: async (id: string): Promise<MonthlyExpense> => {
    const data = await putIdempotent<any>(`/monthly-expenses/${id}/undo`);
    return data.monthlyExpense ?? data;
  },
};

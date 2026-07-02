import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class MonthlyExpenseInstance extends Model {
  static table = 'monthly_expense_instances';

  @field('recurring_expense_id') recurringExpenseId!: string;
  @field('month') month!: number;
  @field('year') year!: number;
  @field('concept') concept!: string;
  @field('category_id') categoryId!: string;
  @field('amount') amount!: number;
  @field('previous_amount') previousAmount?: number;
  @field('account_id') accountId?: string;
  @date('paid_date') paidDate?: Date;
  @field('status') status!: string; // 'pendiente' | 'pagado'
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

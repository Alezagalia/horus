import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class RecurringExpense extends Model {
  static table = 'recurring_expenses';

  @field('concept') concept!: string;
  @field('category_id') categoryId!: string;
  @field('currency') currency!: string;
  @field('due_day') dueDay?: number;
  @field('notes') notes?: string;
  @field('is_active') isActive!: boolean;
  @date('last_reviewed_at') lastReviewedAt!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

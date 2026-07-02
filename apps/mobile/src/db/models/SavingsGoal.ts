import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class SavingsGoal extends Model {
  static table = 'savings_goals';

  @field('account_id') accountId!: string;
  @field('name') name!: string;
  @field('target_amount') targetAmount!: number;
  @date('target_date') targetDate?: Date;
  @field('notes') notes?: string;
  @field('status') status!: string; // 'en_progreso' | 'completada' | ...
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Budget extends Model {
  static table = 'budgets';

  @field('category_id') categoryId!: string;
  @field('amount') amount!: number;
  @field('currency') currency!: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

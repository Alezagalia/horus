import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ShoppingList extends Model {
  static table = 'shopping_lists';

  @field('meal_plan_id') mealPlanId?: string;
  @field('name') name!: string;
  /** Transacción de gasto vinculada (unique en el server). */
  @field('transaction_id') transactionId?: string;
  @date('generated_at') generatedAt?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

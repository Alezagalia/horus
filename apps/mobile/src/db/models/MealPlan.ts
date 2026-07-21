import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Plan semanal — weekStart = medianoche UTC del lunes (unique por usuario). */
export class MealPlan extends Model {
  static table = 'meal_plans';

  @date('week_start') weekStart!: Date;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

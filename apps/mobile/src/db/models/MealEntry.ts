import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class MealEntry extends Model {
  static table = 'meal_entries';

  @field('meal_plan_id') mealPlanId!: string;
  /** Medianoche UTC del día planificado. */
  @date('day') day!: Date;
  @field('meal_time') mealTime!: string; // BREAKFAST | MORNING_SNACK | LUNCH | AFTERNOON_SNACK | DINNER
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

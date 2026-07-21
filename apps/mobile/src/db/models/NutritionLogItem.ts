import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class NutritionLogItem extends Model {
  static table = 'nutrition_log_items';

  @field('nutrition_log_id') nutritionLogId!: string;
  @field('food_id') foodId?: string;
  @field('meal_time') mealTime!: string;
  @field('grams') grams!: number;
  @field('servings') servings?: number;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

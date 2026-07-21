import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Alimento O receta dentro de una comida planificada (uno de los dos). */
export class MealEntryItem extends Model {
  static table = 'meal_entry_items';

  @field('meal_entry_id') mealEntryId!: string;
  @field('food_id') foodId?: string;
  @field('recipe_id') recipeId?: string;
  @field('grams') grams!: number;
  @field('servings') servings?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

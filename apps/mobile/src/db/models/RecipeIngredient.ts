import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class RecipeIngredient extends Model {
  static table = 'recipe_ingredients';

  @field('recipe_id') recipeId!: string;
  @field('food_id') foodId!: string;
  @field('grams') grams!: number;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Recipe extends Model {
  static table = 'recipes';

  @field('name') name!: string;
  @field('description') description?: string;
  @field('servings') servings!: number;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

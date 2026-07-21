import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class ShoppingListItem extends Model {
  static table = 'shopping_list_items';

  @field('shopping_list_id') shoppingListId!: string;
  @field('food_id') foodId?: string;
  @field('name') name!: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('checked') checked!: boolean;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Category extends Model {
  static table = 'categories';

  @field('name') name!: string;
  @field('scope') scope!: string;
  @field('icon') icon?: string;
  @field('color') color?: string;
  @field('is_default') isDefault!: boolean;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

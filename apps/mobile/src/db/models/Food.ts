import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Macros por 100 (unit g/ml) o por unidad. Soft delete via is_active. */
export class Food extends Model {
  static table = 'foods';

  @field('name') name!: string;
  @field('brand') brand?: string;
  @field('calories') calories!: number;
  @field('protein') protein!: number;
  @field('carbs') carbs!: number;
  @field('fat') fat!: number;
  @field('fiber') fiber?: number;
  @field('unit') unit!: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class KeyResult extends Model {
  static table = 'key_results';

  @field('goal_id') goalId!: string;
  @field('title') title!: string;
  @field('target_value') targetValue!: number;
  /** También lo incrementa el server por hábitos vinculados; el pull corrige. */
  @field('current_value') currentValue!: number;
  @field('unit') unit?: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

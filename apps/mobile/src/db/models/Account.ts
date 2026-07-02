import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Account extends Model {
  static table = 'accounts';

  @field('name') name!: string;
  @field('type') type!: string;
  @field('currency') currency!: string;
  /** currentBalance sincronizado desde el server (+ ajuste optimista local). */
  @field('balance') balance!: number;
  @field('initial_balance') initialBalance!: number;
  @field('color') color?: string;
  @field('icon') icon?: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

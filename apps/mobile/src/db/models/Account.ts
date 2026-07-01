import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Account extends Model {
  static table = 'accounts';

  @field('server_id') serverId?: string;
  @field('name') name!: string;
  @field('type') type!: string;
  @field('currency') currency!: string;
  @field('balance') balance!: number;
  @field('color') color?: string;
  @field('is_active') isActive!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

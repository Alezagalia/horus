import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Transaction extends Model {
  static table = 'transactions';

  @field('account_id') accountId!: string;
  @field('category_id') categoryId!: string;
  @field('type') type!: string; // 'ingreso' | 'egreso'
  @field('amount') amount!: number;
  @field('concept') concept!: string;
  @date('date') date!: Date;
  @field('notes') notes?: string;
  @field('is_transfer') isTransfer!: boolean;
  @field('target_account_id') targetAccountId?: string;
  @field('transfer_pair_id') transferPairId?: string;
  @field('monthly_expense_instance_id') monthlyExpenseInstanceId?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

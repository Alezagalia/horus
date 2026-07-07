import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class HabitRecord extends Model {
  static table = 'habit_records';

  @field('habit_id') habitId!: string;
  /** Normalizada a mediodía UTC — permite igualdad exacta por día. */
  @date('date') date!: Date;
  @field('completed') completed!: boolean;
  @field('value') value?: number;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

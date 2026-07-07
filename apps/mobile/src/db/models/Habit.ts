import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, json } from '@nozbe/watermelondb/decorators';

const sanitizeWeekDays = (raw: unknown): number[] =>
  Array.isArray(raw) ? raw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];

export class Habit extends Model {
  static table = 'habits';

  @field('category_id') categoryId!: string;
  @field('name') name!: string;
  @field('description') description?: string;
  @field('type') type!: string; // 'CHECK' | 'NUMERIC'
  @field('target_value') targetValue?: number;
  @field('unit') unit?: string;
  @field('periodicity') periodicity!: string; // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  // Columna string (JSON); el decorador expone number[]
  @json('week_days', sanitizeWeekDays) weekDays!: number[];
  @field('time_of_day') timeOfDay!: string;
  @field('reminder_time') reminderTime?: string;
  @field('color') color?: string;
  @field('sort_order') sortOrder!: number;
  @field('is_active') isActive!: boolean;
  // Derivados del server; el cliente los ajusta optimistamente y el pull corrige
  @field('current_streak') currentStreak!: number;
  @field('longest_streak') longestStreak!: number;
  @date('last_completed_date') lastCompletedDate?: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

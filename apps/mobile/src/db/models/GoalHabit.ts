import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Vínculo meta↔hábito: solo lectura en mobile (se edita desde la web). */
export class GoalHabit extends Model {
  static table = 'goal_habits';

  @field('goal_id') goalId!: string;
  @field('habit_id') habitId!: string;
  @field('kr_id') krId?: string;
  @readonly @date('created_at') createdAt!: Date;
}

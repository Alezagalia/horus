import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Vínculo meta↔tarea: solo lectura en mobile (se edita desde la web). */
export class GoalTask extends Model {
  static table = 'goal_tasks';

  @field('goal_id') goalId!: string;
  @field('task_id') taskId!: string;
  @readonly @date('created_at') createdAt!: Date;
}

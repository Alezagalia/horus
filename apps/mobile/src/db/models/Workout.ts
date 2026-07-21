import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Sesión de entrenamiento. endTime null = en progreso. */
export class Workout extends Model {
  static table = 'workouts';

  @field('routine_id') routineId?: string;
  @date('start_time') startTime!: Date;
  @date('end_time') endTime?: Date;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

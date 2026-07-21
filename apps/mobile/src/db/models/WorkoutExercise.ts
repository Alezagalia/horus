import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class WorkoutExercise extends Model {
  static table = 'workout_exercises';

  @field('workout_id') workoutId!: string;
  @field('exercise_id') exerciseId!: string;
  /** `order` en el server (keyword SQL). */
  @field('sort_order') sortOrder!: number;
  @field('notes') notes?: string;
  @field('rpe') rpe?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

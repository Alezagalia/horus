import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class RoutineExercise extends Model {
  static table = 'routine_exercises';

  @field('routine_id') routineId!: string;
  @field('exercise_id') exerciseId!: string;
  /** `order` en el server (keyword SQL). */
  @field('sort_order') sortOrder!: number;
  @field('target_sets') targetSets?: number;
  @field('target_reps') targetReps?: number;
  @field('target_weight') targetWeight?: number;
  @field('rest_time') restTime?: number;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

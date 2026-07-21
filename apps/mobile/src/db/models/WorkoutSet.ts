import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class WorkoutSet extends Model {
  static table = 'workout_sets';

  @field('workout_exercise_id') workoutExerciseId!: string;
  @field('set_number') setNumber!: number;
  @field('reps') reps!: number;
  @field('weight') weight!: number;
  @field('weight_unit') weightUnit!: string; // kg | lbs
  @field('completed') completed!: boolean;
  @field('rest_time') restTime?: number;
  @field('notes') notes?: string;
  /** Momento en que se completó la serie. */
  @date('timestamp') timestamp!: Date;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Exercise extends Model {
  static table = 'exercises';

  @field('name') name!: string;
  @field('muscle_group') muscleGroup?: string; // pecho | espalda | piernas | hombros | brazos | core | cardio | otro
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

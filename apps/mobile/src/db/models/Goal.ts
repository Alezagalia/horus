import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Goal extends Model {
  static table = 'goals';

  @field('category_id') categoryId?: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('priority') priority!: string; // 'alta' | 'media' | 'baja'
  @field('status') status!: string; // 'en_progreso' | 'completada' | 'cancelada'
  @date('target_date') targetDate?: Date;
  @date('completed_at') completedAt?: Date;
  @field('is_active') isActive!: boolean;
  @field('is_featured') isFeatured!: boolean;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

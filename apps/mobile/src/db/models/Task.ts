import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Task extends Model {
  static table = 'tasks';

  @field('category_id') categoryId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('priority') priority!: string; // 'alta' | 'media' | 'baja'
  @field('status') status!: string; // 'pendiente' | 'en_progreso' | 'completada' | 'cancelada'
  @date('due_date') dueDate?: Date;
  @date('completed_at') completedAt?: Date;
  @date('canceled_at') canceledAt?: Date;
  /** Lo setea el cron de archivado del server; el cliente solo filtra. */
  @date('archived_at') archivedAt?: Date;
  @field('cancel_reason') cancelReason?: string;
  @field('is_active') isActive!: boolean;
  @field('order_position') orderPosition!: number;
  @field('reschedule_count') rescheduleCount!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

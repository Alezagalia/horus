import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Event extends Model {
  static table = 'events';

  @field('category_id') categoryId!: string;
  @field('title') title!: string;
  @field('description') description?: string;
  @field('location') location?: string;
  @date('start_date_time') startDateTime!: Date;
  @date('end_date_time') endDateTime!: Date;
  @field('is_all_day') isAllDay!: boolean;
  /** Los recurrentes y sus instancias los genera el server (rrule). */
  @field('is_recurring') isRecurring!: boolean;
  @field('recurring_event_id') recurringEventId?: string;
  @field('status') status!: string; // 'pendiente' | 'completado' | 'cancelado'
  @date('completed_at') completedAt?: Date;
  @date('canceled_at') canceledAt?: Date;
  /** Lo setea el cron de archivado del server; el cliente solo filtra. */
  @date('archived_at') archivedAt?: Date;
  @field('reminder_minutes') reminderMinutes?: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

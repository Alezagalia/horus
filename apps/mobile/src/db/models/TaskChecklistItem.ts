import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class TaskChecklistItem extends Model {
  static table = 'task_checklist_items';

  @field('task_id') taskId!: string;
  @field('title') title!: string;
  @field('completed') completed!: boolean;
  @field('position') position!: number;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

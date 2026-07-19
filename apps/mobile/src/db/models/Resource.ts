import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Resource extends Model {
  static table = 'resources';

  @field('category_id') categoryId?: string;
  @field('type') type!: string; // 'NOTE' | 'SNIPPET' | 'BOOKMARK'
  @field('title') title!: string;
  @field('description') description?: string;
  @field('content') content?: string;
  @field('url') url?: string;
  @field('language') language?: string;
  /** JSON passthrough (favicon/preview de bookmarks creados en web). */
  @field('metadata') metadata?: string;
  /** JSON de string[] — parsear con tagsArray(). */
  @field('tags') tags!: string;
  @field('is_pinned') isPinned!: boolean;
  @field('color') color?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get tagsArray(): string[] {
    try {
      const parsed = JSON.parse(this.tags || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

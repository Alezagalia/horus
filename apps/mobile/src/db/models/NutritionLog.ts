import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

/** Registro diario real — date = medianoche UTC (unique por usuario). */
export class NutritionLog extends Model {
  static table = 'nutrition_logs';

  @date('date') date!: Date;
  @field('notes') notes?: string;
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}

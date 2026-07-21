import type { ColumnSchema } from '@nozbe/watermelondb';

/**
 * Tablas de la Fase 4 (nutricion + fitness), espejo de los `Raw` del backend
 * (`apps/backend/src/services/replication/types.ts`). Definidas una sola vez
 * y compartidas entre schema.ts (tableSchema) y migrations.ts (createTable)
 * para que no puedan divergir. Timestamps en ms; Decimal del server -> number.
 */
export const NUTRITION_FITNESS_TABLES: { name: string; columns: ColumnSchema[] }[] = [
  {
    name: 'foods',
    columns: [
      { name: 'name', type: 'string' },
      { name: 'brand', type: 'string', isOptional: true },
      { name: 'calories', type: 'number' },
      { name: 'protein', type: 'number' },
      { name: 'carbs', type: 'number' },
      { name: 'fat', type: 'number' },
      { name: 'fiber', type: 'number', isOptional: true },
      { name: 'unit', type: 'string' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'recipes',
    columns: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string', isOptional: true },
      { name: 'servings', type: 'number' },
      { name: 'is_active', type: 'boolean' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'recipe_ingredients',
    columns: [
      { name: 'recipe_id', type: 'string', isIndexed: true },
      { name: 'food_id', type: 'string', isIndexed: true },
      { name: 'grams', type: 'number' },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'meal_plans',
    columns: [
      // Medianoche UTC del lunes (ms) — unique (userId, weekStart) en el server
      { name: 'week_start', type: 'number', isIndexed: true },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'meal_entries',
    columns: [
      { name: 'meal_plan_id', type: 'string', isIndexed: true },
      { name: 'day', type: 'number', isIndexed: true },
      { name: 'meal_time', type: 'string' }, // BREAKFAST | MORNING_SNACK | LUNCH | AFTERNOON_SNACK | DINNER
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'meal_entry_items',
    columns: [
      { name: 'meal_entry_id', type: 'string', isIndexed: true },
      { name: 'food_id', type: 'string', isOptional: true },
      { name: 'recipe_id', type: 'string', isOptional: true },
      { name: 'grams', type: 'number' },
      { name: 'servings', type: 'number', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'nutrition_logs',
    columns: [
      // Medianoche UTC del día (ms) — unique (userId, date) en el server
      { name: 'date', type: 'number', isIndexed: true },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'nutrition_log_items',
    columns: [
      { name: 'nutrition_log_id', type: 'string', isIndexed: true },
      { name: 'food_id', type: 'string', isOptional: true },
      { name: 'meal_time', type: 'string' },
      { name: 'grams', type: 'number' },
      { name: 'servings', type: 'number', isOptional: true },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'shopping_lists',
    columns: [
      { name: 'meal_plan_id', type: 'string', isOptional: true },
      { name: 'name', type: 'string' },
      { name: 'transaction_id', type: 'string', isOptional: true },
      { name: 'generated_at', type: 'number', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'shopping_list_items',
    columns: [
      { name: 'shopping_list_id', type: 'string', isIndexed: true },
      { name: 'food_id', type: 'string', isOptional: true },
      { name: 'name', type: 'string' },
      { name: 'quantity', type: 'number' },
      { name: 'unit', type: 'string' },
      { name: 'checked', type: 'boolean' },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'exercises',
    columns: [
      { name: 'name', type: 'string' },
      { name: 'muscle_group', type: 'string', isOptional: true }, // pecho | espalda | ... | otro
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'routines',
    columns: [
      { name: 'name', type: 'string' },
      { name: 'description', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'routine_exercises',
    columns: [
      { name: 'routine_id', type: 'string', isIndexed: true },
      { name: 'exercise_id', type: 'string', isIndexed: true },
      { name: 'sort_order', type: 'number' }, // `order` en Prisma (keyword SQL)
      { name: 'target_sets', type: 'number', isOptional: true },
      { name: 'target_reps', type: 'number', isOptional: true },
      { name: 'target_weight', type: 'number', isOptional: true },
      { name: 'rest_time', type: 'number', isOptional: true },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'workouts',
    columns: [
      { name: 'routine_id', type: 'string', isOptional: true },
      { name: 'start_time', type: 'number', isIndexed: true },
      { name: 'end_time', type: 'number', isOptional: true }, // null = en progreso
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'workout_exercises',
    columns: [
      { name: 'workout_id', type: 'string', isIndexed: true },
      { name: 'exercise_id', type: 'string' },
      { name: 'sort_order', type: 'number' },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'rpe', type: 'number', isOptional: true },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
  {
    name: 'workout_sets',
    columns: [
      { name: 'workout_exercise_id', type: 'string', isIndexed: true },
      { name: 'set_number', type: 'number' },
      { name: 'reps', type: 'number' },
      { name: 'weight', type: 'number' },
      { name: 'weight_unit', type: 'string' }, // kg | lbs
      { name: 'completed', type: 'boolean' },
      { name: 'rest_time', type: 'number', isOptional: true },
      { name: 'notes', type: 'string', isOptional: true },
      { name: 'timestamp', type: 'number' },
      { name: 'created_at', type: 'number' },
      { name: 'updated_at', type: 'number' },
    ],
  },
];

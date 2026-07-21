import { Q } from '@nozbe/watermelondb';
import { database } from './index';
import { Food as FoodModel } from './models/Food';
import { Recipe as RecipeModel } from './models/Recipe';
import { RecipeIngredient as RecipeIngredientModel } from './models/RecipeIngredient';
import { MealPlan as MealPlanModel } from './models/MealPlan';
import { MealEntry as MealEntryModel } from './models/MealEntry';
import { MealEntryItem as MealEntryItemModel } from './models/MealEntryItem';
import { NutritionLog as NutritionLogModel } from './models/NutritionLog';
import { NutritionLogItem as NutritionLogItemModel } from './models/NutritionLogItem';
import { ShoppingList as ShoppingListModel } from './models/ShoppingList';
import { ShoppingListItem as ShoppingListItemModel } from './models/ShoppingListItem';
import type {
  Food,
  FoodFilters,
  MacroTotals,
  MealTime,
  MealPlanWithEntries,
  MealEntry,
  MealEntryItem,
  DayMacros,
  NutritionLog,
  NutritionLogItem,
  Recipe,
  RecipeWithIngredients,
  ShoppingList,
  ShoppingListItem,
} from '@horus/shared';

/**
 * Lecturas locales de nutrición (offline-first). Devuelven las MISMAS formas
 * que la API REST (tipos de @horus/shared) para que la UI no cambie; las
 * macros se calculan acá, espejando `calcMacrosForAmount` del backend
 * (`recipe.service.ts`): macros por 100g × grams/100.
 */

export const foods = () => database.get<FoodModel>('foods');
export const recipes = () => database.get<RecipeModel>('recipes');
export const recipeIngredients = () => database.get<RecipeIngredientModel>('recipe_ingredients');
export const mealPlans = () => database.get<MealPlanModel>('meal_plans');
export const mealEntries = () => database.get<MealEntryModel>('meal_entries');
export const mealEntryItems = () => database.get<MealEntryItemModel>('meal_entry_items');
export const nutritionLogs = () => database.get<NutritionLogModel>('nutrition_logs');
export const nutritionLogItems = () => database.get<NutritionLogItemModel>('nutrition_log_items');
export const shoppingLists = () => database.get<ShoppingListModel>('shopping_lists');
export const shoppingListItems = () => database.get<ShoppingListItemModel>('shopping_list_items');

export const EMPTY_MACROS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export function addMacros(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  };
}

export function calcMacrosForAmount(
  food: Pick<Food, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber'>,
  grams: number
): MacroTotals {
  const factor = grams / 100;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
    fiber: food.fiber != null ? food.fiber * factor : 0,
  };
}

/** 'yyyy-MM-dd' → medianoche UTC en ms (misma normalización que el server). */
export function utcMidnightMs(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function toFood(f: FoodModel): Food {
  return {
    id: f.id,
    userId: '', // no se replica (siempre el usuario logueado)
    name: f.name,
    brand: f.brand ?? null,
    calories: f.calories,
    protein: f.protein,
    carbs: f.carbs,
    fat: f.fat,
    fiber: f.fiber ?? null,
    unit: f.unit,
    isActive: f.isActive,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  };
}

function toRecipe(r: RecipeModel): Recipe {
  return {
    id: r.id,
    userId: '',
    name: r.name,
    description: r.description ?? null,
    servings: r.servings,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ─── Foods ────────────────────────────────────────────────────────────────────

export async function listFoodsLocal(filters?: FoodFilters): Promise<Food[]> {
  const clauses = [Q.where('is_active', filters?.isActive ?? true)];
  const rows = await foods()
    .query(...clauses)
    .fetch();
  let items = rows.map(toFood);

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    items = items.filter(
      (f) => f.name.toLowerCase().includes(term) || (f.brand ?? '').toLowerCase().includes(term)
    );
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return items;
}

async function foodsById(ids: string[]): Promise<Map<string, Food>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const rows = await foods()
    .query(Q.where('id', Q.oneOf(unique)))
    .fetch();
  return new Map(rows.map((f) => [f.id, toFood(f)]));
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

async function buildRecipesWithIngredients(
  recipeRows: RecipeModel[]
): Promise<RecipeWithIngredients[]> {
  if (recipeRows.length === 0) return [];
  const ingredientRows = await recipeIngredients()
    .query(Q.where('recipe_id', Q.oneOf(recipeRows.map((r) => r.id))))
    .fetch();
  const foodMap = await foodsById(ingredientRows.map((i) => i.foodId));

  return recipeRows.map((r) => {
    const ingredients = ingredientRows
      .filter((i) => i.recipeId === r.id && foodMap.has(i.foodId))
      .map((i) => ({
        id: i.id,
        recipeId: i.recipeId,
        foodId: i.foodId,
        food: foodMap.get(i.foodId)!,
        grams: i.grams,
        notes: i.notes ?? null,
      }));

    const total = ingredients.reduce(
      (acc, ing) => addMacros(acc, calcMacrosForAmount(ing.food, ing.grams)),
      { ...EMPTY_MACROS }
    );
    const servings = r.servings || 1;
    const macrosPerServing: MacroTotals = {
      calories: total.calories / servings,
      protein: total.protein / servings,
      carbs: total.carbs / servings,
      fat: total.fat / servings,
      fiber: total.fiber / servings,
    };

    return { ...toRecipe(r), ingredients, macrosPerServing };
  });
}

export async function getRecipeLocal(id: string): Promise<RecipeWithIngredients> {
  const recipe = await recipes().find(id);
  const [built] = await buildRecipesWithIngredients([recipe]);
  return built;
}

export async function listRecipesLocal(): Promise<RecipeWithIngredients[]> {
  const rows = await recipes().query(Q.where('is_active', true)).fetch();
  const result = await buildRecipesWithIngredients(rows);
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// ─── Nutrition Logs ───────────────────────────────────────────────────────────

export async function getNutritionLogLocal(date: string): Promise<NutritionLog | null> {
  const rows = await nutritionLogs()
    .query(Q.where('date', utcMidnightMs(date)))
    .fetch();
  if (rows.length === 0) return null;
  const log = rows[0];

  const itemRows = await nutritionLogItems().query(Q.where('nutrition_log_id', log.id)).fetch();
  const foodMap = await foodsById(itemRows.map((i) => i.foodId ?? ''));

  const items: NutritionLogItem[] = itemRows.map((i) => {
    const food = i.foodId ? (foodMap.get(i.foodId) ?? null) : null;
    return {
      id: i.id,
      nutritionLogId: i.nutritionLogId,
      foodId: i.foodId ?? null,
      food,
      mealTime: i.mealTime as MealTime,
      grams: i.grams,
      servings: i.servings ?? null,
      notes: i.notes ?? null,
      macros: food ? calcMacrosForAmount(food, i.grams) : { ...EMPTY_MACROS },
    };
  });
  items.sort((a, b) => a.mealTime.localeCompare(b.mealTime));

  return {
    id: log.id,
    userId: '',
    date: toDateStr(log.date),
    notes: log.notes ?? null,
    items,
    dayMacros: items.reduce((acc, i) => addMacros(acc, i.macros), { ...EMPTY_MACROS }),
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  };
}

// ─── Meal Plans ───────────────────────────────────────────────────────────────

async function buildEntries(plan: MealPlanModel): Promise<MealEntry[]> {
  const entryRows = await mealEntries().query(Q.where('meal_plan_id', plan.id)).fetch();
  if (entryRows.length === 0) return [];

  const itemRows = await mealEntryItems()
    .query(Q.where('meal_entry_id', Q.oneOf(entryRows.map((e) => e.id))))
    .fetch();
  const foodMap = await foodsById(itemRows.map((i) => i.foodId ?? ''));
  const recipeIds = [...new Set(itemRows.map((i) => i.recipeId).filter(Boolean))] as string[];
  const recipeRows = recipeIds.length
    ? await recipes()
        .query(Q.where('id', Q.oneOf(recipeIds)))
        .fetch()
    : [];
  const recipesWithIngredients = await buildRecipesWithIngredients(recipeRows);
  const recipeMap = new Map(recipesWithIngredients.map((r) => [r.id, r]));

  const entries = entryRows.map((e): MealEntry => {
    const items = itemRows
      .filter((i) => i.mealEntryId === e.id)
      .map((i): MealEntryItem => {
        const food = i.foodId ? (foodMap.get(i.foodId) ?? null) : null;
        const recipe = i.recipeId ? (recipeMap.get(i.recipeId) ?? null) : null;

        let macros: MacroTotals = { ...EMPTY_MACROS };
        if (food) {
          macros = calcMacrosForAmount(food, i.grams);
        } else if (recipe) {
          // macros de la receta completa / porciones × servings (como el server)
          const totalRecipe = recipe.ingredients.reduce(
            (acc, ing) => addMacros(acc, calcMacrosForAmount(ing.food, ing.grams)),
            { ...EMPTY_MACROS }
          );
          const servings = i.servings ?? 1;
          const rs = recipe.servings || 1;
          macros = {
            calories: (totalRecipe.calories / rs) * servings,
            protein: (totalRecipe.protein / rs) * servings,
            carbs: (totalRecipe.carbs / rs) * servings,
            fat: (totalRecipe.fat / rs) * servings,
            fiber: (totalRecipe.fiber / rs) * servings,
          };
        }

        return {
          id: i.id,
          mealEntryId: i.mealEntryId,
          foodId: i.foodId ?? null,
          recipeId: i.recipeId ?? null,
          food,
          recipe,
          grams: i.grams,
          servings: i.servings ?? null,
          macros,
        };
      });

    return {
      id: e.id,
      mealPlanId: e.mealPlanId,
      day: toDateStr(e.day),
      mealTime: e.mealTime as MealTime,
      notes: e.notes ?? null,
      items,
      macros: items.reduce((acc, i) => addMacros(acc, i.macros), { ...EMPTY_MACROS }),
    };
  });

  entries.sort((a, b) => a.day.localeCompare(b.day) || a.mealTime.localeCompare(b.mealTime));
  return entries;
}

export async function getMealPlanByWeekLocal(
  weekStart: string
): Promise<MealPlanWithEntries | null> {
  const rows = await mealPlans()
    .query(Q.where('week_start', utcMidnightMs(weekStart)))
    .fetch();
  if (rows.length === 0) return null;
  const plan = rows[0];

  return {
    id: plan.id,
    userId: '',
    weekStart: toDateStr(plan.weekStart),
    notes: plan.notes ?? null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
    entries: await buildEntries(plan),
  };
}

const MEAL_TIMES: MealTime[] = ['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER'];

export async function getMealPlanMacrosLocal(mealPlanId: string): Promise<DayMacros[]> {
  const plan = await mealPlans().find(mealPlanId);
  const entries = await buildEntries(plan);

  const byDay = new Map<string, MealEntry[]>();
  for (const entry of entries) {
    const list = byDay.get(entry.day) ?? [];
    list.push(entry);
    byDay.set(entry.day, list);
  }

  return [...byDay.entries()].map(([day, dayEntries]) => {
    const byMealTime = Object.fromEntries(
      MEAL_TIMES.map((mt) => [
        mt,
        dayEntries
          .filter((e) => e.mealTime === mt)
          .reduce((acc, e) => addMacros(acc, e.macros), { ...EMPTY_MACROS }),
      ])
    ) as Record<MealTime, MacroTotals>;

    return {
      day,
      macros: dayEntries.reduce((acc, e) => addMacros(acc, e.macros), { ...EMPTY_MACROS }),
      byMealTime,
    };
  });
}

// ─── Shopping Lists ───────────────────────────────────────────────────────────

async function toShoppingList(list: ShoppingListModel): Promise<ShoppingList> {
  const itemRows = await shoppingListItems().query(Q.where('shopping_list_id', list.id)).fetch();
  const foodMap = await foodsById(itemRows.map((i) => i.foodId ?? ''));

  const items: ShoppingListItem[] = itemRows
    .map((i) => ({
      id: i.id,
      shoppingListId: i.shoppingListId,
      foodId: i.foodId ?? null,
      food: i.foodId ? (foodMap.get(i.foodId) ?? null) : null,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      checked: i.checked,
      notes: i.notes ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: list.id,
    userId: '',
    mealPlanId: list.mealPlanId ?? null,
    name: list.name,
    transactionId: list.transactionId ?? null,
    generatedAt: list.generatedAt?.toISOString() ?? null,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
    items,
  };
}

export async function listShoppingListsLocal(): Promise<ShoppingList[]> {
  const rows = await shoppingLists().query().fetch();
  const lists = await Promise.all(rows.map(toShoppingList));
  lists.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return lists;
}

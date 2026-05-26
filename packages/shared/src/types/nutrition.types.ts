/**
 * Nutrition Types - F-17
 */

export type MealTime = 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'DINNER';

// ─── Food ────────────────────────────────────────────────────────────────────

export interface Food {
  id: string;
  userId: string;
  name: string;
  brand: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFoodDTO {
  name: string;
  brand?: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  unit?: string;
}

export interface UpdateFoodDTO {
  name?: string;
  brand?: string | null;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number | null;
  unit?: string;
  isActive?: boolean;
}

export interface FoodFilters {
  search?: string;
  isActive?: boolean;
}

export interface FoodsResponse {
  foods: Food[];
}

// ─── Recipe ──────────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  foodId: string;
  food: Food;
  grams: number;
  notes: string | null;
}

export interface RecipeIngredientDTO {
  foodId: string;
  grams: number;
  notes?: string | null;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  servings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
  macrosPerServing: MacroTotals;
}

export interface CreateRecipeDTO {
  name: string;
  description?: string | null;
  servings?: number;
  ingredients?: RecipeIngredientDTO[];
}

export interface UpdateRecipeDTO {
  name?: string;
  description?: string | null;
  servings?: number;
  isActive?: boolean;
}

export interface RecipesResponse {
  recipes: RecipeWithIngredients[];
}

// ─── Macros ───────────────────────────────────────────────────────────────────

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ─── MealPlan ─────────────────────────────────────────────────────────────────

export interface MealEntryItem {
  id: string;
  mealEntryId: string;
  foodId: string | null;
  recipeId: string | null;
  food: Food | null;
  recipe: Recipe | null;
  grams: number;
  servings: number | null;
  macros: MacroTotals;
}

export interface MealEntry {
  id: string;
  mealPlanId: string;
  day: string;
  mealTime: MealTime;
  notes: string | null;
  items: MealEntryItem[];
  macros: MacroTotals;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanWithEntries extends MealPlan {
  entries: MealEntry[];
}

export interface DayMacros {
  day: string;
  macros: MacroTotals;
  byMealTime: Record<MealTime, MacroTotals>;
}

export interface MealPlanWithMacros extends MealPlanWithEntries {
  dayMacros: DayMacros[];
}

export interface CreateMealPlanDTO {
  weekStart: string;
  notes?: string | null;
}

export interface AddMealEntryDTO {
  day: string;
  mealTime: MealTime;
  notes?: string | null;
  items: AddMealEntryItemDTO[];
}

export interface AddMealEntryItemDTO {
  foodId?: string | null;
  recipeId?: string | null;
  grams: number;
  servings?: number | null;
}

export interface MealPlansResponse {
  mealPlans: MealPlan[];
}

// ─── NutritionLog ─────────────────────────────────────────────────────────────

export interface NutritionLogItem {
  id: string;
  nutritionLogId: string;
  foodId: string | null;
  food: Food | null;
  mealTime: MealTime;
  grams: number;
  servings: number | null;
  notes: string | null;
  macros: MacroTotals;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string;
  notes: string | null;
  items: NutritionLogItem[];
  dayMacros: MacroTotals;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionLogDTO {
  date: string;
  notes?: string | null;
}

export interface AddNutritionLogItemDTO {
  foodId?: string | null;
  mealTime: MealTime;
  grams: number;
  servings?: number | null;
  notes?: string | null;
}

export interface UpdateNutritionLogDTO {
  notes?: string | null;
  items?: AddNutritionLogItemDTO[];
}

// ─── ShoppingList ─────────────────────────────────────────────────────────────

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  foodId: string | null;
  food: Food | null;
  name: string;
  quantity: number;
  unit: string;
  checked: boolean;
  notes: string | null;
}

export interface ShoppingList {
  id: string;
  userId: string;
  mealPlanId: string | null;
  name: string;
  transactionId: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ShoppingListItem[];
}

export interface CreateShoppingListDTO {
  name: string;
  mealPlanId?: string | null;
  items?: CreateShoppingListItemDTO[];
}

export interface CreateShoppingListItemDTO {
  foodId?: string | null;
  name: string;
  quantity: number;
  unit: string;
  notes?: string | null;
}

export interface LinkTransactionDTO {
  transactionId: string;
}

export interface ShoppingListsResponse {
  shoppingLists: ShoppingList[];
}

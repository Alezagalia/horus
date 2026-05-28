import { axiosInstance } from '../axios';
import type {
  Food,
  FoodFilters,
  CreateFoodDTO,
  UpdateFoodDTO,
  NutritionLog,
  UpdateNutritionLogDTO,
  AddNutritionLogItemDTO,
} from '@horus/shared';

export const nutritionApi = {
  // ─── Foods ───────────────────────────────────────────────────────────────────

  listFoods: async (filters?: FoodFilters): Promise<Food[]> => {
    const { data } = await axiosInstance.get('/foods', { params: filters });
    return data.foods ?? [];
  },

  createFood: async (dto: CreateFoodDTO): Promise<Food> => {
    const { data } = await axiosInstance.post('/foods', dto);
    return data.food ?? data;
  },

  updateFood: async (id: string, dto: UpdateFoodDTO): Promise<Food> => {
    const { data } = await axiosInstance.put(`/foods/${id}`, dto);
    return data.food ?? data;
  },

  deleteFood: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/foods/${id}`);
  },

  // ─── Nutrition Logs ───────────────────────────────────────────────────────────

  getLog: async (date: string): Promise<NutritionLog | null> => {
    const { data } = await axiosInstance.get(`/nutrition-logs/${date}`);
    return data.log ?? null;
  },

  upsertLog: async (date: string, dto: UpdateNutritionLogDTO): Promise<NutritionLog> => {
    const { data } = await axiosInstance.put(`/nutrition-logs/${date}`, dto);
    return data.log ?? data;
  },

  addLogItem: async (date: string, item: AddNutritionLogItemDTO): Promise<NutritionLog> => {
    // upsert with the new item appended to current log
    const current = await nutritionApi.getLog(date);
    const existingItems =
      current?.items.map((i) => ({
        foodId: i.foodId,
        mealTime: i.mealTime,
        grams: i.grams,
        servings: i.servings,
        notes: i.notes,
      })) ?? [];
    return nutritionApi.upsertLog(date, { items: [...existingItems, item] });
  },

  removeLogItem: async (date: string, itemId: string): Promise<NutritionLog> => {
    const current = await nutritionApi.getLog(date);
    const items =
      current?.items
        .filter((i) => i.id !== itemId)
        .map((i) => ({
          foodId: i.foodId,
          mealTime: i.mealTime,
          grams: i.grams,
          servings: i.servings,
          notes: i.notes,
        })) ?? [];
    return nutritionApi.upsertLog(date, { items });
  },
};

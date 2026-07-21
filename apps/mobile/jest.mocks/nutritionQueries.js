const EMPTY_MACROS = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

module.exports = {
  EMPTY_MACROS,
  addMacros: jest.fn((a, b) => ({
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: a.fiber + b.fiber,
  })),
  calcMacrosForAmount: jest.fn(() => ({ ...EMPTY_MACROS })),
  utcMidnightMs: jest.fn((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  }),
  listFoodsLocal: jest.fn(),
  getNutritionLogLocal: jest.fn(),
  listRecipesLocal: jest.fn(),
  getRecipeLocal: jest.fn(),
  getMealPlanByWeekLocal: jest.fn(),
  getMealPlanMacrosLocal: jest.fn(),
  listShoppingListsLocal: jest.fn(),
};

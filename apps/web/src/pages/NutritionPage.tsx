/**
 * NutritionPage - Hub principal de nutrición
 * F-17 - Planificador de Comidas / Nutrición
 */

import { useState } from 'react';
import { FoodCard } from '@/components/nutrition/FoodCard';
import { FoodFormModal } from '@/components/nutrition/FoodFormModal';
import { RecipeCard } from '@/components/nutrition/RecipeCard';
import { RecipeFormModal } from '@/components/nutrition/RecipeFormModal';
import { MealPlanGrid } from '@/components/nutrition/MealPlanGrid';
import { DayMacrosSummary } from '@/components/nutrition/DayMacrosSummary';
import { NutritionLogDay } from '@/components/nutrition/NutritionLogDay';
import { ShoppingListPanel } from '@/components/nutrition/ShoppingListPanel';
import {
  useFoods,
  useDeleteFood,
  useRecipes,
  useDeleteRecipe,
  useMealPlanByWeek,
  useMealPlanMacros,
  useCreateMealPlan,
  useNutritionLog,
  useShoppingLists,
  useCreateShoppingList,
} from '@/hooks/useNutrition';
import type { Food, RecipeWithIngredients } from '@horus/shared';

type Tab = 'foods' | 'recipes' | 'planner' | 'log' | 'shopping';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'foods', label: 'Alimentos', icon: '🥗' },
  { id: 'recipes', label: 'Recetas', icon: '🍳' },
  { id: 'planner', label: 'Planificador', icon: '📅' },
  { id: 'log', label: 'Registro', icon: '📝' },
  { id: 'shopping', label: 'Compras', icon: '🛒' },
];

function getMonday(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function NutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('foods');
  const [foodModal, setFoodModal] = useState(false);
  const [editFood, setEditFood] = useState<Food | null>(null);
  const [recipeModal, setRecipeModal] = useState(false);
  const [editRecipe, setEditRecipe] = useState<RecipeWithIngredients | null>(null);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Nutrición</h1>
          <p className="text-gray-500 text-sm mt-1">Planifica tu alimentación y registra macros</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1.5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'foods' && (
        <FoodsTab
          onAdd={() => {
            setEditFood(null);
            setFoodModal(true);
          }}
          onEdit={(f) => {
            setEditFood(f);
            setFoodModal(true);
          }}
        />
      )}
      {activeTab === 'recipes' && (
        <RecipesTab
          onAdd={() => {
            setEditRecipe(null);
            setRecipeModal(true);
          }}
          onEdit={(r) => {
            setEditRecipe(r);
            setRecipeModal(true);
          }}
        />
      )}
      {activeTab === 'planner' && <PlannerTab weekStart={weekStart} onWeekChange={setWeekStart} />}
      {activeTab === 'log' && <LogTab date={today} />}
      {activeTab === 'shopping' && <ShoppingTab />}

      <FoodFormModal open={foodModal} onClose={() => setFoodModal(false)} food={editFood} />
      <RecipeFormModal
        open={recipeModal}
        onClose={() => setRecipeModal(false)}
        recipe={editRecipe}
      />
    </div>
  );
}

// ─── Tab components ───────────────────────────────────────────────────────────

function FoodsTab({ onAdd, onEdit }: { onAdd: () => void; onEdit: (f: Food) => void }) {
  const { data: foods = [], isLoading } = useFoods();
  const { mutate: deleteFood } = useDeleteFood();
  const [search, setSearch] = useState('');

  const filtered = search
    ? foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))
    : foods;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimentos..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        <button
          onClick={onAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
        >
          + Nuevo alimento
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {search ? 'Sin resultados' : 'Agrega tu primer alimento'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onEdit={onEdit}
              onDelete={(f) => deleteFood(f.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipesTab({
  onAdd,
  onEdit,
}: {
  onAdd: () => void;
  onEdit: (r: RecipeWithIngredients) => void;
}) {
  const { data: recipes = [], isLoading } = useRecipes();
  const { mutate: deleteRecipe } = useDeleteRecipe();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all"
        >
          + Nueva receta
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Agrega tu primera receta</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recipes.map(
            (recipe) =>
              recipe && (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={onEdit}
                  onDelete={(r) => deleteRecipe(r.id)}
                />
              )
          )}
        </div>
      )}
    </div>
  );
}

function PlannerTab({
  weekStart,
  onWeekChange,
}: {
  weekStart: string;
  onWeekChange: (w: string) => void;
}) {
  const { data: mealPlan, isLoading } = useMealPlanByWeek(weekStart);
  const { data: dayMacros = [] } = useMealPlanMacros(mealPlan?.id ?? '');
  const { mutate: createPlan, isPending: creating } = useCreateMealPlan();

  const prevWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    onWeekChange(d.toISOString().split('T')[0]);
  };
  const nextWeek = () => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    onWeekChange(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center gap-4">
        <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          Semana del{' '}
          {new Date(weekStart + 'T12:00:00').toLocaleDateString('es', {
            day: 'numeric',
            month: 'long',
          })}
        </span>
        <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : !mealPlan ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No hay plan para esta semana</p>
          <button
            onClick={() => createPlan({ weekStart })}
            disabled={creating}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
          >
            {creating ? 'Creando...' : 'Crear plan para esta semana'}
          </button>
        </div>
      ) : (
        <>
          {dayMacros.length > 0 && <DayMacrosSummary dayMacros={dayMacros} />}
          <MealPlanGrid mealPlan={mealPlan} />
        </>
      )}
    </div>
  );
}

function LogTab({ date }: { date: string }) {
  const { data: log, isLoading } = useNutritionLog(date);

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          {new Date(date + 'T12:00:00').toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </span>
      </div>
      <NutritionLogDay date={date} log={log ?? null} />
    </div>
  );
}

function ShoppingTab() {
  const { data: lists = [], isLoading } = useShoppingLists();
  const { mutate: createList, isPending: creating } = useCreateShoppingList();

  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createList({ name: newName.trim() }, { onSuccess: () => setNewName('') });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nombre de la lista..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim() || creating}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all"
        >
          {creating ? '...' : '+ Nueva lista'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Crea tu primera lista de compras o genérala desde el Planificador
        </div>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => list && <ShoppingListPanel key={list.id} list={list} />)}
        </div>
      )}
    </div>
  );
}

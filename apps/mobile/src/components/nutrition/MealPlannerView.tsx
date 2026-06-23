import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { format, startOfWeek, addDays, addWeeks, parseISO, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flame,
  ShoppingCart,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useMealPlanByWeek,
  useMealPlanMacros,
  useCreateMealPlan,
  useAddMealEntry,
  useRemoveMealEntry,
  useGenerateShoppingList,
  useRecipes,
} from '@/hooks/useNutrition';
import { FoodPickerModal } from './FoodPickerModal';
import type {
  MealTime,
  MealPlanWithEntries,
  Food,
  RecipeWithIngredients,
  MacroTotals,
} from '@horus/shared';

const MEAL_TIMES: { key: MealTime; label: string; emoji: string }[] = [
  { key: 'BREAKFAST', label: 'Desayuno', emoji: '🌅' },
  { key: 'MORNING_SNACK', label: 'Media mañana', emoji: '🍎' },
  { key: 'LUNCH', label: 'Almuerzo', emoji: '🍽️' },
  { key: 'AFTERNOON_SNACK', label: 'Merienda', emoji: '☕' },
  { key: 'DINNER', label: 'Cena', emoji: '🌙' },
];

const EMPTY_MACROS: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

// ─── Add meal entry modal ───────────────────────────────────────────────────────

function AddMealEntryModal({
  mealPlanId,
  day,
  mealTime,
  onClose,
}: {
  mealPlanId: string;
  day: string;
  mealTime: MealTime;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'food' | 'recipe'>('food');
  const [food, setFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [servings, setServings] = useState('1');
  const [showPicker, setShowPicker] = useState(false);

  const { data: recipes = [] } = useRecipes();
  const addEntry = useAddMealEntry();

  const handleAdd = () => {
    if (mode === 'food') {
      if (!food) return Alert.alert('Error', 'Elegí un alimento');
      const g = parseFloat(grams.replace(',', '.'));
      if (isNaN(g) || g <= 0) return Alert.alert('Error', 'Cantidad inválida');
      addEntry.mutate(
        { mealPlanId, dto: { day, mealTime, items: [{ foodId: food.id, grams: g }] } },
        { onSuccess: onClose, onError: () => Alert.alert('Error', 'No se pudo agregar') }
      );
    } else {
      if (!recipe) return Alert.alert('Error', 'Elegí una receta');
      const s = parseFloat(servings.replace(',', '.'));
      if (isNaN(s) || s <= 0) return Alert.alert('Error', 'Porciones inválidas');
      addEntry.mutate(
        {
          mealPlanId,
          dto: { day, mealTime, items: [{ recipeId: recipe.id, servings: s, grams: 1 }] },
        },
        { onSuccess: onClose, onError: () => Alert.alert('Error', 'No se pudo agregar') }
      );
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar a {mealLabel(mealTime)}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'food' && styles.modeBtnActive]}
              onPress={() => setMode('food')}
            >
              <Text style={[styles.modeLabel, mode === 'food' && styles.modeLabelActive]}>
                Alimento
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'recipe' && styles.modeBtnActive]}
              onPress={() => setMode('recipe')}
            >
              <Text style={[styles.modeLabel, mode === 'recipe' && styles.modeLabelActive]}>
                Receta
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'food' ? (
            <>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setShowPicker(true)}>
                <Text style={food ? styles.selectValue : styles.selectPlaceholder}>
                  {food ? food.name : 'Elegir alimento…'}
                </Text>
              </TouchableOpacity>
              {food && (
                <>
                  <Text style={styles.label}>Cantidad (gramos)</Text>
                  <TextInput
                    style={styles.input}
                    value={grams}
                    onChangeText={setGrams}
                    keyboardType="numeric"
                  />
                </>
              )}
            </>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {recipes.length === 0 ? (
                  <Text style={styles.empty}>
                    No tenés recetas. Creá una en la pestaña Recetas.
                  </Text>
                ) : (
                  recipes.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.recipeRow, recipe?.id === r.id && styles.recipeRowActive]}
                      onPress={() => setRecipe(r)}
                    >
                      <Text style={styles.ingName}>{r.name}</Text>
                      <Text style={styles.ingMeta}>
                        {Math.round(r.macrosPerServing.calories)} kcal/porción · {r.servings} porc.
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              {recipe && (
                <>
                  <Text style={styles.label}>Porciones</Text>
                  <TextInput
                    style={styles.input}
                    value={servings}
                    onChangeText={setServings}
                    keyboardType="numeric"
                  />
                </>
              )}
            </>
          )}

          <Button
            label="Agregar"
            onPress={handleAdd}
            loading={addEntry.isPending}
            disabled={mode === 'food' ? !food : !recipe}
            style={{ marginTop: Spacing.md }}
          />
        </View>
      </KeyboardAvoidingView>

      <FoodPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(f) => {
          setFood(f);
          setShowPicker(false);
        }}
      />
    </Modal>
  );
}

function mealLabel(mt: MealTime): string {
  return MEAL_TIMES.find((m) => m.key === mt)?.label ?? mt;
}

// ─── Main view ──────────────────────────────────────────────────────────────────

export function MealPlannerView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [addTarget, setAddTarget] = useState<{ day: string; mealTime: MealTime } | null>(null);

  const weekStartDate = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const weekStart = format(weekStartDate, 'yyyy-MM-dd');
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  );

  // Mantener selectedDay dentro de la semana visible
  useEffect(() => {
    const inWeek = weekDays.some((d) => format(d, 'yyyy-MM-dd') === selectedDay);
    if (!inWeek) setSelectedDay(format(weekDays[0], 'yyyy-MM-dd'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const { data: plan, isLoading } = useMealPlanByWeek(weekStart);
  const { data: dayMacros = [] } = useMealPlanMacros(plan?.id);
  const createPlan = useCreateMealPlan();
  const removeEntry = useRemoveMealEntry();
  const generateList = useGenerateShoppingList();

  const selectedMacros = dayMacros.find((d) => d.day === selectedDay)?.macros ?? EMPTY_MACROS;

  const handleGenerate = () => {
    if (!plan) return;
    generateList.mutate(
      { mealPlanId: plan.id, name: `Compras semana ${weekStart}` },
      {
        onSuccess: () => Alert.alert('Listo', 'Lista de compras generada (pestaña Compras).'),
        onError: () => Alert.alert('Error', 'No se pudo generar la lista'),
      }
    );
  };

  return (
    <View>
      {/* Week nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)} hitSlop={8}>
          <ChevronLeft size={20} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          Semana del {format(weekStartDate, "d 'de' MMM", { locale: es })}
        </Text>
        <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)} hitSlop={8}>
          <ChevronRight size={20} color={Colors.ink} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: Spacing.xl }} />
      ) : !plan ? (
        <Card solid style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sin plan para esta semana</Text>
          <Button
            label="Crear plan"
            onPress={() =>
              createPlan.mutate(
                { weekStart },
                { onError: () => Alert.alert('Error', 'No se pudo crear el plan') }
              )
            }
            loading={createPlan.isPending}
            style={{ marginTop: Spacing.md }}
          />
        </Card>
      ) : (
        <PlanContent
          plan={plan}
          weekDays={weekDays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          selectedMacros={selectedMacros}
          onAdd={(mealTime) => setAddTarget({ day: selectedDay, mealTime })}
          onRemoveEntry={(entryId) => removeEntry.mutate({ mealPlanId: plan.id, entryId })}
          onGenerate={handleGenerate}
          generating={generateList.isPending}
        />
      )}

      {addTarget && plan && (
        <AddMealEntryModal
          mealPlanId={plan.id}
          day={addTarget.day}
          mealTime={addTarget.mealTime}
          onClose={() => setAddTarget(null)}
        />
      )}
    </View>
  );
}

function PlanContent({
  plan,
  weekDays,
  selectedDay,
  onSelectDay,
  selectedMacros,
  onAdd,
  onRemoveEntry,
  onGenerate,
  generating,
}: {
  plan: MealPlanWithEntries;
  weekDays: Date[];
  selectedDay: string;
  onSelectDay: (d: string) => void;
  selectedMacros: MacroTotals;
  onAdd: (mealTime: MealTime) => void;
  onRemoveEntry: (entryId: string) => void;
  onGenerate: () => void;
  generating: boolean;
}) {
  const entriesForDay = plan.entries.filter((e) => e.day === selectedDay);

  return (
    <>
      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: Spacing.sm, paddingRight: Spacing.lg }}
        style={{ marginBottom: Spacing.md }}
      >
        {weekDays.map((d) => {
          const ds = format(d, 'yyyy-MM-dd');
          const active = ds === selectedDay;
          return (
            <TouchableOpacity
              key={ds}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => onSelectDay(ds)}
            >
              <Text style={[styles.dayChipDow, active && { color: '#fff' }]}>
                {format(d, 'EEE', { locale: es })}
              </Text>
              <Text style={[styles.dayChipNum, active && { color: '#fff' }]}>{format(d, 'd')}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Day macros */}
      <LinearGradient colors={Gradients.hero} style={styles.macroCard}>
        <Text style={styles.macroTitle}>
          {isSameDay(parseISO(selectedDay), new Date())
            ? 'Hoy'
            : format(parseISO(selectedDay), 'EEEE d', { locale: es }).replace(/^\w/, (c) =>
                c.toUpperCase()
              )}
        </Text>
        <View style={styles.macroPills}>
          <MacroMini label="kcal" value={selectedMacros.calories} color="#f59e0b" />
          <MacroMini label="P" value={selectedMacros.protein} color="#ef4444" />
          <MacroMini label="C" value={selectedMacros.carbs} color="#a5b4fc" />
          <MacroMini label="G" value={selectedMacros.fat} color="#10b981" />
        </View>
      </LinearGradient>

      {/* Meals */}
      {MEAL_TIMES.map(({ key, label, emoji }) => {
        const entries = entriesForDay.filter((e) => e.mealTime === key);
        const items = entries.flatMap((e) => e.items.map((it) => ({ entryId: e.id, it })));
        return (
          <View key={key} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealEmoji}>{emoji}</Text>
              <Text style={styles.mealLabel}>{label}</Text>
              <TouchableOpacity onPress={() => onAdd(key)} style={styles.mealAddBtn} hitSlop={8}>
                <Plus size={16} color={Colors.vivid} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {items.length > 0 ? (
              items.map(({ entryId, it }) => (
                <View key={it.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {it.recipe?.name ?? it.food?.name ?? '—'}
                      {it.recipeId ? ` · ${it.servings ?? 1} porc.` : ` · ${Math.round(it.grams)}g`}
                    </Text>
                    <Text style={styles.itemMacros}>
                      <Flame size={10} color="#f59e0b" /> {Math.round(it.macros.calories)} kcal · P:
                      {Math.round(it.macros.protein)} · C:{Math.round(it.macros.carbs)} · G:
                      {Math.round(it.macros.fat)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveEntry(entryId)} hitSlop={8}>
                    <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMeal}>Sin comidas</Text>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.genBtn} onPress={onGenerate} disabled={generating}>
        {generating ? (
          <ActivityIndicator size="small" color={Colors.vivid} />
        ) : (
          <>
            <ShoppingCart size={16} color={Colors.vivid} strokeWidth={2} />
            <Text style={styles.genLabel}>Generar lista de compras</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

function MacroMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.macroMini}>
      <Text style={[styles.macroMiniVal, { color }]}>{Math.round(value)}</Text>
      <Text style={styles.macroMiniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  weekLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.ink },

  dayChip: {
    width: 48,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceSolid,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  dayChipActive: { backgroundColor: Colors.vivid, borderColor: Colors.vivid },
  dayChipDow: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: Colors.muted,
    textTransform: 'capitalize',
  },
  dayChipNum: { fontFamily: 'Inter_700Bold', fontSize: 16, color: Colors.ink, marginTop: 2 },

  macroCard: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.nav,
  },
  macroTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#fff',
    marginBottom: Spacing.sm,
  },
  macroPills: { flexDirection: 'row', gap: Spacing.sm },
  macroMini: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  macroMiniVal: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  macroMiniLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  mealSection: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.card,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  mealEmoji: { fontSize: 18 },
  mealLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.ink, flex: 1 },
  mealAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.vivid + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  itemName: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.ink },
  itemMacros: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  emptyMeal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  genBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.vivid,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  genLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.vivid },

  emptyCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.ink },

  // modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.pill,
    padding: 3,
    marginBottom: Spacing.md,
  },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: Radius.pill, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Colors.vivid },
  modeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: Colors.muted },
  modeLabelActive: { color: '#fff' },
  selectBtn: {
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectValue: { fontFamily: 'Inter_500Medium', fontSize: 15, color: Colors.ink },
  selectPlaceholder: { fontFamily: 'Inter_400Regular', fontSize: 15, color: Colors.muted },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  recipeRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    marginBottom: Spacing.sm,
  },
  recipeRowActive: { borderColor: Colors.vivid, backgroundColor: Colors.ice },
  ingName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  ingMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

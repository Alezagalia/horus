import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Flame,
  Zap,
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import {
  useFoods,
  useNutritionLog,
  useAddLogItem,
  useRemoveLogItem,
  useCreateFood,
  useUpdateFood,
  useDeleteFood,
} from '@/hooks/useNutrition';
import type { MealTime, Food, NutritionLogItem, CreateFoodDTO, UpdateFoodDTO } from '@horus/shared';
import { RecipesView } from './RecipesView';
import { MealPlannerView } from './MealPlannerView';
import { ShoppingListsView } from './ShoppingListsView';

// ─── constants ────────────────────────────────────────────────────────────────

const MEAL_TIMES: { key: MealTime; label: string; emoji: string }[] = [
  { key: 'BREAKFAST', label: 'Desayuno', emoji: '🌅' },
  { key: 'MORNING_SNACK', label: 'Media mañana', emoji: '🍎' },
  { key: 'LUNCH', label: 'Almuerzo', emoji: '🍽️' },
  { key: 'AFTERNOON_SNACK', label: 'Merienda', emoji: '☕' },
  { key: 'DINNER', label: 'Cena', emoji: '🌙' },
];

const MACRO_TARGETS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

type NutTab = 'log' | 'recipes' | 'planner' | 'shopping' | 'foods';

// ─── macro pill ───────────────────────────────────────────────────────────────

function MacroPill({
  label,
  value,
  target,
  unit,
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
}) {
  const pct = Math.min(100, Math.round((value / target) * 100));
  return (
    <View style={styles.macroPill}>
      <Text style={[styles.macroValue, { color }]}>
        {Math.round(value)}
        <Text style={styles.macroUnit}>{unit}</Text>
      </Text>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBar}>
        <View style={[styles.macroBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ─── log item row ─────────────────────────────────────────────────────────────

function LogItemRow({ item, onDelete }: { item: NutritionLogItem; onDelete: () => void }) {
  return (
    <View style={styles.logItemRow}>
      <View style={styles.logItemInfo}>
        <Text style={styles.logItemName} numberOfLines={1}>
          {item.food?.name ?? '—'}
        </Text>
        <Text style={styles.logItemMacros}>
          {Math.round(item.grams)}g · {Math.round(item.macros.calories)} kcal ·{' '}
          <Text style={{ color: '#ef4444' }}>P:{Math.round(item.macros.protein)}</Text>
          {' · '}
          <Text style={{ color: '#f59e0b' }}>C:{Math.round(item.macros.carbs)}</Text>
          {' · '}
          <Text style={{ color: '#6366f1' }}>G:{Math.round(item.macros.fat)}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8}>
        <Trash2 size={16} color={Colors.muted} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

// ─── add food modal ───────────────────────────────────────────────────────────

function AddFoodModal({
  visible,
  mealTime,
  date,
  onClose,
}: {
  visible: boolean;
  mealTime: MealTime | null;
  date: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCal, setNewCal] = useState('');
  const [newProt, setNewProt] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');

  const { data: foods = [], isLoading: loadingFoods } = useFoods(
    search.length >= 2 ? { search, isActive: true } : { isActive: true }
  );
  const addItem = useAddLogItem();
  const createFood = useCreateFood();

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setSelected(null);
      setGrams('100');
      setShowCreate(false);
      setNewName('');
      setNewCal('');
      setNewProt('');
      setNewCarbs('');
      setNewFat('');
    }
  }, [visible]);

  const handleAdd = async () => {
    if (!selected || !mealTime) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) return Alert.alert('Error', 'Ingresa una cantidad válida.');
    try {
      await addItem.mutateAsync({ date, item: { foodId: selected.id, mealTime, grams: g } });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo agregar el alimento.');
    }
  };

  const handleCreateFood = async () => {
    if (!newName.trim() || !newCal)
      return Alert.alert('Error', 'Nombre y calorías son requeridos.');
    try {
      const dto: CreateFoodDTO = {
        name: newName.trim(),
        calories: parseFloat(newCal) || 0,
        protein: parseFloat(newProt) || 0,
        carbs: parseFloat(newCarbs) || 0,
        fat: parseFloat(newFat) || 0,
      };
      const food = await createFood.mutateAsync(dto);
      setSelected(food);
      setShowCreate(false);
    } catch {
      Alert.alert('Error', 'No se pudo crear el alimento.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selected ? 'Cantidad' : showCreate ? 'Nuevo alimento' : 'Agregar alimento'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <X size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>

            {!selected && !showCreate && (
              <>
                <View style={styles.searchRow}>
                  <Search size={16} color={Colors.muted} />
                  <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar alimento…"
                    placeholderTextColor={Colors.muted}
                    style={styles.searchInput}
                    autoFocus
                  />
                </View>

                {loadingFoods ? (
                  <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 20 }} />
                ) : (
                  <FlatList
                    data={foods}
                    keyExtractor={(f) => f.id}
                    style={{ maxHeight: 260 }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.foodRow}
                        onPress={() => setSelected(item)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.foodName}>{item.name}</Text>
                          <Text style={styles.foodMeta}>
                            {Math.round(item.calories)} kcal · P:{Math.round(item.protein)}g · C:
                            {Math.round(item.carbs)}g · G:{Math.round(item.fat)}g
                          </Text>
                        </View>
                        <Text style={styles.foodUnit}>/{item.unit}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {search.length >= 2 ? 'Sin resultados' : 'Escribe para buscar'}
                      </Text>
                    }
                  />
                )}

                <TouchableOpacity style={styles.createFoodBtn} onPress={() => setShowCreate(true)}>
                  <Plus size={16} color={Colors.vivid} />
                  <Text style={styles.createFoodLabel}>Crear alimento nuevo</Text>
                </TouchableOpacity>
              </>
            )}

            {showCreate && !selected && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {[
                  { label: 'Nombre *', val: newName, set: setNewName, kb: 'default' },
                  { label: 'Calorías (kcal) *', val: newCal, set: setNewCal, kb: 'numeric' },
                  { label: 'Proteínas (g)', val: newProt, set: setNewProt, kb: 'numeric' },
                  { label: 'Carbohidratos (g)', val: newCarbs, set: setNewCarbs, kb: 'numeric' },
                  { label: 'Grasas (g)', val: newFat, set: setNewFat, kb: 'numeric' },
                ].map(({ label, val, set, kb }) => (
                  <View key={label} style={{ marginBottom: Spacing.sm }}>
                    <Text style={styles.formLabel}>{label}</Text>
                    <TextInput
                      value={val}
                      onChangeText={set as (v: string) => void}
                      keyboardType={kb as any}
                      style={styles.formInput}
                      placeholderTextColor={Colors.muted}
                    />
                  </View>
                ))}
                <Button label="Crear" onPress={handleCreateFood} loading={createFood.isPending} />
                <TouchableOpacity
                  onPress={() => setShowCreate(false)}
                  style={{ alignItems: 'center', marginTop: Spacing.sm }}
                >
                  <Text
                    style={{ color: Colors.muted, fontFamily: 'Inter_400Regular', fontSize: 14 }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {selected && (
              <>
                <Card solid style={{ marginBottom: Spacing.md }}>
                  <Text style={styles.selectedName}>{selected.name}</Text>
                  <Text style={styles.selectedMeta}>
                    Por 100g: {Math.round(selected.calories)} kcal · P:
                    {Math.round(selected.protein)}g · C:{Math.round(selected.carbs)}g · G:
                    {Math.round(selected.fat)}g
                  </Text>
                </Card>
                <Text style={styles.formLabel}>Cantidad (gramos)</Text>
                <TextInput
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="numeric"
                  style={styles.formInput}
                  autoFocus
                />
                <Button
                  label="Agregar"
                  onPress={handleAdd}
                  loading={addItem.isPending}
                  style={{ marginTop: Spacing.md }}
                />
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  style={{ alignItems: 'center', marginTop: Spacing.sm }}
                >
                  <Text
                    style={{ color: Colors.muted, fontFamily: 'Inter_400Regular', fontSize: 14 }}
                  >
                    Cambiar alimento
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── edit food modal ──────────────────────────────────────────────────────────

function EditFoodModal({ food, onClose }: { food: Food; onClose: () => void }) {
  const [name, setName] = useState(food.name);
  const [cal, setCal] = useState(String(food.calories));
  const [prot, setProt] = useState(String(food.protein));
  const [carbs, setCarbs] = useState(String(food.carbs));
  const [fat, setFat] = useState(String(food.fat));
  const updateFood = useUpdateFood();

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Error', 'El nombre es requerido.');
    const dto: UpdateFoodDTO = {
      name: name.trim(),
      calories: parseFloat(cal) || 0,
      protein: parseFloat(prot) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };
    try {
      await updateFood.mutateAsync({ id: food.id, dto });
      onClose();
    } catch {
      Alert.alert('Error', 'No se pudo actualizar el alimento.');
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar alimento</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <X size={20} color={Colors.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {(
                [
                  { label: 'Nombre *', val: name, set: setName, kb: 'default' },
                  { label: 'Calorías (kcal)', val: cal, set: setCal, kb: 'numeric' },
                  { label: 'Proteínas (g)', val: prot, set: setProt, kb: 'numeric' },
                  { label: 'Carbohidratos (g)', val: carbs, set: setCarbs, kb: 'numeric' },
                  { label: 'Grasas (g)', val: fat, set: setFat, kb: 'numeric' },
                ] as const
              ).map(({ label, val, set, kb }) => (
                <View key={label} style={{ marginBottom: Spacing.sm }}>
                  <Text style={styles.formLabel}>{label}</Text>
                  <TextInput
                    value={val}
                    onChangeText={set as (v: string) => void}
                    keyboardType={kb as any}
                    style={styles.formInput}
                    placeholderTextColor={Colors.muted}
                  />
                </View>
              ))}
              <Button label="Guardar" onPress={handleSave} loading={updateFood.isPending} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── foods view (embebido: usa .map, no FlatList) ───────────────────────────────

function FoodsView() {
  const [search, setSearch] = useState('');
  const [editFood, setEditFood] = useState<Food | null>(null);
  const { data: foods = [], isLoading } = useFoods(
    search.length >= 2 ? { search, isActive: true } : { isActive: true }
  );
  const deleteFood = useDeleteFood();

  const handleDelete = (food: Food) => {
    Alert.alert('Eliminar alimento', `¿Eliminar "${food.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () =>
          deleteFood.mutate(food.id, {
            onError: () => Alert.alert('Error', 'No se pudo eliminar.'),
          }),
      },
    ]);
  };

  return (
    <View>
      <View style={styles.searchRow}>
        <Search size={16} color={Colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar alimento…"
          placeholderTextColor={Colors.muted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
            <X size={14} color={Colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: Spacing.xl }} />
      ) : foods.length === 0 ? (
        <Text style={[styles.emptyText, { marginTop: Spacing.xl }]}>
          {search.length >= 2 ? 'Sin resultados' : 'Sin alimentos registrados'}
        </Text>
      ) : (
        <Card padding={0} solid>
          {foods.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.manageFoodRow,
                i === foods.length - 1 && { borderBottomWidth: 0 },
                { paddingHorizontal: Spacing.md },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {item.name}
                </Text>
                {item.brand && (
                  <Text style={[styles.foodMeta, { marginBottom: 2 }]}>{item.brand}</Text>
                )}
                <Text style={styles.foodMeta}>
                  {Math.round(item.calories)} kcal · P:{Math.round(item.protein)}g · C:
                  {Math.round(item.carbs)}g · G:{Math.round(item.fat)}g
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditFood(item)}
                hitSlop={8}
                style={styles.foodActionBtn}
              >
                <Zap size={15} color={Colors.vivid} strokeWidth={1.5} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                hitSlop={8}
                style={styles.foodActionBtn}
              >
                <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      )}

      {editFood && <EditFoodModal food={editFood} onClose={() => setEditFood(null)} />}
    </View>
  );
}

// ─── main embeddable view ───────────────────────────────────────────────────────

export function NutritionView() {
  const [activeTab, setActiveTab] = useState<NutTab>('log');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [activeMeal, setActiveMeal] = useState<MealTime | null>(null);
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  const { data: log, isLoading } = useNutritionLog(date);
  const removeItem = useRemoveLogItem();

  const dayMacros = log?.dayMacros ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  const itemsByMeal: Record<string, NutritionLogItem[]> = {};
  for (const item of log?.items ?? []) {
    if (!itemsByMeal[item.mealTime]) itemsByMeal[item.mealTime] = [];
    itemsByMeal[item.mealTime].push(item);
  }

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem.mutateAsync({ date, itemId });
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el item.');
    }
  };

  return (
    <View>
      {/* Sub-tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: Spacing.lg }}
        contentContainerStyle={styles.subTabs}
      >
        <Chip label="Registro" active={activeTab === 'log'} onPress={() => setActiveTab('log')} />
        <Chip
          label="Recetas"
          active={activeTab === 'recipes'}
          onPress={() => setActiveTab('recipes')}
        />
        <Chip
          label="Plan"
          active={activeTab === 'planner'}
          onPress={() => setActiveTab('planner')}
        />
        <Chip
          label="Compras"
          active={activeTab === 'shopping'}
          onPress={() => setActiveTab('shopping')}
        />
        <Chip
          label="Alimentos"
          active={activeTab === 'foods'}
          onPress={() => setActiveTab('foods')}
        />
      </ScrollView>

      {activeTab === 'foods' ? (
        <FoodsView />
      ) : activeTab === 'recipes' ? (
        <RecipesView />
      ) : activeTab === 'planner' ? (
        <MealPlannerView />
      ) : activeTab === 'shopping' ? (
        <ShoppingListsView />
      ) : (
        <>
          {/* Macro + date hero card */}
          <LinearGradient colors={Gradients.hero} style={styles.heroCard}>
            <View style={styles.dateRow}>
              <TouchableOpacity
                onPress={() => setDate((d) => format(subDays(parseISO(d), 1), 'yyyy-MM-dd'))}
                hitSlop={8}
              >
                <ChevronLeft size={20} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <Text style={styles.dateText}>
                {isToday
                  ? 'Hoy'
                  : format(parseISO(date), "EEEE d 'de' MMMM", { locale: es }).replace(/^\w/, (c) =>
                      c.toUpperCase()
                    )}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const next = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');
                  if (next <= format(new Date(), 'yyyy-MM-dd')) setDate(next);
                }}
                hitSlop={8}
                disabled={isToday}
              >
                <ChevronRight
                  size={20}
                  color={isToday ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.macroRow}>
              <MacroPill
                label="Calorías"
                value={dayMacros.calories}
                target={MACRO_TARGETS.calories}
                unit=" kcal"
                color="#f59e0b"
              />
              <MacroPill
                label="Proteínas"
                value={dayMacros.protein}
                target={MACRO_TARGETS.protein}
                unit="g"
                color="#ef4444"
              />
              <MacroPill
                label="Carbos"
                value={dayMacros.carbs}
                target={MACRO_TARGETS.carbs}
                unit="g"
                color="#6366f1"
              />
              <MacroPill
                label="Grasas"
                value={dayMacros.fat}
                target={MACRO_TARGETS.fat}
                unit="g"
                color="#10b981"
              />
            </View>
          </LinearGradient>

          {isLoading ? (
            <ActivityIndicator color={Colors.vivid} style={{ marginTop: Spacing.xl }} />
          ) : (
            MEAL_TIMES.map(({ key, label, emoji }) => {
              const items = itemsByMeal[key] ?? [];
              const mealCals = items.reduce((s, i) => s + i.macros.calories, 0);
              return (
                <View key={key} style={styles.mealSection}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealEmoji}>{emoji}</Text>
                    <Text style={styles.mealLabel}>{label}</Text>
                    {mealCals > 0 && (
                      <View style={styles.mealCalBadge}>
                        <Flame size={11} color="#f59e0b" />
                        <Text style={styles.mealCalText}>{Math.round(mealCals)} kcal</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => setActiveMeal(key)}
                      style={styles.mealAddBtn}
                      hitSlop={8}
                    >
                      <Plus size={16} color={Colors.vivid} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  {items.length > 0 ? (
                    items.map((item) => (
                      <LogItemRow
                        key={item.id}
                        item={item}
                        onDelete={() => handleRemove(item.id)}
                      />
                    ))
                  ) : (
                    <Text style={styles.emptyMeal}>Sin registros</Text>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      <AddFoodModal
        visible={activeMeal !== null}
        mealTime={activeMeal}
        date={date}
        onClose={() => setActiveMeal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // sub tabs
  subTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },

  // hero card (macros + date)
  heroCard: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.nav,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dateText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },

  // macros
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  macroValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  macroUnit: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  macroLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  macroBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  macroBarFill: { height: 3, borderRadius: 2 },

  // meal sections
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
  mealCalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f59e0b18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  mealCalText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: '#f59e0b' },
  mealAddBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.vivid + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMeal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // log item
  logItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  logItemInfo: { flex: 1 },
  logItemName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  logItemMacros: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginTop: 2,
  },

  // modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },

  // search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    paddingVertical: Spacing.sm,
  },

  // food list
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  foodName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  foodMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  foodUnit: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted },

  createFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  createFoodLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.vivid },

  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // selected food
  selectedName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 4,
  },
  selectedMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted },

  // manage foods
  manageFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  foodActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // form
  formLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  formInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.ink,
    borderWidth: 1.5,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});

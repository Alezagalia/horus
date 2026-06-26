import { useState, useEffect } from 'react';
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
import { X, Plus, Trash2, ChefHat } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Colors, Spacing, Radius } from '@/tokens';
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useAddIngredient,
  useRemoveIngredient,
} from '@/hooks/useNutrition';
import { FoodPickerModal } from './FoodPickerModal';
import type { Food, RecipeWithIngredients, RecipeIngredient } from '@horus/shared';

// Ingrediente local para el modo crear (aún sin id de backend)
interface LocalIngredient {
  id?: string;
  food: Food;
  grams: number;
}

function macroLine(m: { calories: number; protein: number; carbs: number; fat: number }) {
  return `${Math.round(m.calories)} kcal · P:${Math.round(m.protein)} · C:${Math.round(
    m.carbs
  )} · G:${Math.round(m.fat)}`;
}

function RecipeFormModal({
  visible,
  recipe,
  onClose,
}: {
  visible: boolean;
  recipe: RecipeWithIngredients | null;
  onClose: () => void;
}) {
  const isEditing = !!recipe;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('1');
  const [ingredients, setIngredients] = useState<(LocalIngredient | RecipeIngredient)[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingFood, setPendingFood] = useState<Food | null>(null);
  const [pendingGrams, setPendingGrams] = useState('100');

  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const addIngredient = useAddIngredient();
  const removeIngredient = useRemoveIngredient();

  useEffect(() => {
    if (!visible) return;
    if (recipe) {
      setName(recipe.name);
      setDescription(recipe.description ?? '');
      setServings(String(recipe.servings));
      setIngredients(recipe.ingredients);
    } else {
      setName('');
      setDescription('');
      setServings('1');
      setIngredients([]);
    }
    setShowPicker(false);
    setPendingFood(null);
    setPendingGrams('100');
  }, [visible, recipe]);

  const handleClose = () => {
    setPendingFood(null);
    onClose();
  };

  const handlePickFood = (food: Food) => {
    setPendingFood(food);
    setPendingGrams('100');
    setShowPicker(false);
  };

  const handleAddIngredient = () => {
    if (!pendingFood) return;
    const grams = parseFloat(pendingGrams.replace(',', '.'));
    if (isNaN(grams) || grams <= 0) return Alert.alert('Error', 'Cantidad inválida');

    if (isEditing && recipe) {
      addIngredient.mutate(
        { recipeId: recipe.id, dto: { foodId: pendingFood.id, grams } },
        {
          onSuccess: (updated) => {
            setIngredients(updated.ingredients);
            setPendingFood(null);
          },
          onError: () => Alert.alert('Error', 'No se pudo agregar el ingrediente'),
        }
      );
    } else {
      setIngredients((prev) => [...prev, { food: pendingFood, grams }]);
      setPendingFood(null);
    }
  };

  const handleRemoveIngredient = (index: number, ing: LocalIngredient | RecipeIngredient) => {
    if (isEditing && recipe && 'id' in ing && ing.id) {
      removeIngredient.mutate(
        { recipeId: recipe.id, ingredientId: ing.id },
        {
          onSuccess: () => setIngredients((prev) => prev.filter((_, i) => i !== index)),
          onError: () => Alert.alert('Error', 'No se pudo quitar el ingrediente'),
        }
      );
    } else {
      setIngredients((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return Alert.alert('Error', 'El nombre es requerido');
    const servingsNum = Math.max(1, parseInt(servings, 10) || 1);
    const onError = () => Alert.alert('Error', 'No se pudo guardar la receta');

    if (isEditing && recipe) {
      updateRecipe.mutate(
        {
          id: recipe.id,
          dto: {
            name: name.trim(),
            description: description.trim() || null,
            servings: servingsNum,
          },
        },
        { onSuccess: handleClose, onError }
      );
    } else {
      createRecipe.mutate(
        {
          name: name.trim(),
          description: description.trim() || null,
          servings: servingsNum,
          ingredients: ingredients.map((i) => ({ foodId: i.food.id, grams: i.grams })),
        },
        { onSuccess: handleClose, onError }
      );
    }
  };

  const handleDelete = () => {
    if (!recipe) return;
    Alert.alert('Eliminar receta', `¿Eliminar "${recipe.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteRecipe.mutate(recipe.id, { onSuccess: handleClose }),
      },
    ]);
  };

  const busy = createRecipe.isPending || updateRecipe.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEditing ? 'Editar receta' : 'Nueva receta'}</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <X size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Ensalada griega"
              placeholderTextColor={Colors.muted}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Opcional"
              placeholderTextColor={Colors.muted}
              multiline
            />

            <Text style={styles.label}>Porciones</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={(v) => setServings(v.replace(/\D/g, '').slice(0, 3))}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={Colors.muted}
            />

            <Text style={styles.label}>Ingredientes ({ingredients.length})</Text>
            {ingredients.map((ing, i) => (
              <View key={('id' in ing && ing.id) || `${ing.food.id}-${i}`} style={styles.ingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingName}>{ing.food.name}</Text>
                  <Text style={styles.ingMeta}>{Math.round(ing.grams)} g</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveIngredient(i, ing)} hitSlop={8}>
                  <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            ))}

            {pendingFood ? (
              <View style={styles.pendingBox}>
                <Text style={styles.ingName}>{pendingFood.name}</Text>
                <View style={styles.pendingRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={pendingGrams}
                    onChangeText={setPendingGrams}
                    keyboardType="numeric"
                    placeholder="gramos"
                    placeholderTextColor={Colors.muted}
                  />
                  <TouchableOpacity
                    style={styles.pendingAddBtn}
                    onPress={handleAddIngredient}
                    disabled={addIngredient.isPending}
                  >
                    {addIngredient.isPending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.pendingAddLabel}>Agregar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.addIngBtn} onPress={() => setShowPicker(true)}>
                <Plus size={16} color={Colors.vivid} />
                <Text style={styles.addIngLabel}>Agregar ingrediente</Text>
              </TouchableOpacity>
            )}

            <Button
              label={isEditing ? 'Guardar cambios' : 'Crear receta'}
              onPress={handleSubmit}
              loading={busy}
              disabled={!name.trim() || busy}
              style={{ marginTop: Spacing.lg }}
            />
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Text style={styles.deleteLabel}>Eliminar receta</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <FoodPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handlePickFood}
        title="Ingrediente"
      />
    </Modal>
  );
}

export function RecipesView() {
  const { data: recipes = [], isLoading } = useRecipes();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecipeWithIngredients | null>(null);

  return (
    <View>
      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => {
          setEditing(null);
          setShowForm(true);
        }}
        activeOpacity={0.85}
      >
        <Plus size={16} color="#fff" strokeWidth={2} />
        <Text style={styles.newBtnLabel}>Nueva receta</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: Spacing.xl }} />
      ) : recipes.length === 0 ? (
        <Card solid style={styles.emptyCard}>
          <ChefHat size={32} color={Colors.ceilLight} strokeWidth={1} />
          <Text style={styles.emptyTitle}>Sin recetas</Text>
          <Text style={styles.emptySub}>Creá recetas para usarlas en tu planificador</Text>
        </Card>
      ) : (
        recipes.map((r) => (
          <TouchableOpacity
            key={r.id}
            activeOpacity={0.8}
            onPress={() => {
              setEditing(r);
              setShowForm(true);
            }}
          >
            <Card solid style={styles.recipeCard}>
              <View style={styles.recipeTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeName}>{r.name}</Text>
                  {r.description ? (
                    <Text style={styles.recipeDesc} numberOfLines={1}>
                      {r.description}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.servingsBadge}>
                  <Text style={styles.servingsText}>{r.servings} porc.</Text>
                </View>
              </View>
              <Text style={styles.recipeMacros}>Por porción: {macroLine(r.macrosPerServing)}</Text>
              <Text style={styles.recipeIng}>
                {r.ingredients.length} ingrediente{r.ingredients.length !== 1 ? 's' : ''}
              </Text>
            </Card>
          </TouchableOpacity>
        ))
      )}

      <RecipeFormModal
        visible={showForm}
        recipe={editing}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    marginBottom: Spacing.lg,
  },
  newBtnLabel: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },

  recipeCard: { marginBottom: Spacing.md, gap: 4 },
  recipeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  recipeName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.ink },
  recipeDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted, marginTop: 2 },
  servingsBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  servingsText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: Colors.vivid },
  recipeMacros: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.ink, marginTop: 2 },
  recipeIng: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted },

  emptyCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },

  // modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },
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
    marginBottom: Spacing.sm,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  ingName: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  ingMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  pendingBox: {
    backgroundColor: Colors.bgTop,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pendingAddBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingAddLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#fff' },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.vivid,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
  },
  addIngLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.vivid },
  deleteBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginTop: Spacing.xs },
  deleteLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#ef4444' },
});

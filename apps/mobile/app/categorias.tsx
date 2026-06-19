import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Pencil, Trash2, Star, X } from 'lucide-react-native';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius, Gradients, Shadows } from '@/tokens';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSetDefaultCategory,
} from '@/hooks/useCategories';
import type { Category } from '@/services/api/categoryApi';
import { Scope, SCOPE_LABELS, SCOPE_ICONS } from '@horus/shared';

// ─── constants ─────────────────────────────────────────────────────────────────

const SCOPES = Object.values(Scope);

const PRESET_ICONS = [
  '🎯',
  '✅',
  '📅',
  '💰',
  '🏆',
  '📚',
  '🥗',
  '🏃',
  '💼',
  '🛒',
  '🤝',
  '🎉',
  '⏰',
  '🍔',
  '🚗',
  '🏠',
  '🎬',
  '💊',
  '🧘',
  '📖',
  '🎵',
  '🌱',
  '🌟',
  '🔥',
  '💡',
  '🏋️',
  '🎨',
  '✈️',
  '🐾',
  '💻',
];

const PRESET_COLORS = [
  '#4CAF50',
  '#2196F3',
  '#FF9800',
  '#9C27B0',
  '#FFC107',
  '#E91E63',
  '#F44336',
  '#00BCD4',
  '#3F51B5',
  '#795548',
  '#607D8B',
  '#FF5722',
  '#8BC34A',
  '#03A9F4',
  '#673AB7',
];

// ─── Category row ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  onEdit,
  onDelete,
  onSetDefault,
  isLast,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.catRow, !isLast && styles.catRowBorder]}>
      {/* Color dot + icon */}
      <View
        style={[
          styles.catIconWrap,
          { backgroundColor: category.color ? `${category.color}22` : Colors.ice },
        ]}
      >
        <Text style={styles.catIcon}>{category.icon ?? '📁'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.catNameRow}>
          <Text
            style={[styles.catName, !category.isActive && styles.catNameInactive]}
            numberOfLines={1}
          >
            {category.name}
          </Text>
          {category.isDefault && (
            <View style={styles.defaultBadge}>
              <Star size={9} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.defaultBadgeText}>Default</Text>
            </View>
          )}
          {!category.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactiva</Text>
            </View>
          )}
        </View>
        {category.color && (
          <View style={styles.colorDotRow}>
            <View style={[styles.colorDot, { backgroundColor: category.color }]} />
            <Text style={styles.colorHex}>{category.color}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.catActions}>
        {!category.isDefault && category.isActive && (
          <TouchableOpacity
            onPress={onSetDefault}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Star size={15} color={Colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Pencil size={15} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
        {!category.isDefault && (
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionBtn}
          >
            <Trash2 size={15} color={Colors.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Category form modal ───────────────────────────────────────────────────────

function CategoryFormModal({
  visible,
  category,
  defaultScope,
  onClose,
}: {
  visible: boolean;
  category: Category | null;
  defaultScope: Scope;
  onClose: () => void;
}) {
  const isEditing = !!category;
  const [name, setName] = useState('');
  const [scope, setScope] = useState<Scope>(defaultScope);
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  useEffect(() => {
    if (visible) {
      if (category) {
        setName(category.name);
        setScope(category.scope);
        setIcon(category.icon ?? '');
        setColor(category.color ?? '');
      } else {
        setName('');
        setScope(defaultScope);
        setIcon('');
        setColor('');
      }
    }
  }, [visible, category, defaultScope]);

  const handleClose = () => {
    setName('');
    setIcon('');
    setColor('');
    onClose();
  };

  const canSubmit = name.trim().length >= 1;
  const isBusy = createCategory.isPending || updateCategory.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const dto = {
      name: name.trim(),
      icon: icon.trim() || undefined,
      color: color.trim() || undefined,
    };
    if (isEditing && category) {
      updateCategory.mutate({ id: category.id, dto }, { onSuccess: handleClose });
    } else {
      createCategory.mutate({ ...dto, scope }, { onSuccess: handleClose });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={fStyles.overlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={fStyles.sheet}>
          <View style={fStyles.header}>
            <Text style={fStyles.title}>{isEditing ? 'Editar categoría' : 'Nueva categoría'}</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Scope (read-only when editing) */}
            {!isEditing && (
              <>
                <Text style={fStyles.label}>ÁMBITO</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: Spacing.sm, marginBottom: Spacing.lg }}
                >
                  {SCOPES.map((s) => (
                    <Chip
                      key={s}
                      label={`${SCOPE_ICONS[s]} ${SCOPE_LABELS[s]}`}
                      active={scope === s}
                      onPress={() => setScope(s)}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {/* Name */}
            <Text style={fStyles.label}>NOMBRE</Text>
            <TextInput
              style={fStyles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Nombre de la categoría"
              placeholderTextColor={Colors.muted}
              maxLength={50}
              autoFocus={!isEditing}
            />

            {/* Icon picker */}
            <Text style={fStyles.label}>ÍCONO (EMOJI)</Text>
            <TextInput
              style={fStyles.iconInput}
              value={icon}
              onChangeText={setIcon}
              placeholder="📁"
              placeholderTextColor={Colors.muted}
              maxLength={10}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8, marginBottom: Spacing.lg }}
            >
              {PRESET_ICONS.map((em) => (
                <TouchableOpacity
                  key={em}
                  style={[fStyles.presetIcon, icon === em && fStyles.presetIconActive]}
                  onPress={() => setIcon(em)}
                >
                  <Text style={{ fontSize: 18 }}>{em}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color picker */}
            <Text style={fStyles.label}>COLOR (HEX)</Text>
            <TextInput
              style={fStyles.colorInput}
              value={color}
              onChangeText={setColor}
              placeholder="#4CAF50"
              placeholderTextColor={Colors.muted}
              maxLength={7}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, marginTop: 8, marginBottom: Spacing.lg }}
            >
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    fStyles.presetColor,
                    { backgroundColor: c },
                    color === c && fStyles.presetColorActive,
                  ]}
                  onPress={() => setColor(c)}
                />
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[fStyles.submitBtn, (!canSubmit || isBusy) && fStyles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || isBusy}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={fStyles.submitLabel}>
                  {isEditing ? 'Guardar cambios' : 'Crear categoría'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function CategoriasScreen() {
  const [activeScope, setActiveScope] = useState<Scope>(Scope.HABITOS);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const setDefaultCategory = useSetDefaultCategory();

  const filtered = useMemo(
    () => categories.filter((c) => c.scope === activeScope),
    [categories, activeScope]
  );

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Eliminar categoría',
      `¿Eliminar "${cat.name}"? Las categorías predeterminadas no se pueden eliminar.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteCategory.mutate(cat.id),
        },
      ]
    );
  };

  const handleSetDefault = (cat: Category) => {
    Alert.alert(
      'Establecer como predeterminada',
      `¿Hacer "${cat.name}" la categoría predeterminada para ${SCOPE_LABELS[cat.scope]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Establecer', onPress: () => setDefaultCategory.mutate(cat.id) },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.nudge}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Categorías</Text>
          <Text style={styles.headerSub}>Organiza tus actividades por ámbito</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          activeOpacity={0.85}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Scope tabs */}
      <View style={styles.scopeTabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scopeTabs}
        >
          {SCOPES.map((s) => {
            const count = categories.filter((c) => c.scope === s).length;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.scopeTab, activeScope === s && styles.scopeTabActive]}
                onPress={() => setActiveScope(s)}
                activeOpacity={0.75}
              >
                <Text style={styles.scopeTabEmoji}>{SCOPE_ICONS[s]}</Text>
                <Text
                  style={[styles.scopeTabLabel, activeScope === s && styles.scopeTabLabelActive]}
                >
                  {SCOPE_LABELS[s]}
                </Text>
                {count > 0 && (
                  <View
                    style={[styles.scopeTabBadge, activeScope === s && styles.scopeTabBadgeActive]}
                  >
                    <Text
                      style={[
                        styles.scopeTabBadgeText,
                        activeScope === s && styles.scopeTabBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginTop: 48 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{SCOPE_ICONS[activeScope]}</Text>
            <Text style={styles.emptyTitle}>Sin categorías</Text>
            <Text style={styles.emptySub}>
              Creá tu primera categoría para {SCOPE_LABELS[activeScope].toLowerCase()}
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateBtn}
              onPress={() => {
                setEditingCategory(null);
                setShowModal(true);
              }}
            >
              <Plus size={14} color={Colors.vivid} strokeWidth={2} />
              <Text style={styles.emptyCreateLabel}>Nueva categoría</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Card padding={0} solid>
            {filtered.map((cat, i) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onEdit={() => {
                  setEditingCategory(cat);
                  setShowModal(true);
                }}
                onDelete={() => handleDelete(cat)}
                onSetDefault={() => handleSetDefault(cat)}
                isLast={i === filtered.length - 1}
              />
            ))}
          </Card>
        )}
      </ScrollView>

      <CategoryFormModal
        visible={showModal}
        category={editingCategory}
        defaultScope={activeScope}
        onClose={() => {
          setShowModal(false);
          setEditingCategory(null);
        }}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgTop },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.screenX,
    ...Shadows.nav,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scope tabs
  scopeTabsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  scopeTabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  scopeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.bgTop,
  },
  scopeTabActive: {
    backgroundColor: Colors.vivid,
  },
  scopeTabEmoji: {
    fontSize: 13,
  },
  scopeTabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
  },
  scopeTabLabelActive: {
    color: '#fff',
  },
  scopeTabBadge: {
    backgroundColor: Colors.ice,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  scopeTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scopeTabBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: Colors.muted,
  },
  scopeTabBadgeTextActive: {
    color: '#fff',
  },
  // Content
  content: {
    padding: Spacing.screenX,
    paddingBottom: 40,
  },
  // Category row
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  catRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.ice,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: {
    fontSize: 18,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  catName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  catNameInactive: {
    color: Colors.muted,
    textDecorationLine: 'line-through',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: '#92400E',
  },
  inactiveBadge: {
    backgroundColor: Colors.ice,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    color: Colors.muted,
  },
  colorDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorHex: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.muted,
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 64,
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: Colors.vivid,
  },
  emptyCreateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.vivid,
  },
});

// ─── Form modal styles ─────────────────────────────────────────────────────────

const fStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,14,31,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  nameInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  iconInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: 70,
    textAlign: 'center',
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.ice,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIconActive: {
    backgroundColor: Colors.vivid + '22',
    borderWidth: 2,
    borderColor: Colors.vivid,
  },
  colorInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    width: 100,
  },
  presetColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  presetColorActive: {
    borderWidth: 3,
    borderColor: Colors.ink,
    transform: [{ scale: 1.15 }],
  },
  submitBtn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
  },
});

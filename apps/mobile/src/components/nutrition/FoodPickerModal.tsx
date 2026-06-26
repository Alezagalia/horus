import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X, Search } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/tokens';
import { useFoods } from '@/hooks/useNutrition';
import type { Food } from '@horus/shared';

export function FoodPickerModal({
  visible,
  onClose,
  onSelect,
  title = 'Elegir alimento',
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: Food) => void;
  title?: string;
}) {
  const [search, setSearch] = useState('');
  const { data: foods = [], isLoading } = useFoods(
    search.length >= 2 ? { search, isActive: true } : { isActive: true }
  );

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>

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

          {isLoading ? (
            <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 20 }} />
          ) : (
            <FlatList
              data={foods}
              keyExtractor={(f) => f.id}
              style={{ maxHeight: 340 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.meta}>
                      {Math.round(item.calories)} kcal · P:{Math.round(item.protein)}g · C:
                      {Math.round(item.carbs)}g · G:{Math.round(item.fat)}g
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {search.length >= 2 ? 'Sin resultados' : 'Escribe para buscar'}
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
    minHeight: 320,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },
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
  row: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  name: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

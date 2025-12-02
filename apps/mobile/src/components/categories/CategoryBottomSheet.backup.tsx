/**
 * CategoryBottomSheet Component
 * Sprint 2 - US-015
 *
 * Bottom sheet with category options: Edit, Set as Default, Delete
 * NOTE: Requires React Native bottom sheet library (@gorhom/bottom-sheet or similar)
 */

import type { Category } from '@horus/shared';

interface CategoryBottomSheetProps {
  category: Category | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (category: Category) => void;
  onSetDefault: (category: Category) => void;
  onDelete: (category: Category) => void;
}

/**
 * CategoryBottomSheet
 *
 * TODO: Implement with @gorhom/bottom-sheet when React Native is configured
 *
 * Options:
 * - ✏️ Editar categoría
 * - ⭐ Marcar como default (disabled if already default)
 * - 🗑️ Eliminar (disabled if default, show warning)
 *
 * Design:
 * ┌─────────────────────────────────────┐
 * │ ●●●                                 │
 * │                                     │
 * │ 🎯 Salud                            │
 * │                                     │
 * │ ┌─────────────────────────────────┐ │
 * │ │ ✏️  Editar categoría            │ │
 * │ └─────────────────────────────────┘ │
 * │ ┌─────────────────────────────────┐ │
 * │ │ ⭐ Marcar como default          │ │
 * │ └─────────────────────────────────┘ │
 * │ ┌─────────────────────────────────┐ │
 * │ │ 🗑️  Eliminar                    │ │
 * │ └─────────────────────────────────┘ │
 * └─────────────────────────────────────┘
 */
export const CategoryBottomSheet = ({
  category,
  visible,
  onClose,
  onEdit,
  onSetDefault,
  onDelete,
}: CategoryBottomSheetProps) => {
  // TODO: Implement when React Native and bottom sheet library are configured
  // const bottomSheetRef = useRef<BottomSheet>(null);
  //
  // useEffect(() => {
  //   if (visible) {
  //     bottomSheetRef.current?.expand();
  //   } else {
  //     bottomSheetRef.current?.close();
  //   }
  // }, [visible]);
  //
  // if (!category) return null;
  //
  // return (
  //   <BottomSheet
  //     ref={bottomSheetRef}
  //     snapPoints={['50%']}
  //     onClose={onClose}
  //     enablePanDownToClose
  //   >
  //     <View style={styles.container}>
  //       <View style={styles.header}>
  //         <Text style={styles.icon}>{category.icon}</Text>
  //         <Text style={styles.title}>{category.name}</Text>
  //       </View>
  //
  //       <TouchableOpacity
  //         style={styles.option}
  //         onPress={() => {
  //           onEdit(category);
  //           onClose();
  //         }}
  //       >
  //         <Text style={styles.optionIcon}>✏️</Text>
  //         <Text style={styles.optionText}>Editar categoría</Text>
  //       </TouchableOpacity>
  //
  //       <TouchableOpacity
  //         style={[styles.option, category.isDefault && styles.optionDisabled]}
  //         onPress={() => {
  //           if (!category.isDefault) {
  //             onSetDefault(category);
  //             onClose();
  //           }
  //         }}
  //         disabled={category.isDefault}
  //       >
  //         <Text style={styles.optionIcon}>⭐</Text>
  //         <Text style={styles.optionText}>
  //           {category.isDefault ? 'Ya es default' : 'Marcar como default'}
  //         </Text>
  //       </TouchableOpacity>
  //
  //       <TouchableOpacity
  //         style={[styles.option, category.isDefault && styles.optionDisabled]}
  //         onPress={() => {
  //           if (!category.isDefault) {
  //             Alert.alert(
  //               'Eliminar categoría',
  //               `¿Estás seguro de eliminar "${category.name}"?`,
  //               [
  //                 { text: 'Cancelar', style: 'cancel' },
  //                 {
  //                   text: 'Eliminar',
  //                   style: 'destructive',
  //                   onPress: () => {
  //                     onDelete(category);
  //                     onClose();
  //                   },
  //                 },
  //               ]
  //             );
  //           }
  //         }}
  //         disabled={category.isDefault}
  //       >
  //         <Text style={[styles.optionIcon, styles.deleteIcon]}>🗑️</Text>
  //         <Text style={[styles.optionText, styles.deleteText]}>
  //           {category.isDefault ? 'No se puede eliminar default' : 'Eliminar'}
  //         </Text>
  //       </TouchableOpacity>
  //     </View>
  //   </BottomSheet>
  // );

  // Suppress unused parameter warnings - will be used when React Native is configured
  void category;
  void visible;
  void onClose;
  void onEdit;
  void onSetDefault;
  void onDelete;

  throw new Error('React Native not configured. Install Expo, RN, and @gorhom/bottom-sheet first.');
};

// TODO: Add styles when React Native is configured
// const styles = StyleSheet.create({
//   container: {
//     padding: 20,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 24,
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   icon: {
//     fontSize: 32,
//     marginRight: 12,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#333',
//   },
//   option: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 12,
//     borderRadius: 8,
//     marginBottom: 8,
//     backgroundColor: '#f8f9fa',
//   },
//   optionDisabled: {
//     opacity: 0.5,
//   },
//   optionIcon: {
//     fontSize: 20,
//     marginRight: 12,
//   },
//   optionText: {
//     fontSize: 16,
//     color: '#333',
//   },
//   deleteIcon: {
//     opacity: 0.8,
//   },
//   deleteText: {
//     color: '#d32f2f',
//   },
// });

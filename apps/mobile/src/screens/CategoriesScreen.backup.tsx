/**
 * CategoriesScreen
 * Sprint 2 - US-015
 *
 * Main screen for category management with tabs (Hábitos, Tareas, Eventos, Gastos)
 * NOTE: Requires React Native, React Navigation, and state management (React Query/TanStack Query)
 */

// Suppress unused imports - will be used when React Native is configured
import { Scope, SCOPE_LABELS, type Category } from '@horus/shared';

// Export these for TypeScript to not complain about unused imports
export type { Category };
export { Scope, SCOPE_LABELS };

/**
 * CategoriesScreen
 *
 * Features:
 * - Top tabs for each Scope (Hábitos, Tareas, Eventos, Gastos)
 * - List of categories filtered by selected scope
 * - FAB button to create new category
 * - Tap on category → open bottom sheet with options
 * - Pull to refresh
 * - Empty state when no categories
 *
 * TODO: Implement when React Native is configured:
 * 1. Install dependencies:
 *    - @react-navigation/material-top-tabs
 *    - @tanstack/react-query (or SWR)
 *    - react-native-gesture-handler
 *    - @gorhom/bottom-sheet
 *
 * 2. Setup:
 *    - Create Tab Navigator with 4 tabs (one per Scope)
 *    - Setup React Query for data fetching/caching
 *    - Configure pull-to-refresh
 *
 * 3. Components needed:
 *    - CategoryCard (already created)
 *    - CategoryBottomSheet (already created)
 *    - FAB (Floating Action Button)
 *    - EmptyState component
 *
 * Layout:
 * ┌───────────────────────────────────────┐
 * │ Categorías                       [+]  │ ← Header with FAB
 * ├───────────────────────────────────────┤
 * │ Hábitos │ Tareas │ Eventos │ Gastos  │ ← Tabs
 * ├───────────────────────────────────────┤
 * │                                       │
 * │ ┌──────────────────────────────────┐  │
 * │ │ 🎯  Salud         [Default]     │  │
 * │ └──────────────────────────────────┘  │
 * │ ┌──────────────────────────────────┐  │
 * │ │ ⚡  Productividad              │  │
 * │ └──────────────────────────────────┘  │
 * │ ┌──────────────────────────────────┐  │
 * │ │ 🧘  Bienestar                   │  │
 * │ └──────────────────────────────────┘  │
 * │                                       │
 * └───────────────────────────────────────┘
 */
export const CategoriesScreen = () => {
  // TODO: Implement when React Native and dependencies are configured
  //
  // const [selectedScope, setSelectedScope] = useState<Scope>(Scope.HABITOS);
  // const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  // const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  //
  // // React Query for data fetching
  // const {
  //   data: categories = [],
  //   isLoading,
  //   refetch,
  //   isRefetching,
  // } = useQuery({
  //   queryKey: ['categories', selectedScope],
  //   queryFn: () => getCategories({ scope: selectedScope }),
  // });
  //
  // const deleteMutation = useMutation({
  //   mutationFn: deleteCategory,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['categories']);
  //   },
  // });
  //
  // const setDefaultMutation = useMutation({
  //   mutationFn: setDefaultCategory,
  //   onSuccess: () => {
  //     queryClient.invalidateQueries(['categories']);
  //   },
  // });
  //
  // const handleCategoryPress = (category: Category) => {
  //   setSelectedCategory(category);
  //   setBottomSheetVisible(true);
  // };
  //
  // const handleEdit = (category: Category) => {
  //   navigation.navigate('EditCategory', { categoryId: category.id });
  // };
  //
  // const handleSetDefault = (category: Category) => {
  //   setDefaultMutation.mutate(category.id);
  // };
  //
  // const handleDelete = (category: Category) => {
  //   deleteMutation.mutate(category.id);
  // };
  //
  // const handleCreateNew = () => {
  //   navigation.navigate('CreateCategory', { scope: selectedScope });
  // };
  //
  // const renderCategory = ({ item }: { item: Category }) => (
  //   <CategoryCard category={item} onPress={handleCategoryPress} />
  // );
  //
  // const renderEmptyState = () => (
  //   <EmptyState
  //     icon="📦"
  //     title={`No tienes categorías de ${SCOPE_LABELS[selectedScope]}`}
  //     description="Crea tu primera categoría para empezar a organizar"
  //     actionLabel="Crear categoría"
  //     onAction={handleCreateNew}
  //   />
  // );
  //
  // return (
  //   <SafeAreaView style={styles.container}>
  //     {/* Tabs */}
  //     <View style={styles.tabs}>
  //       {Object.values(Scope).map((scope) => (
  //         <TouchableOpacity
  //           key={scope}
  //           style={[styles.tab, selectedScope === scope && styles.tabActive]}
  //           onPress={() => setSelectedScope(scope)}
  //         >
  //           <Text
  //             style={[styles.tabText, selectedScope === scope && styles.tabTextActive]}
  //           >
  //             {SCOPE_LABELS[scope]}
  //           </Text>
  //         </TouchableOpacity>
  //       ))}
  //     </View>
  //
  //     {/* Category List */}
  //     <FlatList
  //       data={categories}
  //       renderItem={renderCategory}
  //       keyExtractor={(item) => item.id}
  //       contentContainerStyle={styles.list}
  //       refreshControl={
  //         <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
  //       }
  //       ListEmptyComponent={!isLoading ? renderEmptyState : null}
  //     />
  //
  //     {/* FAB */}
  //     <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
  //       <Text style={styles.fabIcon}>+</Text>
  //     </TouchableOpacity>
  //
  //     {/* Bottom Sheet */}
  //     <CategoryBottomSheet
  //       category={selectedCategory}
  //       visible={bottomSheetVisible}
  //       onClose={() => setBottomSheetVisible(false)}
  //       onEdit={handleEdit}
  //       onSetDefault={handleSetDefault}
  //       onDelete={handleDelete}
  //     />
  //   </SafeAreaView>
  // );

  throw new Error(
    'React Native not configured. Complete React Native/Expo setup first (US-002 or Sprint 1).'
  );
};

// TODO: Add styles when React Native is configured
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   tabs: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 16,
//     alignItems: 'center',
//   },
//   tabActive: {
//     borderBottomWidth: 2,
//     borderBottomColor: '#2196F3',
//   },
//   tabText: {
//     fontSize: 14,
//     color: '#666',
//   },
//   tabTextActive: {
//     color: '#2196F3',
//     fontWeight: '600',
//   },
//   list: {
//     padding: 16,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#2196F3',
//     alignItems: 'center',
//     justifyContent: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     elevation: 8,
//   },
//   fabIcon: {
//     fontSize: 28,
//     color: '#fff',
//     fontWeight: '300',
//   },
// });

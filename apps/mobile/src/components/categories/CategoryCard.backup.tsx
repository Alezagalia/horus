/**
 * CategoryCard Component
 * Sprint 2 - US-015
 *
 * Displays a single category with icon, name, color, and default badge
 * NOTE: Requires React Native components (View, Text, TouchableOpacity, etc.)
 */

import type { Category } from '@horus/shared';

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

/**
 * CategoryCard
 *
 * TODO: Implement with React Native components when configured:
 * - TouchableOpacity for tap handling
 * - View for container
 * - Text for name
 * - Badge component for "Default" label
 * - Apply color prop as background or accent
 * - Show icon (emoji) prominently
 *
 * Design:
 * ┌─────────────────────────────────────┐
 * │ 🎯  Salud             [Default]     │
 * │     #4CAF50                         │
 * └─────────────────────────────────────┘
 */
export const CategoryCard = ({ category, onPress }: CategoryCardProps) => {
  // TODO: Implement when React Native is configured
  // return (
  //   <TouchableOpacity
  //     style={[styles.container, { borderLeftColor: category.color }]}
  //     onPress={() => onPress(category)}
  //     activeOpacity={0.7}
  //   >
  //     <View style={styles.content}>
  //       <Text style={styles.icon}>{category.icon}</Text>
  //       <View style={styles.info}>
  //         <Text style={styles.name}>{category.name}</Text>
  //         {category.color && <Text style={styles.color}>{category.color}</Text>}
  //       </View>
  //       {category.isDefault && (
  //         <View style={styles.badge}>
  //           <Text style={styles.badgeText}>Default</Text>
  //         </View>
  //       )}
  //     </View>
  //   </TouchableOpacity>
  // );

  // Suppress unused parameter warnings - will be used when React Native is configured
  void category;
  void onPress;

  throw new Error(
    'React Native not configured. Install Expo and RN components first (US-002 or earlier sprint).'
  );
};

// TODO: Add styles with StyleSheet.create() when React Native is configured
// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     borderLeftWidth: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   content: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   icon: {
//     fontSize: 32,
//     marginRight: 12,
//   },
//   info: {
//     flex: 1,
//   },
//   name: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//   },
//   color: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   badge: {
//     backgroundColor: '#4CAF50',
//     borderRadius: 12,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//   },
//   badgeText: {
//     color: '#fff',
//     fontSize: 11,
//     fontWeight: '600',
//   },
// });

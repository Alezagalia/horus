/**
 * TransferArrowIndicator Component
 * Sprint 9 - US-082
 *
 * Visual indicator showing transfer direction between accounts
 */

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function TransferArrowIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <View style={styles.arrowContainer}>
        <Ionicons name="arrow-down" size={28} color="#4F46E5" />
      </View>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  line: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  arrowContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});

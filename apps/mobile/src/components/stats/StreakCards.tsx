/**
 * StreakCards Component
 * Sprint 5 - US-042
 *
 * Side-by-side cards showing current streak and longest streak.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StreakCardsProps {
  currentStreak: number;
  longestStreak: number;
}

export const StreakCards: React.FC<StreakCardsProps> = ({ currentStreak, longestStreak }) => {
  return (
    <View style={styles.container}>
      {/* Current Streak Card */}
      <View style={styles.card}>
        <Text style={styles.badge}>🔥</Text>
        <Text style={styles.value}>{currentStreak}</Text>
        <Text style={styles.label}>Racha Actual</Text>
      </View>

      {/* Longest Streak Card */}
      <View style={styles.card}>
        <Text style={styles.badge}>🏆</Text>
        <Text style={styles.value}>{longestStreak}</Text>
        <Text style={styles.label}>Récord Personal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    fontSize: 32,
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

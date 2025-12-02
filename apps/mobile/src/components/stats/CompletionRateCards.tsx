/**
 * CompletionRateCards Component
 * Sprint 5 - US-042
 *
 * Side-by-side cards showing overall completion rate and last 30 days rate.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CompletionRateCardsProps {
  overallRate: number; // 0-100
  last30DaysRate: number; // 0-100
}

export const CompletionRateCards: React.FC<CompletionRateCardsProps> = ({
  overallRate,
  last30DaysRate,
}) => {
  const getColor = (rate: number): string => {
    if (rate >= 80) return '#4CAF50'; // Green
    if (rate >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  return (
    <View style={styles.container}>
      {/* Overall Rate Card */}
      <View style={styles.card}>
        <Text style={[styles.percentage, { color: getColor(overallRate) }]}>
          {Math.round(overallRate)}%
        </Text>
        <Text style={styles.label}>Tasa General</Text>
        <Text style={styles.subtitle}>(desde creación)</Text>
      </View>

      {/* Last 30 Days Rate Card */}
      <View style={styles.card}>
        <Text style={[styles.percentage, { color: getColor(last30DaysRate) }]}>
          {Math.round(last30DaysRate)}%
        </Text>
        <Text style={styles.label}>Últimos 30 Días</Text>
        <Text style={styles.subtitle}>&nbsp;</Text>
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
  percentage: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

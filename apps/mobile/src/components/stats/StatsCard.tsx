/**
 * StatsCard Component
 * Sprint 5 - US-041
 *
 * Reusable card component for displaying statistics on the dashboard.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface StatsCardProps {
  title: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, children, onPress, style }) => {
  const Card = onPress ? TouchableOpacity : View;

  return (
    <Card
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
  },
});

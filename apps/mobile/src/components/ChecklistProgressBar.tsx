/**
 * ChecklistProgressBar Component
 * Sprint 7 - US-063
 *
 * Barra de progreso visual del checklist con animación
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistProgressBarProps {
  total: number;
  completed: number;
}

export const ChecklistProgressBar: React.FC<ChecklistProgressBarProps> = ({ total, completed }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = total > 0 && completed === total;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [percentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (total === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Progreso del Checklist</Text>
        {isComplete && (
          <View style={styles.completeBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.completeBadgeText}>Completo</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {completed}/{total} completados
        </Text>
        <Text style={[styles.percentageText, isComplete && styles.percentageComplete]}>
          {percentage}%
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <Animated.View
          style={[
            styles.progressBarFill,
            {
              width: progressWidth,
              backgroundColor: isComplete ? '#4CAF50' : '#2196F3',
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  percentageComplete: {
    color: '#4CAF50',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

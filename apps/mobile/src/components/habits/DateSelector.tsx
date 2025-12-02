/**
 * DateSelector Component
 * Sprint 5 - US-043
 *
 * Simple date selector for last 7 days (no future dates).
 * Alternative to react-native-calendars for lighter bundle.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateSelect }) => {
  // Generate last 7 days
  const generateLast7Days = (): Array<{ date: string; label: string; dayName: string }> => {
    const days: Array<{ date: string; label: string; dayName: string }> = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dateString = date.toISOString().split('T')[0];
      const dayNumber = date.getDate();
      const dayName = getDayName(date.getDay());

      let label = dayNumber.toString();
      if (i === 0) label = 'Hoy';
      else if (i === 1) label = 'Ayer';

      days.push({
        date: dateString,
        label,
        dayName,
      });
    }

    return days;
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[dayOfWeek];
  };

  const days = generateLast7Days();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una fecha</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => onDateSelect(day.date)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {day.label}
              </Text>
              <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                {day.dayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scrollContent: {
    gap: 8,
  },
  dayButton: {
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#2196F3',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: '#fff',
  },
  dayName: {
    fontSize: 12,
    color: '#666',
  },
  dayNameSelected: {
    color: '#fff',
    opacity: 0.9,
  },
});

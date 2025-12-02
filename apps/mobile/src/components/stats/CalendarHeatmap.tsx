/**
 * CalendarHeatmap Component
 * Sprint 5 - US-042
 *
 * Visual calendar showing last 30 days of habit completion.
 * - Green: completed
 * - Red: not completed (but should have been)
 * - Gray: not applicable (based on periodicity)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface CalendarDay {
  date: string;
  completed: boolean;
  shouldComplete: boolean;
}

interface CalendarHeatmapProps {
  data: CalendarDay[];
}

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({ data }) => {
  const getColorForDay = (day: CalendarDay): string => {
    if (!day.shouldComplete) return '#E0E0E0'; // Gray - not applicable
    return day.completed ? '#4CAF50' : '#F44336'; // Green if completed, red if not
  };

  const getDayLabel = (dateString: string): string => {
    const date = new Date(dateString);
    return date.getDate().toString();
  };

  const getMonthLabel = (dateString: string): string => {
    const date = new Date(dateString);
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    return months[date.getMonth()];
  };

  // Group by weeks for better layout
  const groupByWeeks = (days: CalendarDay[]): CalendarDay[][] => {
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  const weeks = groupByWeeks(data);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Últimos 30 Días</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Completado</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>Pendiente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E0E0E0' }]} />
            <Text style={styles.legendText}>No aplica</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
        <View style={styles.calendar}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.week}>
              {week.map((day) => (
                <View key={day.date} style={styles.dayContainer}>
                  <View style={[styles.daySquare, { backgroundColor: getColorForDay(day) }]}>
                    <Text style={styles.dayText}>{getDayLabel(day.date)}</Text>
                  </View>
                  {weekIndex === 0 && (
                    <Text style={styles.monthLabel}>{getMonthLabel(day.date)}</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
  calendarScroll: {
    paddingLeft: 16,
  },
  calendar: {
    flexDirection: 'row',
    gap: 4,
    paddingRight: 16,
  },
  week: {
    flexDirection: 'column',
    gap: 4,
  },
  dayContainer: {
    alignItems: 'center',
  },
  daySquare: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  monthLabel: {
    fontSize: 9,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
});

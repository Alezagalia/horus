/**
 * MonthSelector Component
 * Sprint 10 - US-090
 *
 * Month/Year selector with arrow navigation
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MonthSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const MonthSelector = ({ month, year, onMonthChange }: MonthSelectorProps) => {
  const handlePrevious = () => {
    if (month === 1) {
      // Go to December of previous year
      onMonthChange(12, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      // Go to January of next year
      onMonthChange(1, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  // Check if we're in the current month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.arrow} onPress={handlePrevious} activeOpacity={0.7}>
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>

      <View style={styles.dateContainer}>
        <Text style={styles.monthText}>{MONTH_NAMES[month - 1]}</Text>
        <Text style={styles.yearText}>{year}</Text>
        {isCurrentMonth && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentBadgeText}>Actual</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.arrow} onPress={handleNext} activeOpacity={0.7}>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  arrow: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  arrowText: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: '600',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
  },
  yearText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
    textTransform: 'uppercase',
  },
});

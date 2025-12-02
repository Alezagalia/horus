/**
 * WeeklyChart Component
 * Sprint 5 - US-041
 *
 * Bar chart showing completion percentage for the last 7 days.
 * X-axis: days of the week (L, M, M, J, V, S, D)
 * Y-axis: percentage (0-100%)
 * Bars colored dynamically based on percentage.
 */

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';

interface WeeklyChartProps {
  data: Array<{
    date: string; // ISO date string
    completed: number;
    total: number;
    percentage: number;
  }>;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 64; // 32px padding on each side

  // Map data to chart format with day labels
  const chartData = data.map((item) => {
    const date = new Date(item.date);
    const dayLabel = getDayLabel(date.getDay());

    return {
      day: dayLabel,
      percentage: item.percentage,
      fill: getBarColor(item.percentage),
      datum: { fill: getBarColor(item.percentage) },
    };
  });

  return (
    <View style={styles.container}>
      <VictoryChart
        width={chartWidth}
        height={180}
        theme={VictoryTheme.material}
        domainPadding={{ x: 20 }}
        padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fontSize: 12, fill: '#666' },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickValues={[0, 25, 50, 75, 100]}
          style={{
            axis: { stroke: '#E0E0E0' },
            tickLabels: { fontSize: 10, fill: '#666' },
            grid: { stroke: '#F5F5F5', strokeDasharray: '4, 4' },
          }}
        />
        <VictoryBar
          data={chartData}
          x="day"
          y="percentage"
          style={{
            data: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              fill: (d: any) => d.datum.fill,
            },
          }}
          cornerRadius={{ top: 4 }}
          barWidth={20}
        />
      </VictoryChart>
    </View>
  );
};

/**
 * Get day label in Spanish (short form)
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
const getDayLabel = (dayOfWeek: number): string => {
  const labels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  return labels[dayOfWeek];
};

/**
 * Get bar color based on percentage
 * - Green (>80%)
 * - Yellow (50-80%)
 * - Red (<50%)
 */
const getBarColor = (percentage: number): string => {
  if (percentage >= 80) return '#4CAF50'; // Green
  if (percentage >= 50) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

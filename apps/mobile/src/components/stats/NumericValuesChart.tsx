/**
 * NumericValuesChart Component
 * Sprint 5 - US-042
 *
 * Line chart showing values recorded for NUMERIC habits over last 30 days.
 * Includes target line if targetValue is defined.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';

interface NumericValuesChartProps {
  data: Array<{
    date: string;
    value: number | null;
  }>;
  targetValue?: number;
  unit?: string;
  averageValue?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
}

export const NumericValuesChart: React.FC<NumericValuesChartProps> = ({
  data,
  targetValue,
  unit,
  averageValue,
  minValue,
  maxValue,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 32;

  // Filter out null values and format for Victory
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d, index) => ({
      x: index,
      y: d.value as number,
      date: d.date,
    }));

  // Create target line data if targetValue exists
  const targetLineData =
    targetValue !== undefined
      ? [
          { x: 0, y: targetValue },
          { x: chartData.length - 1, y: targetValue },
        ]
      : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolución de Valores</Text>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        {averageValue !== null && averageValue !== undefined && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Promedio</Text>
            <Text style={styles.statValue}>
              {Math.round(averageValue)} {unit || ''}
            </Text>
          </View>
        )}
        {minValue !== null && minValue !== undefined && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mínimo</Text>
            <Text style={styles.statValue}>
              {Math.round(minValue)} {unit || ''}
            </Text>
          </View>
        )}
        {maxValue !== null && maxValue !== undefined && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Máximo</Text>
            <Text style={styles.statValue}>
              {Math.round(maxValue)} {unit || ''}
            </Text>
          </View>
        )}
      </View>

      {chartData.length > 0 ? (
        <VictoryChart
          width={chartWidth}
          height={220}
          theme={VictoryTheme.material}
          padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
        >
          <VictoryAxis
            style={{
              axis: { stroke: '#E0E0E0' },
              tickLabels: { fontSize: 10, fill: '#666' },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: '#E0E0E0' },
              tickLabels: { fontSize: 10, fill: '#666' },
              grid: { stroke: '#F5F5F5', strokeDasharray: '4, 4' },
            }}
          />

          {/* Target line */}
          {targetLineData && (
            <VictoryLine
              data={targetLineData}
              style={{
                data: { stroke: '#FF9800', strokeWidth: 2, strokeDasharray: '6, 4' },
              }}
            />
          )}

          {/* Values line */}
          <VictoryLine
            data={chartData}
            style={{
              data: { stroke: '#2196F3', strokeWidth: 3 },
            }}
            interpolation="monotoneX"
          />
        </VictoryChart>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No hay valores registrados</Text>
        </View>
      )}

      {targetValue !== undefined && (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Valores registrados</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: '#FF9800', height: 2 }]} />
            <Text style={styles.legendText}>
              Objetivo ({targetValue} {unit || ''})
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
  },
});

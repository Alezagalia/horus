/**
 * CurrencyPicker Component
 * Sprint 9 - US-079
 *
 * Picker component for selecting currency
 */

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CurrencyPickerProps {
  value: string;
  onChange: (currency: string) => void;
  error?: string;
}

const CURRENCIES = [
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'USD', name: 'Dólar', symbol: 'US$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'BRL', name: 'Real', symbol: 'R$' },
];

export function CurrencyPicker({ value, onChange, error }: CurrencyPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Moneda *</Text>
      <View style={styles.optionsGrid}>
        {CURRENCIES.map((currency) => {
          const isSelected = value === currency.code;
          return (
            <TouchableOpacity
              key={currency.code}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(currency.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.symbol, isSelected && styles.symbolSelected]}>
                {currency.symbol}
              </Text>
              <Text style={[styles.code, isSelected && styles.codeSelected]}>{currency.code}</Text>
              <Text style={[styles.name, isSelected && styles.nameSelected]}>{currency.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionSelected: {
    borderColor: '#4F46E5',
    borderWidth: 3,
    backgroundColor: '#EEF2FF',
  },
  symbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  symbolSelected: {
    color: '#4F46E5',
  },
  code: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 2,
  },
  codeSelected: {
    color: '#4F46E5',
  },
  name: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  nameSelected: {
    color: '#6366F1',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

export { CURRENCIES };

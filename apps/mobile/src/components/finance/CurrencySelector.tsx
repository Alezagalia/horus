/**
 * CurrencySelector Component
 * Sprint 10 - US-089
 *
 * Selector de moneda para gastos recurrentes
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';

export type Currency = 'ARS' | 'USD' | 'EUR' | 'BRL';

interface CurrencyOption {
  code: Currency;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'ARS', name: 'Peso Argentino', symbol: '$', flag: '🇦🇷' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: '🇧🇷' },
];

interface CurrencySelectorProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  error?: string;
  label?: string;
}

export const CurrencySelector = ({
  value,
  onChange,
  error,
  label = 'Moneda',
}: CurrencySelectorProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCurrency = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  const handleSelect = (currency: CurrencyOption) => {
    onChange(currency.code);
    setModalVisible(false);
  };

  const renderCurrency = ({ item }: { item: CurrencyOption }) => (
    <TouchableOpacity
      style={[styles.currencyItem, value === item.code && styles.currencyItemSelected]}
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.flag}>{item.flag}</Text>
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.code}</Text>
        <Text style={styles.currencyName}>{item.name}</Text>
      </View>
      {value === item.code && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label} *</Text>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectedContent}>
          <Text style={styles.flag}>{selectedCurrency.flag}</Text>
          <Text style={styles.selectedText}>
            {selectedCurrency.code} - {selectedCurrency.name}
          </Text>
        </View>
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Moneda</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={CURRENCIES}
              renderItem={renderCurrency}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#FFF',
    minHeight: 50,
  },
  selectorError: {
    borderColor: '#D32F2F',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  listContent: {
    padding: 16,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  currencyItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currencyName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

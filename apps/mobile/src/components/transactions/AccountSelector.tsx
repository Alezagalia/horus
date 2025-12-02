/**
 * AccountSelector Component
 * Sprint 9 - US-081
 *
 * Selector for choosing an account for a transaction
 */

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Account } from '../../api/accounts.api';
import { formatCurrency } from '../../utils/currency';

interface AccountSelectorProps {
  accounts: Account[];
  value?: string;
  onChange: (accountId: string) => void;
  error?: string;
}

export function AccountSelector({ accounts, value, onChange, error }: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find((acc) => acc.id === value);
  const activeAccounts = accounts.filter((acc) => acc.isActive);

  const handleSelect = (accountId: string) => {
    onChange(accountId);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cuenta *</Text>

      {/* Selected Account Display */}
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        {selectedAccount ? (
          <View style={styles.selectedContent}>
            <View style={[styles.accountIcon, { backgroundColor: selectedAccount.color }]}>
              <Ionicons name={selectedAccount.icon as any} size={20} color="#FFFFFF" />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{selectedAccount.name}</Text>
              <Text style={styles.accountBalance}>
                {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.placeholder}>Selecciona una cuenta</Text>
        )}
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Modal Picker */}
      <Modal visible={isOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cuenta</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {activeAccounts.map((account) => {
                const isSelected = value === account.id;
                return (
                  <TouchableOpacity
                    key={account.id}
                    style={[styles.accountOption, isSelected && styles.accountOptionSelected]}
                    onPress={() => handleSelect(account.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                      <Ionicons name={account.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(account.currentBalance, account.currency)}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
  },
  selectorError: {
    borderColor: '#EF4444',
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  accountBalance: {
    fontSize: 13,
    color: '#6B7280',
  },
  error: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  accountOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
});

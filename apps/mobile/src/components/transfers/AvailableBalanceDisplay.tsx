/**
 * AvailableBalanceDisplay Component
 * Sprint 9 - US-082
 *
 * Shows available balance of source account for transfers
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/currency';

interface AvailableBalanceDisplayProps {
  balance: number;
  currency: string;
  isInsufficient?: boolean;
}

export function AvailableBalanceDisplay({
  balance,
  currency,
  isInsufficient = false,
}: AvailableBalanceDisplayProps) {
  return (
    <View style={[styles.container, isInsufficient && styles.containerError]}>
      <Ionicons
        name={isInsufficient ? 'alert-circle' : 'wallet'}
        size={16}
        color={isInsufficient ? '#EF4444' : '#6B7280'}
      />
      <Text style={[styles.label, isInsufficient && styles.labelError]}>Saldo disponible:</Text>
      <Text style={[styles.balance, isInsufficient && styles.balanceError]}>
        {formatCurrency(balance, currency, { decimals: 2 })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  containerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  labelError: {
    color: '#EF4444',
  },
  balance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  balanceError: {
    color: '#EF4444',
  },
});

import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCreateAccount } from '@/hooks/useAccounts';
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_ICONS,
  type AccountType,
} from '@/services/api/accountApi';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Colors, Spacing } from '@/tokens';

const CURRENCIES = ['ARS', 'USD', 'EUR'];
const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

export default function OnboardingFirstAccount() {
  const createAccount = useCreateAccount();
  const [name, setName] = useState('Efectivo');
  const [type, setType] = useState<AccountType>('efectivo');
  const [currency, setCurrency] = useState('ARS');
  const [balance, setBalance] = useState('');

  const goNext = () => router.push('/(onboarding)/notificaciones');

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Poné un nombre a la cuenta');
      return;
    }
    const initialBalance = parseFloat(balance.replace(',', '.')) || 0;
    createAccount.mutate(
      { name: name.trim(), type, currency, initialBalance },
      {
        onSuccess: goNext,
        onError: () => {
          Alert.alert('Error', 'No pudimos crear la cuenta. Podés hacerlo después desde Yo.');
          goNext();
        },
      }
    );
  };

  return (
    <OnboardingScaffold
      step={3}
      title="Tu primera cuenta 💰"
      subtitle="Para registrar gastos e ingresos necesitás al menos una cuenta (efectivo, banco o billetera)."
      footer={
        <>
          <Button
            label="Crear cuenta y continuar"
            onPress={handleCreate}
            loading={createAccount.isPending}
            disabled={createAccount.isPending}
          />
          <Button label="Ahora no" variant="ghost" onPress={goNext} />
        </>
      }
    >
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Ej. Efectivo, Banco Nación…"
        placeholderTextColor={Colors.muted}
      />

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.chipRow}>
        {ACCOUNT_TYPES.map((t) => (
          <Chip
            key={t}
            label={`${ACCOUNT_TYPE_ICONS[t]} ${ACCOUNT_TYPE_LABELS[t]}`}
            active={type === t}
            onPress={() => setType(t)}
          />
        ))}
      </View>

      <Text style={styles.label}>Moneda</Text>
      <View style={styles.chipRow}>
        {CURRENCIES.map((c) => (
          <Chip key={c} label={c} active={currency === c} onPress={() => setCurrency(c)} />
        ))}
      </View>

      <Text style={styles.label}>Saldo inicial (opcional)</Text>
      <TextInput
        style={styles.input}
        value={balance}
        onChangeText={setBalance}
        placeholder="0"
        placeholderTextColor={Colors.muted}
        keyboardType="decimal-pad"
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  input: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: Colors.ink,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.vivid,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'horus-account-usage';

type UsageMap = Record<string, number>;

/**
 * Cuenta cuántas veces se usó cada cuenta (p. ej. para pagar), persistido en el
 * dispositivo. Sirve para ordenar los selectores de cuenta de más usada a menos.
 */
export function useAccountUsage() {
  const [usage, setUsage] = useState<UsageMap>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setUsage(JSON.parse(raw) as UsageMap);
      })
      .catch(() => {});
  }, []);

  const recordUse = useCallback((accountId: string) => {
    if (!accountId) return;
    setUsage((prev) => {
      const next = { ...prev, [accountId]: (prev[accountId] ?? 0) + 1 };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const sortByUsage = useCallback(
    <T extends { id: string; name: string }>(list: T[]): T[] =>
      [...list].sort((a, b) => {
        const diff = (usage[b.id] ?? 0) - (usage[a.id] ?? 0);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
      }),
    [usage]
  );

  return { usage, recordUse, sortByUsage };
}

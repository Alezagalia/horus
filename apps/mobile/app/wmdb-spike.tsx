import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { database } from '@/db';
import { syncOffline } from '@/db/sync';
import { Account } from '@/db/models/Account';
import { Colors, Spacing, Radius } from '@/tokens';

// Pantalla de spike (Fase 0 offline-first). Prueba: crear cuenta local (offline) →
// Sincronizar → aparece en el server sin duplicar. TODO: quitar cuando termine el spike.
export default function WmdbSpikeScreen() {
  const [rows, setRows] = useState<Account[]>([]);
  const [status, setStatus] = useState('—');

  const refresh = useCallback(async () => {
    const list = await database.get<Account>('accounts').query().fetch();
    setRows(list);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createLocal = async () => {
    await database.write(async () => {
      await database.get<Account>('accounts').create((a) => {
        a.name = `PoC ${new Date().toLocaleTimeString()}`;
        a.type = 'banco';
        a.currency = 'ARS';
        a.balance = 0;
        a.isActive = true;
      });
    });
    setStatus('cuenta local creada (pendiente de sync)');
    await refresh();
  };

  const doSync = async () => {
    setStatus('sincronizando…');
    try {
      await syncOffline();
      setStatus('✅ sync OK');
    } catch (e) {
      setStatus('❌ ' + String((e as Error)?.message ?? e));
    }
    await refresh();
  };

  const resetLocal = async () => {
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    setStatus('DB local reseteada');
    await refresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>WMDB Spike — sync accounts</Text>
      <Text style={styles.status}>Estado: {status}</Text>
      <Text style={styles.count}>Cuentas locales: {rows.length}</Text>

      <TouchableOpacity style={styles.btn} onPress={createLocal}>
        <Text style={styles.btnText}>+ cuenta local (offline)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={doSync}>
        <Text style={styles.btnText}>Sincronizar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.reset]} onPress={resetLocal}>
        <Text style={styles.btnText}>Reset DB local</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
        <Text style={styles.back}>← Volver</Text>
      </TouchableOpacity>

      <View style={{ marginTop: Spacing.lg }}>
        {rows.map((a) => (
          <View key={a.id} style={styles.row}>
            <Text style={styles.rowName}>{a.name}</Text>
            <Text style={styles.rowMeta}>
              {a.currency} · {a.type} · saldo {String(a.balance)}
            </Text>
            <Text style={styles.rowId}>{a.id}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.xl, paddingTop: 60 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, color: Colors.ink, marginBottom: Spacing.sm },
  status: { fontFamily: 'Inter_500Medium', fontSize: 13, color: Colors.muted },
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.ink,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reset: { backgroundColor: '#ef4444' },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#fff' },
  back: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.vivid },
  row: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 6,
  },
  rowName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: Colors.ink },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted, marginTop: 2 },
  rowId: { fontFamily: 'Inter_400Regular', fontSize: 10, color: Colors.ceilLight, marginTop: 2 },
});

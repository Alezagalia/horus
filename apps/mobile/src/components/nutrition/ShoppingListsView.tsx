import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Plus, Trash2, CheckCircle2, Circle, ShoppingCart, Wallet } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius } from '@/tokens';
import {
  useShoppingLists,
  useCreateShoppingList,
  useDeleteShoppingList,
  useCheckShoppingItem,
  useLinkTransaction,
} from '@/hooks/useNutrition';
import { useTransactions } from '@/hooks/useTransactions';
import type { ShoppingList } from '@horus/shared';
import type { Transaction } from '@/services/api/transactionApi';

function money(amount: number, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Link transaction modal ─────────────────────────────────────────────────────

function LinkTransactionModal({ listId, onClose }: { listId: string; onClose: () => void }) {
  const { data, isLoading } = useTransactions({ type: 'egreso', limit: 30 });
  const link = useLinkTransaction();
  const transactions = data?.transactions ?? [];

  const handleLink = (tx: Transaction) => {
    link.mutate(
      { listId, transactionId: tx.id },
      {
        onSuccess: onClose,
        onError: (err: any) =>
          Alert.alert('Error', err?.response?.data?.message ?? 'No se pudo vincular el gasto'),
      }
    );
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vincular gasto</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.ink} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Elegí un egreso reciente para asociar a esta lista.</Text>

          {isLoading ? (
            <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 20 }} />
          ) : transactions.length === 0 ? (
            <Text style={styles.empty}>No hay egresos recientes.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {transactions.map((tx) => (
                <TouchableOpacity
                  key={tx.id}
                  style={styles.txRow}
                  onPress={() => handleLink(tx)}
                  disabled={link.isPending}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txConcept} numberOfLines={1}>
                      {tx.concept}
                    </Text>
                    <Text style={styles.txMeta}>
                      {format(parseISO(tx.date), 'd MMM', { locale: es })} · {tx.account?.name}
                    </Text>
                  </View>
                  <Text style={styles.txAmount}>{money(tx.amount, tx.account?.currency)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── List card ──────────────────────────────────────────────────────────────────

function ShoppingListCard({ list }: { list: ShoppingList }) {
  const checkItem = useCheckShoppingItem();
  const deleteList = useDeleteShoppingList();
  const [linking, setLinking] = useState(false);

  const checked = list.items.filter((i) => i.checked).length;
  const total = list.items.length;

  return (
    <Card solid style={styles.listCard}>
      <View style={styles.listHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listName}>{list.name}</Text>
          <Text style={styles.listProgress}>
            {checked}/{total} ítems
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Eliminar lista', `¿Eliminar "${list.name}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => deleteList.mutate(list.id) },
            ])
          }
          hitSlop={8}
        >
          <Trash2 size={16} color={Colors.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      {list.items.length === 0 ? (
        <Text style={styles.emptyItems}>Lista vacía</Text>
      ) : (
        list.items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemRow}
            onPress={() =>
              checkItem.mutate({ listId: list.id, itemId: item.id, checked: !item.checked })
            }
            activeOpacity={0.7}
          >
            {item.checked ? (
              <CheckCircle2 size={18} color={Colors.vivid} strokeWidth={2} />
            ) : (
              <Circle size={18} color={Colors.muted} strokeWidth={1.8} />
            )}
            <Text
              style={[
                styles.itemText,
                item.checked && { textDecorationLine: 'line-through', color: Colors.muted },
              ]}
            >
              {item.name}
            </Text>
            <Text style={styles.itemQty}>
              {Math.round(item.quantity)} {item.unit}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {list.transactionId ? (
        <View style={styles.linkedBadge}>
          <Wallet size={13} color="#22c55e" strokeWidth={2} />
          <Text style={styles.linkedText}>Gasto vinculado</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.linkBtn} onPress={() => setLinking(true)}>
          <Wallet size={14} color={Colors.vivid} strokeWidth={2} />
          <Text style={styles.linkLabel}>Registrar gasto</Text>
        </TouchableOpacity>
      )}

      {linking && <LinkTransactionModal listId={list.id} onClose={() => setLinking(false)} />}
    </Card>
  );
}

// ─── Main view ──────────────────────────────────────────────────────────────────

export function ShoppingListsView() {
  const { data: lists = [], isLoading } = useShoppingLists();
  const createList = useCreateShoppingList();
  const [name, setName] = useState('');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createList.mutate(
      { name: trimmed },
      {
        onSuccess: () => setName(''),
        onError: () => Alert.alert('Error', 'No se pudo crear la lista'),
      }
    );
  };

  return (
    <View>
      <View style={styles.createRow}>
        <TextInput
          style={styles.createInput}
          value={name}
          onChangeText={setName}
          placeholder="Nueva lista…"
          placeholderTextColor={Colors.muted}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <TouchableOpacity
          style={[styles.createBtn, (!name.trim() || createList.isPending) && { opacity: 0.45 }]}
          onPress={handleCreate}
          disabled={!name.trim() || createList.isPending}
        >
          {createList.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Plus size={20} color="#fff" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.vivid} style={{ marginTop: Spacing.xl }} />
      ) : lists.length === 0 ? (
        <Card solid style={styles.emptyCard}>
          <ShoppingCart size={32} color={Colors.ceilLight} strokeWidth={1} />
          <Text style={styles.emptyTitle}>Sin listas de compra</Text>
          <Text style={styles.emptySub}>Creá una o generá una desde el planificador</Text>
        </Card>
      ) : (
        lists.map((l) => <ShoppingListCard key={l.id} list={l} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  createInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.vivid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listCard: { marginBottom: Spacing.md },
  listHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  listName: { fontFamily: 'Inter_700Bold', fontSize: 15, color: Colors.ink },
  listProgress: { fontFamily: 'Inter_400Regular', fontSize: 12, color: Colors.muted, marginTop: 2 },
  emptyItems: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    paddingVertical: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  itemText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.ink },
  itemQty: { fontFamily: 'Inter_500Medium', fontSize: 12, color: Colors.muted },

  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: '#22c55e18',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  linkedText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#22c55e' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: Colors.ice,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  linkLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: Colors.vivid },

  emptyCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: Colors.ink,
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },

  // modal
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    padding: Spacing.lg,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: Colors.ink },
  hint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: Spacing.md,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    gap: Spacing.sm,
  },
  txConcept: { fontFamily: 'Inter_500Medium', fontSize: 14, color: Colors.ink },
  txMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: Colors.muted, marginTop: 2 },
  txAmount: { fontFamily: 'Inter_700Bold', fontSize: 13, color: Colors.ink },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

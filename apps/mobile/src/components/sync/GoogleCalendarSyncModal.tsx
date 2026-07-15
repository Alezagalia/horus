import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Calendar, RefreshCw, CheckCircle2, AlertCircle, Unlink } from 'lucide-react-native';
import { Colors, Spacing, Radius, Shadows, Typography } from '@/tokens';
import {
  useSyncStatus,
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useTriggerSync,
} from '@/hooks/useSync';

export function GoogleCalendarSyncModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { data: status, isLoading: statusLoading, refetch } = useSyncStatus();
  const connect = useConnectGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const triggerSync = useTriggerSync();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const handleConnect = () => {
    setSyncMsg(null);
    connect.mutate(undefined, {
      // 'success' = volvió por el deep link con OK; 'cancel' = cerró el navegador
      onSuccess: (res) => {
        refetch();
        setSyncMsg(res === 'success' ? '✓ Cuenta conectada' : null);
      },
      onError: (err) => {
        // El backend manda mensajes útiles (400 credenciales sin configurar,
        // 402 requiere Pro) — mostrarlos en vez de un genérico
        console.error('[GCal connect]', err);
        const axiosErr = err as Error & { response?: { data?: { message?: string } } };
        setSyncMsg(
          axiosErr.response?.data?.message ??
            axiosErr.message ??
            'Error al conectar. Intentá de nuevo.'
        );
      },
    });
  };

  const handleSync = () => {
    setSyncMsg(null);
    triggerSync.mutate(undefined, {
      onSuccess: (res) => {
        setSyncMsg(`✓ ${res.eventsImported} importados · ${res.eventsUpdated} actualizados`);
      },
      onError: () => setSyncMsg('Error al sincronizar'),
    });
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Desconectar Google Calendar',
      '¿Seguro? Los eventos importados quedan como locales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: () => {
            disconnect.mutate(undefined, {
              onSuccess: () => {
                setSyncMsg(null);
              },
            });
          },
        },
      ]
    );
  };

  const lastSyncLabel = (() => {
    if (!status?.lastSyncAt) return 'Nunca';
    try {
      return formatDistanceToNow(parseISO(status.lastSyncAt), { locale: es, addSuffix: true });
    } catch {
      return status.lastSyncAt;
    }
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={syncStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={syncStyles.sheet}>
        {/* Header */}
        <View style={syncStyles.sheetHeader}>
          <Text style={syncStyles.sheetTitle}>Google Calendar</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={20} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        {statusLoading ? (
          <ActivityIndicator color={Colors.vivid} style={{ marginVertical: 24 }} />
        ) : status?.isConnected ? (
          /* ── Connected state ── */
          <View style={syncStyles.body}>
            <View style={syncStyles.statusRow}>
              <CheckCircle2 size={18} color="#10B981" />
              <Text style={syncStyles.statusLabel}>Conectado</Text>
            </View>
            {status.googleEmail && <Text style={syncStyles.emailText}>{status.googleEmail}</Text>}
            <Text style={syncStyles.lastSync}>Última sincronización: {lastSyncLabel}</Text>

            {status.needsReconnect && (
              <View style={syncStyles.warnRow}>
                <AlertCircle size={14} color="#F59E0B" />
                <Text style={syncStyles.warnText}>Requiere reconexión</Text>
              </View>
            )}

            {syncMsg && <Text style={syncStyles.syncMsg}>{syncMsg}</Text>}

            <TouchableOpacity
              style={[syncStyles.btn, syncStyles.btnPrimary]}
              onPress={handleSync}
              disabled={triggerSync.isPending}
              activeOpacity={0.8}
            >
              {triggerSync.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCw size={16} color="#fff" />
              )}
              <Text style={syncStyles.btnPrimaryText}>Sincronizar ahora</Text>
            </TouchableOpacity>

            {status.needsReconnect && (
              <TouchableOpacity
                style={[syncStyles.btn, syncStyles.btnSecondary]}
                onPress={handleConnect}
                disabled={connect.isPending}
                activeOpacity={0.8}
              >
                <Text style={syncStyles.btnSecondaryText}>Reconectar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[syncStyles.btn, syncStyles.btnDestructive]}
              onPress={handleDisconnect}
              disabled={disconnect.isPending}
              activeOpacity={0.8}
            >
              <Unlink size={15} color="#EF4444" />
              <Text style={syncStyles.btnDestructiveText}>Desconectar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Disconnected state ── */
          <View style={syncStyles.body}>
            <View style={syncStyles.statusRow}>
              <AlertCircle size={18} color={Colors.muted} />
              <Text style={[syncStyles.statusLabel, { color: Colors.muted }]}>No conectado</Text>
            </View>
            <Text style={syncStyles.description}>
              Sincronizá tus eventos de Horus con Google Calendar para verlos en todos tus
              dispositivos.
            </Text>

            {syncMsg && <Text style={syncStyles.syncMsg}>{syncMsg}</Text>}

            <TouchableOpacity
              style={[syncStyles.btn, syncStyles.btnPrimary]}
              onPress={handleConnect}
              disabled={connect.isPending}
              activeOpacity={0.8}
            >
              {connect.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Calendar size={16} color="#fff" />
              )}
              <Text style={syncStyles.btnPrimaryText}>Conectar Google Calendar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const syncStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    paddingBottom: 40,
    ...Shadows.nav,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  sheetTitle: {
    ...Typography.bodyLg,
    color: Colors.ink,
  },
  body: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusLabel: {
    ...Typography.bodyStrong,
    color: '#10B981',
  },
  emailText: {
    ...Typography.caption,
    color: Colors.muted,
    marginLeft: 26,
  },
  lastSync: {
    ...Typography.caption,
    color: Colors.muted,
    marginLeft: 26,
  },
  warnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  warnText: {
    ...Typography.caption,
    color: '#D97706',
    fontWeight: '600',
  },
  syncMsg: {
    ...Typography.caption,
    color: Colors.vivid,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.muted,
    lineHeight: 20,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.xl,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  btnPrimary: {
    backgroundColor: Colors.vivid,
    ...Shadows.cta,
  },
  btnPrimaryText: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: Colors.bgMid,
  },
  btnSecondaryText: {
    ...Typography.bodyStrong,
    color: Colors.ink,
  },
  btnDestructive: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  btnDestructiveText: {
    ...Typography.bodyStrong,
    color: '#EF4444',
  },
});

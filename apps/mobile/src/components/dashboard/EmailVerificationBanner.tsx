/**
 * Email verification banner (S-01.3 — mobile)
 *
 * Shown on the home screen while the logged-in user's email is not verified.
 * Verification is non-blocking; this is a nudge. The verification link itself
 * arrives by email and opens the web app, so here we only surface the state and
 * let the user re-send the email.
 */

import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MailWarning } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import { Radius, Spacing } from '@/tokens';

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Only nudge users we know are unverified. Undefined (older sessions) → silent.
  if (!user || user.emailVerifiedAt !== null || user.emailVerifiedAt === undefined) {
    return null;
  }

  const handleResend = async () => {
    if (!user.email) return;
    setStatus('sending');
    try {
      await authApi.resendVerification(user.email);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={styles.banner}>
      <MailWarning size={18} color="#92400E" />
      <View style={styles.body}>
        <Text style={styles.text}>
          Verificá tu email <Text style={styles.email}>{user.email}</Text> para activar tu
          suscripción cuando la necesites.
        </Text>
        {status === 'sent' ? (
          <Text style={styles.sent}>¡Link reenviado! Revisá tu correo.</Text>
        ) : (
          <TouchableOpacity onPress={handleResend} disabled={status === 'sending'}>
            <View style={styles.actionRow}>
              {status === 'sending' && <ActivityIndicator size="small" color="#92400E" />}
              <Text style={styles.action}>
                {status === 'sending'
                  ? 'Enviando…'
                  : status === 'error'
                    ? 'Reintentar envío'
                    : 'Reenviar link'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  body: { flex: 1 },
  text: { color: '#92400E', fontSize: 13, lineHeight: 18 },
  email: { fontWeight: '700' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  action: { color: '#92400E', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  sent: { color: '#047857', fontSize: 13, fontWeight: '700', marginTop: 6 },
});

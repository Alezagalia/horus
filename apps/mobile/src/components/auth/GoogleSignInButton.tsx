import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { apiErrorMessage } from '@/lib/apiError';
import { signInWithGoogle } from '@/services/googleSignIn';
import { Colors, Spacing, Radius } from '@/tokens';

const WEB_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api').replace(
  /\/api\/?$/,
  ''
);

interface Props {
  /**
   * Consentimiento ya capturado en la pantalla (checkbox de register).
   * Si el backend igual responde 409 TERMS_ACCEPTANCE_REQUIRED (login de un
   * email nuevo), se muestra el modal de términos y se reintenta.
   */
  acceptedTerms?: boolean;
}

export function GoogleSignInButton({ acceptedTerms }: Props) {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const [loading, setLoading] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);

  const attempt = async (idToken: string, terms?: boolean) => {
    try {
      await loginWithGoogle(idToken, terms);
      // Sin navegación acá: el guard de (auth)/_layout decide wizard o tabs.
    } catch (err: any) {
      if (err?.response?.data?.meta?.code === 'TERMS_ACCEPTANCE_REQUIRED') {
        setPendingIdToken(idToken);
        setTermsVisible(true);
        return;
      }
      Alert.alert(
        'Error con Google',
        apiErrorMessage(err, 'No pudimos iniciar sesión con Google. Probá de nuevo.')
      );
    }
  };

  const handlePress = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (idToken) await attempt(idToken, acceptedTerms || undefined);
    } catch (err: any) {
      Alert.alert('Error con Google', err?.message ?? 'No pudimos conectar con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTerms = async () => {
    const idToken = pendingIdToken;
    setTermsVisible(false);
    setPendingIdToken(null);
    if (!idToken) return;
    setLoading(true);
    try {
      await attempt(idToken, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => void handlePress()}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={Colors.ink} size="small" />
        ) : (
          <>
            <Text style={styles.gLogo}>G</Text>
            <Text style={styles.label}>Continuar con Google</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={termsVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Un último paso</Text>
            <Text style={styles.modalText}>
              Para crear tu cuenta necesitamos que aceptes los{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(`${WEB_URL}/terms`)}>
                Términos
              </Text>{' '}
              y la{' '}
              <Text style={styles.link} onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}>
                Política de Privacidad
              </Text>
              .
            </Text>
            <TouchableOpacity
              style={styles.modalCta}
              onPress={() => void handleAcceptTerms()}
              activeOpacity={0.85}
            >
              <Text style={styles.modalCtaText}>Aceptar y continuar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setTermsVisible(false);
                setPendingIdToken(null);
              }}
            >
              <Text style={styles.modalCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  dividerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.muted,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  gLogo: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#4285F4',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,31,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius['2xl'],
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: Colors.ink,
    marginBottom: Spacing.sm,
  },
  modalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
    marginBottom: Spacing.xl,
  },
  link: {
    color: Colors.vivid,
    fontFamily: 'Inter_600SemiBold',
  },
  modalCta: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalCtaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  modalCancel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
});

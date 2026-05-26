import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { authApi } from '@/services/api/authApi';
import { Colors, Typography, Spacing, Radius, Shadows } from '@/tokens';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Email requerido');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert('Error', 'No pudimos enviar el email. Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[{ color: Colors.vivid }, Typography.body]}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={[styles.title, Typography.displaySm]}>Recuperar contraseña</Text>

          {sent ? (
            <Text style={[{ color: Colors.muted, marginTop: 12 }, Typography.body]}>
              Te enviamos un email con las instrucciones. Revisá tu bandeja de entrada.
            </Text>
          ) : (
            <>
              <Text style={[{ color: Colors.muted, marginBottom: 20 }, Typography.body]}>
                Ingresá tu email y te enviamos un link para resetear tu contraseña.
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="tu@email.com"
                placeholderTextColor={Colors.muted}
              />
              <TouchableOpacity
                style={[styles.ctaButton, Shadows.cta]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.ctaText}>Enviar email</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.screenX, justifyContent: 'center' },
  backBtn: { position: 'absolute', top: 60, left: Spacing.screenX },
  form: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.card,
  },
  title: { color: Colors.deep, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
    fontFamily: 'Inter_400Regular',
    backgroundColor: Colors.bgTop,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
});

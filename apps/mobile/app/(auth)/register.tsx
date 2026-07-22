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
  ScrollView,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '@/tokens';

const WEB_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3000/api').replace(
  /\/api\/?$/,
  ''
);

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completá todos los campos.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña muy corta', 'Debe tener al menos 8 caracteres.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert(
        'Términos y Privacidad',
        'Debés aceptar los Términos y la Política de Privacidad para crear tu cuenta.'
      );
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        acceptedTerms,
      });
      // Sin navegación explícita: el guard de (auth)/_layout manda al wizard.
    } catch (err: any) {
      Alert.alert('Error al registrarse', err?.response?.data?.message ?? 'Intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <LinearGradient colors={Gradients.hero} style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </LinearGradient>
            <Text style={[styles.title, Typography.displayMd]}>Crear cuenta</Text>
            <Text style={[styles.subtitle, Typography.body]}>Empezá tu productividad hoy</Text>
          </View>

          <View style={styles.form}>
            {(['Nombre', 'Email', 'Contraseña'] as const).map((field) => (
              <View key={field}>
                <Text style={[styles.label, Typography.bodyStrong]}>{field}</Text>
                <TextInput
                  style={styles.input}
                  value={field === 'Nombre' ? name : field === 'Email' ? email : password}
                  onChangeText={
                    field === 'Nombre' ? setName : field === 'Email' ? setEmail : setPassword
                  }
                  keyboardType={field === 'Email' ? 'email-address' : 'default'}
                  autoCapitalize={field === 'Nombre' ? 'words' : 'none'}
                  secureTextEntry={field === 'Contraseña'}
                  placeholder={
                    field === 'Nombre'
                      ? 'Tu nombre'
                      : field === 'Email'
                        ? 'tu@email.com'
                        : '••••••••'
                  }
                  placeholderTextColor={Colors.muted}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptedTerms((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={[styles.termsText, Typography.body]}>
                Acepto los{' '}
                <Text style={styles.termsLink} onPress={() => Linking.openURL(`${WEB_URL}/terms`)}>
                  Términos
                </Text>{' '}
                y la{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => Linking.openURL(`${WEB_URL}/privacy`)}
                >
                  Política de Privacidad
                </Text>
                .
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaButton, Shadows.cta, { marginTop: 20 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <GoogleSignInButton acceptedTerms={acceptedTerms} />

            <View style={styles.loginRow}>
              <Text style={[{ color: Colors.muted }, Typography.body]}>¿Ya tenés cuenta? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={[{ color: Colors.vivid, fontWeight: '600' }, Typography.body]}>
                  Iniciá sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 60,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: '700', color: '#fff', fontFamily: 'Inter_700Bold' },
  title: { color: Colors.deep, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { color: Colors.muted, fontFamily: 'Inter_500Medium' },
  form: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.card,
  },
  label: { color: Colors.ink, fontFamily: 'Inter_600SemiBold', marginBottom: 6, marginTop: 12 },
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
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.ceil,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Colors.vivid,
    borderColor: Colors.vivid,
  },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  termsText: { flex: 1, color: Colors.muted },
  termsLink: { color: Colors.vivid, fontWeight: '600' },
  ctaButton: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
});

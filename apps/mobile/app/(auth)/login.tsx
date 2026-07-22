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
import { useAuthStore } from '@/store/authStore';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Colors, Typography, Spacing, Radius, Shadows, Gradients } from '@/tokens';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresá tu email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Sin navegación explícita: el guard de (auth)/_layout decide si va al
      // wizard de onboarding o directo a tabs.
    } catch (err: any) {
      Alert.alert(
        'Error al iniciar sesión',
        err?.response?.data?.message ?? 'Verificá tus credenciales.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.bgTop, Colors.bgMid, Colors.bgBottom]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Logo / Brand */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient colors={Gradients.hero} style={styles.logo}>
              <Text style={styles.logoText}>H</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.title, Typography.displayMd]}>Horus</Text>
          <Text style={[styles.subtitle, Typography.body]}>Tu productividad personal</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.label, Typography.bodyStrong]}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="tu@email.com"
            placeholderTextColor={Colors.muted}
          />

          <Text style={[styles.label, Typography.bodyStrong]}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
            placeholderTextColor={Colors.muted}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
            <Text style={[{ color: Colors.vivid }, Typography.caption]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctaButton, Shadows.cta]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <GoogleSignInButton />

          <View style={styles.registerRow}>
            <Text style={[{ color: Colors.muted }, Typography.body]}>¿No tenés cuenta? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[{ color: Colors.vivid, fontWeight: '600' }, Typography.body]}>
                Registrate
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.screenX,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { marginBottom: 16 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  title: { color: Colors.deep, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { color: Colors.muted, fontFamily: 'Inter_500Medium' },
  form: {
    backgroundColor: Colors.surfaceSolid,
    borderRadius: Radius['3xl'],
    padding: Spacing['2xl'],
    ...Shadows.card,
  },
  label: {
    color: Colors.ink,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
    marginTop: 12,
  },
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
  forgotLink: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 20 },
  ctaButton: {
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});

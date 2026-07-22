import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

/**
 * Google Sign-In nativo (account picker del sistema).
 *
 * webClientId debe ser el WEB client ID del proyecto GCP (no el Android):
 * define la audience del idToken que el backend verifica en POST /auth/google.
 */

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });
  configured = true;
}

/**
 * Abre el account picker y devuelve el idToken, o null si el usuario canceló.
 * Lanza en errores reales (Play Services ausente, config incompleta, red).
 */
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') return null;
    const idToken = response.data.idToken;
    if (!idToken) throw new Error('Google no devolvió idToken (¿falta webClientId?)');
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    throw error;
  }
}

/** Best-effort en logout: limpia la sesión Google local del dispositivo. */
export async function signOutFromGoogle(): Promise<void> {
  try {
    ensureConfigured();
    await GoogleSignin.signOut();
  } catch {
    // silencioso — no bloquea el logout de Horus
  }
}

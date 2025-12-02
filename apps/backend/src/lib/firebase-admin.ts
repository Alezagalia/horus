/**
 * Firebase Admin SDK Configuration
 * Sprint 12 - US-105
 *
 * Inicializa Firebase Admin SDK para enviar notificaciones push FCM
 */

import * as admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

/**
 * Inicializa Firebase Admin SDK
 * Solo se inicializa una vez (singleton pattern)
 */
export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  // Verificar que las credenciales estén configuradas
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('⚠️  Firebase credentials not configured. Push notifications will be disabled.');
    console.warn(
      '   Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
    );

    // Retornar null si no hay credenciales (modo development sin Firebase)
    // Las funciones que usan Firebase deben manejar este caso
    return null as any;
  }

  try {
    // Parsear private key (viene con \n escapados en .env)
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Obtiene la instancia de Firebase Admin
 * Inicializa automáticamente si no existe
 */
export function getFirebaseAdmin(): admin.app.App | null {
  if (!firebaseApp) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

/**
 * Obtiene la instancia de Firebase Cloud Messaging
 */
export function getMessaging(): admin.messaging.Messaging | null {
  const app = getFirebaseAdmin();
  if (!app) {
    return null;
  }
  return admin.messaging(app);
}

/**
 * Verifica si Firebase está configurado
 */
export function isFirebaseConfigured(): boolean {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;

  return !!(FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY);
}

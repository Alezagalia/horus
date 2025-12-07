/**
 * Push Notification Routes
 * Sprint 12 - US-105 + US-107
 */

import { Router } from 'express';
import * as pushController from '../controllers/push.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * GET /api/push/vapid-public-key
 * Retorna VAPID public key (no requiere auth)
 * Sprint 12 - US-107
 */
router.get('/vapid-public-key', pushController.getVapidPublicKey);

// Todas las demás rutas requieren autenticación
router.use(authMiddleware);

/**
 * POST /api/push/register
 * Registra o actualiza un token de dispositivo
 */
router.post('/register', pushController.registerToken);

/**
 * POST /api/push/unregister
 * Desactiva un token de dispositivo
 */
router.post('/unregister', pushController.unregisterToken);

/**
 * GET /api/push/tokens
 * Obtiene todos los tokens activos del usuario
 */
router.get('/tokens', pushController.getUserTokens);

/**
 * POST /api/push/test
 * Envía una notificación de prueba (solo desarrollo)
 */
router.post('/test', pushController.sendTestPush);

export default router;

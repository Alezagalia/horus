/**
 * Notification Permission Prompt Component
 * Sprint 12 - US-107
 *
 * Muestra un prompt flotante pidiendo permisos de notificaciones
 */

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useWebPushNotifications } from '../hooks/useWebPushNotifications';

export interface NotificationPermissionPromptProps {
  /**
   * Si es true, el prompt no se muestra automáticamente
   */
  disabled?: boolean;

  /**
   * Callback cuando el usuario acepta o rechaza
   */
  onResponse?: (granted: boolean) => void;
}

export function NotificationPermissionPrompt({
  disabled = false,
  onResponse,
}: NotificationPermissionPromptProps) {
  const { permission, isSupported, requestPermission, isLoading } = useWebPushNotifications();

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const shouldShow =
      !disabled &&
      isSupported &&
      permission === 'default' &&
      !isDismissed &&
      !sessionStorage.getItem('notification-prompt-dismissed');

    setIsVisible(shouldShow);
  }, [disabled, isSupported, permission, isDismissed]);

  const handleEnable = async () => {
    try {
      await requestPermission();
      onResponse?.(true);
      setIsVisible(false);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onResponse?.(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
    onResponse?.(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Activa las notificaciones
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Recibe recordatorios de tus hábitos y tareas directamente en tu navegador.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleEnable}
                disabled={isLoading}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isLoading ? 'Habilitando...' : 'Habilitar'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={isLoading}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Más tarde
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-500 dark:hover:text-gray-400"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Google Calendar Sync Modal Component
 * Sprint 13 - US-118
 */

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useGoogleCalendarStatus,
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useSyncGoogleCalendar,
} from '@/hooks/useGoogleCalendar';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;

export function GoogleCalendarSyncModal({ isOpen, onClose }: GoogleCalendarSyncModalProps) {
  const { data: status, isLoading, refetch } = useGoogleCalendarStatus();
  const connectMutation = useConnectGoogleCalendar();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const syncMutation = useSyncGoogleCalendar();

  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'google-calendar-connected') {
        setIsConnecting(false);
        refetch(); // Refresh status
      } else if (event.data.type === 'google-calendar-error') {
        setIsConnecting(false);
        // Error already shown by popup
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const { authUrl } = await connectMutation.mutateAsync();

      // Open OAuth popup
      const left = window.screen.width / 2 - POPUP_WIDTH / 2;
      const top = window.screen.height / 2 - POPUP_HEIGHT / 2;

      const popup = window.open(
        authUrl,
        'google-calendar-auth',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      );

      if (!popup) {
        setIsConnecting(false);
        alert('Por favor, permite popups para conectar con Google Calendar');
        return;
      }

      // Monitor popup closure
      const checkClosed = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsConnecting(false);
            // Refresh status after popup closes (user might have connected)
            setTimeout(() => {
              refetch();
            }, 500);
          }
        } catch (error) {
          // COOP policy might block popup.closed check - ignore and continue
          console.log('Cannot check popup status (COOP policy)');
        }
      }, 500);
    } catch (error) {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        '¿Estás seguro de que deseas desconectar Google Calendar? Los eventos importados se eliminarán.'
      )
    ) {
      return;
    }
    await disconnectMutation.mutateAsync();
  };

  const handleSync = async () => {
    await syncMutation.mutateAsync();
  };

  if (!isOpen) return null;

  const isConnected = status?.isConnected || false;
  const isSyncing = syncMutation.isPending;
  const isDisconnecting = disconnectMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Google Calendar</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : isConnected ? (
              /* Connected State */
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Conectado</p>
                    {status?.googleEmail && (
                      <p className="text-sm text-green-700 mt-1">{status.googleEmail}</p>
                    )}
                  </div>
                </div>

                {/* Last Sync */}
                {status?.lastSyncAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Última sincronización:{' '}
                      {formatDistanceToNow(new Date(status.lastSyncAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                )}

                {/* Token Warning */}
                {status?.hasValidToken === false && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ Tu conexión ha expirado. Por favor, reconecta tu cuenta.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleSync}
                    disabled={isSyncing || status?.hasValidToken === false}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSyncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Sincronizando...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Sincronizar Ahora
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="w-full px-4 py-3 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                  </button>
                </div>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sincroniza con Google Calendar
                  </h3>
                  <p className="text-gray-600">
                    Conecta tu cuenta de Google para importar y sincronizar todos tus eventos
                    automáticamente.
                  </p>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                      </svg>
                      Conectar Google Calendar
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  Al conectarte, autorizas a Horus a leer tus eventos de Google Calendar
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

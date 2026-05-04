/**
 * Calendar Connections Modal
 * Sprint 15 - Multi-Calendar Support
 *
 * Unified modal for managing Google Calendar and Microsoft Calendar connections.
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
import {
  useMicrosoftCalendarStatus,
  useConnectMicrosoftCalendar,
  useDisconnectMicrosoftCalendar,
  useSyncMicrosoftCalendar,
} from '@/hooks/useCalendarConnections';

interface CalendarConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;

function openOAuthPopup(authUrl: string, popupName: string, onClosed: () => void): Window | null {
  const left = window.screen.width / 2 - POPUP_WIDTH / 2;
  const top = window.screen.height / 2 - POPUP_HEIGHT / 2;

  const popup = window.open(
    authUrl,
    popupName,
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
  );

  if (!popup) return null;

  const checkClosed = setInterval(() => {
    try {
      if (popup.closed) {
        clearInterval(checkClosed);
        setTimeout(onClosed, 500);
      }
    } catch {
      // COOP policy might block popup.closed check
    }
  }, 500);

  return popup;
}

// ─── Google Calendar Section ─────────────────────────────────────────────────

function GoogleCalendarSection() {
  const { data: status, isLoading, refetch } = useGoogleCalendarStatus();
  const connectMutation = useConnectGoogleCalendar();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const syncMutation = useSyncGoogleCalendar();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'google-calendar-connected') {
        setIsConnecting(false);
        refetch();
      } else if (event.data?.type === 'google-calendar-error') {
        setIsConnecting(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const { authUrl } = await connectMutation.mutateAsync();
      const popup = openOAuthPopup(authUrl, 'google-calendar-auth', () => {
        setIsConnecting(false);
        refetch();
      });
      if (!popup) {
        setIsConnecting(false);
        alert('Por favor, permite popups para conectar con Google Calendar');
      }
    } catch {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Deseas desconectar Google Calendar? Los eventos importados se eliminarán.'))
      return;
    await disconnectMutation.mutateAsync();
  };

  const isConnected = status?.isConnected || false;

  return (
    <ProviderSection
      icon={
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
        </svg>
      }
      iconBg="bg-blue-100"
      title="Google Calendar"
      connectLabel="Conectar Google Calendar"
      connectingLabel="Conectando..."
      reconnectLabel="Reconectar Google Calendar"
      isLoading={isLoading}
      isConnected={isConnected}
      email={status?.googleEmail}
      lastSyncAt={status?.lastSyncAt}
      needsReconnect={status?.needsReconnect}
      isConnecting={isConnecting}
      isSyncing={syncMutation.isPending}
      isDisconnecting={disconnectMutation.isPending}
      connectBtnColor="bg-blue-600 hover:bg-blue-700"
      onConnect={handleConnect}
      onSync={() => syncMutation.mutate()}
      onDisconnect={handleDisconnect}
      connectDescription="Conecta tu cuenta de Google para importar y sincronizar tus eventos automáticamente."
    />
  );
}

// ─── Microsoft Calendar Section ───────────────────────────────────────────────

function MicrosoftCalendarSection() {
  const { data: status, isLoading, refetch } = useMicrosoftCalendarStatus();
  const connectMutation = useConnectMicrosoftCalendar();
  const disconnectMutation = useDisconnectMicrosoftCalendar();
  const syncMutation = useSyncMicrosoftCalendar();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'microsoft-calendar-connected') {
        setIsConnecting(false);
        refetch();
      } else if (event.data?.type === 'microsoft-calendar-error') {
        setIsConnecting(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refetch]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const { authUrl } = await connectMutation.mutateAsync();
      const popup = openOAuthPopup(authUrl, 'microsoft-calendar-auth', () => {
        setIsConnecting(false);
        refetch();
      });
      if (!popup) {
        setIsConnecting(false);
        alert('Por favor, permite popups para conectar con Microsoft Calendar');
      }
    } catch {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Deseas desconectar Microsoft Calendar? Los eventos importados se eliminarán.'))
      return;
    await disconnectMutation.mutateAsync();
  };

  const isConnected = status?.isConnected || false;

  return (
    <ProviderSection
      icon={
        <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.5 2C6.25 2 2 6.25 2 11.5S6.25 21 11.5 21 21 16.75 21 11.5 16.75 2 11.5 2zM10 16.5v-9l6 4.5-6 4.5z" />
        </svg>
      }
      iconBg="bg-indigo-100"
      title="Microsoft Outlook"
      connectLabel="Conectar Outlook Calendar"
      connectingLabel="Conectando..."
      reconnectLabel="Reconectar Outlook Calendar"
      isLoading={isLoading}
      isConnected={isConnected}
      email={status?.email}
      lastSyncAt={status?.lastSyncAt}
      needsReconnect={status?.needsReconnect}
      isConnecting={isConnecting}
      isSyncing={syncMutation.isPending}
      isDisconnecting={disconnectMutation.isPending}
      connectBtnColor="bg-indigo-600 hover:bg-indigo-700"
      onConnect={handleConnect}
      onSync={() => syncMutation.mutate()}
      onDisconnect={handleDisconnect}
      connectDescription="Conecta tu cuenta de Microsoft para importar tus eventos de Outlook Calendar."
    />
  );
}

// ─── Generic Provider Section ─────────────────────────────────────────────────

interface ProviderSectionProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  connectLabel: string;
  connectingLabel: string;
  reconnectLabel: string;
  isLoading: boolean;
  isConnected: boolean;
  email?: string | null;
  lastSyncAt?: string | null;
  needsReconnect?: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  isDisconnecting: boolean;
  connectBtnColor: string;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
  connectDescription: string;
}

function ProviderSection({
  icon,
  iconBg,
  title,
  connectLabel,
  connectingLabel,
  reconnectLabel,
  isLoading,
  isConnected,
  email,
  lastSyncAt,
  needsReconnect,
  isConnecting,
  isSyncing,
  isDisconnecting,
  connectBtnColor,
  onConnect,
  onSync,
  onDisconnect,
  connectDescription,
}: ProviderSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      {/* Provider Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {isConnected && !needsReconnect && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            Conectado
          </span>
        )}
        {needsReconnect && (
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            Expirado
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      ) : isConnected ? (
        <div className="space-y-3">
          {email && <p className="text-sm text-gray-600">{email}</p>}

          {lastSyncAt && (
            <p className="text-xs text-gray-500">
              Última sincronización:{' '}
              {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true, locale: es })}
            </p>
          )}

          {needsReconnect && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
              ⚠️ Tu conexión ha expirado. Por favor, reconecta tu cuenta.
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {needsReconnect ? (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {isConnecting ? connectingLabel : reconnectLabel}
              </button>
            ) : (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white ${connectBtnColor} rounded-lg disabled:opacity-50`}
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                    Sincronizando...
                  </>
                ) : (
                  'Sincronizar'
                )}
              </button>
            )}
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">{connectDescription}</p>
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white ${connectBtnColor} rounded-lg disabled:opacity-50`}
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                {connectingLabel}
              </>
            ) : (
              connectLabel
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function CalendarConnectionsModal({ isOpen, onClose }: CalendarConnectionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-xl font-semibold text-gray-900">Calendarios externos</h2>
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
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-500">
              Conecta tus calendarios externos para importar y sincronizar eventos automáticamente.
            </p>
            <GoogleCalendarSection />
            <MicrosoftCalendarSection />
          </div>
        </div>
      </div>
    </div>
  );
}

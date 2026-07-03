import { useAuthStore } from '../authStore';
import { authApi, type AuthUser } from '../../services/api/authApi';

jest.mock('../../services/api/authApi');

const verifiedUser: AuthUser = {
  id: 'u-1',
  name: 'Ale',
  email: 'ale@example.com',
  hourlyRate: null,
  emailVerifiedAt: '2026-07-02T10:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-02T10:00:00.000Z',
};

const unverifiedUser: AuthUser = { ...verifiedUser, emailVerifiedAt: null };

beforeEach(() => {
  jest.clearAllMocks();
  // Estado base entre tests: sin sesión.
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
});

describe('authStore.refreshUser', () => {
  it('actualiza el user con la respuesta fresca de getMe cuando hay sesión', async () => {
    // Escenario del bug: user en memoria quedó sin verificar; el backend ya lo verificó.
    useAuthStore.setState({ user: unverifiedUser, isAuthenticated: true });
    (authApi.getMe as jest.Mock).mockResolvedValue(verifiedUser);

    await useAuthStore.getState().refreshUser();

    expect(authApi.getMe).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user?.emailVerifiedAt).toBe('2026-07-02T10:00:00.000Z');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('no llama a getMe si no hay sesión', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false });

    await useAuthStore.getState().refreshUser();

    expect(authApi.getMe).not.toHaveBeenCalled();
  });

  it('no togglea isLoading (refresh silencioso, sin spinner de pantalla completa)', async () => {
    useAuthStore.setState({ user: unverifiedUser, isAuthenticated: true, isLoading: false });
    (authApi.getMe as jest.Mock).mockResolvedValue(verifiedUser);

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('deja el estado intacto si getMe falla (best-effort)', async () => {
    useAuthStore.setState({ user: unverifiedUser, isAuthenticated: true });
    (authApi.getMe as jest.Mock).mockRejectedValue(new Error('network error'));

    await expect(useAuthStore.getState().refreshUser()).resolves.toBeUndefined();

    // Mantiene el user previo y la sesión; no rompe la app.
    expect(useAuthStore.getState().user).toBe(unverifiedUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});

import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';

/**
 * Predicado ÚNICO de los guards de routing (auth/onboarding/tabs). Los tres
 * layouts deben usar este hook — si cada uno calculara su propia versión,
 * cualquier discrepancia produce loops de redirección.
 *
 * No redirigir hasta que `ready` sea true: antes de hidratar el flag local
 * podríamos mandar al wizard a un usuario que ya lo completó offline.
 */
export function useNeedsOnboarding(): { needsOnboarding: boolean; ready: boolean } {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const localCompleted = useOnboardingStore((s) => s.localCompleted);
  const hydrated = useOnboardingStore((s) => s.hydrated);

  const needsOnboarding =
    isAuthenticated &&
    user != null &&
    user.onboardingCompletedAt == null &&
    !localCompleted.has(user.id);

  return { needsOnboarding, ready: !isLoading && hydrated };
}

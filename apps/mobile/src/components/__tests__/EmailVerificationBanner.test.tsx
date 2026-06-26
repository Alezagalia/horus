import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EmailVerificationBanner } from '../dashboard/EmailVerificationBanner';

let mockUser: { email: string; emailVerifiedAt: string | null | undefined } | null = null;

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

const mockResend = jest.fn().mockResolvedValue(undefined);
jest.mock('@/services/api/authApi', () => ({
  authApi: { resendVerification: (email: string) => mockResend(email) },
}));

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    mockResend.mockClear();
  });

  it('renders nothing when the user is verified', () => {
    mockUser = { email: 'a@b.c', emailVerifiedAt: '2026-01-01T00:00:00Z' };
    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when verification state is unknown (undefined)', () => {
    mockUser = { email: 'a@b.c', emailVerifiedAt: undefined };
    const { toJSON } = render(<EmailVerificationBanner />);
    expect(toJSON()).toBeNull();
  });

  it('nudges an unverified user and re-sends on tap', async () => {
    mockUser = { email: 'a@b.c', emailVerifiedAt: null };
    const { getByText } = render(<EmailVerificationBanner />);

    expect(getByText('a@b.c')).toBeTruthy();
    fireEvent.press(getByText('Reenviar link'));

    await waitFor(() => expect(mockResend).toHaveBeenCalledWith('a@b.c'));
    await waitFor(() => expect(getByText('¡Link reenviado! Revisá tu correo.')).toBeTruthy());
  });
});

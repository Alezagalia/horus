// Módulo nativo sin implementación en Jest → mock completo
module.exports = {
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ type: 'success', data: { idToken: 'test-id-token' } }),
    signOut: jest.fn().mockResolvedValue(undefined),
  },
  isErrorWithCode: () => false,
  statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
};

// Setup file for react-native@0.76.9 compatibility with jest-expo@56 + @react-native/jest-preset@0.85.3
// Mocks TurboModuleRegistry native modules that aren't available in Jest

process.env.RNTL_SKIP_DEPS_CHECK = 'true';

// Mock TurboModuleRegistry so getEnforcing() doesn't throw for missing native modules
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: jest.fn((name) => {
    switch (name) {
      case 'PlatformConstants':
        return {
          getConstants: () => ({
            isTesting: true,
            isDisableAnimations: false,
            reactNativeVersion: { major: 0, minor: 76, patch: 9, prerelease: null },
            Version: 34,
            Release: '14',
            Serial: 'unknown',
            Fingerprint: 'unknown',
            Model: 'Jest',
            ServerHost: undefined,
            uiMode: 'normal',
            Brand: 'google',
            Manufacturer: 'Google',
          }),
          getAndroidID: () => 'test-android-id',
        };
      case 'DeviceInfo':
        return {
          getConstants: () => ({
            Dimensions: {
              screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
              window: { width: 375, height: 667, scale: 2, fontScale: 1 },
            },
            isIPhoneX_deprecated: false,
          }),
        };
      default:
        return {
          getConstants: () => ({}),
          addListener: jest.fn(),
          removeListeners: jest.fn(),
        };
    }
  }),
  get: jest.fn(() => null),
}));

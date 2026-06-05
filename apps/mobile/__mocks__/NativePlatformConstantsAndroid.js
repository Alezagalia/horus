// Stub for react-native/src/private/specs/modules/NativePlatformConstantsAndroid
// Bypasses TurboModuleRegistry.getEnforcing('PlatformConstants') in Jest
const constants = {
  isTesting: true,
  reactNativeVersion: { major: 0, minor: 76, patch: 9, prerelease: null },
  Version: 34,
  Release: '14',
  Serial: 'unknown',
  Fingerprint: 'unknown',
  Model: 'Jest',
  uiMode: 'normal',
  Brand: 'google',
  Manufacturer: 'Google',
};

module.exports = {
  getConstants: () => constants,
  getAndroidID: () => 'test-android-id',
  ...constants,
};
module.exports.default = module.exports;

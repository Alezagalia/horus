// Stub for expo-modules-core/src/polyfill/dangerous-internal (introduced in expo@53)
module.exports = {
  installExpoGlobalPolyfill: () => {
    if (typeof globalThis !== 'undefined') {
      globalThis.expo = globalThis.expo || {};
      globalThis.expo.modules = globalThis.expo.modules || {};
      globalThis.expo.SharedObject = globalThis.expo.SharedObject || class SharedObject {};
    }
  },
};

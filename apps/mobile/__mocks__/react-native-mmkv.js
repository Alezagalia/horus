const store = new Map();

class MMKV {
  constructor() {}

  set(key, value) {
    store.set(key, value);
  }

  getString(key) {
    return store.get(key) ?? undefined;
  }

  getNumber(key) {
    return store.get(key) ?? undefined;
  }

  getBoolean(key) {
    return store.get(key) ?? undefined;
  }

  contains(key) {
    return store.has(key);
  }

  delete(key) {
    store.delete(key);
  }

  clearAll() {
    store.clear();
  }

  getAllKeys() {
    return Array.from(store.keys());
  }
}

module.exports = { MMKV };

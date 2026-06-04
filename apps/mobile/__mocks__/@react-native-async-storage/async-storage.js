const store = new Map();

const AsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(store.get(key) ?? null)),
  setItem: jest.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    store.delete(key);
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    store.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(store.keys()))),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map((k) => [k, store.get(k) ?? null]))),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([k, v]) => store.set(k, v));
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => store.delete(k));
    return Promise.resolve();
  }),
};

module.exports = AsyncStorage;
module.exports.default = AsyncStorage;

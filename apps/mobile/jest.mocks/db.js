// Mock de '@/db' para Jest: no hay SQLite/JSI en el entorno de tests.
// Los loaders/writers se mockean por separado (jest.mocks/moneyQueries.js etc.).
module.exports = {
  database: {
    withChangesForTables: () => ({
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    write: async (fn) => fn(),
    get: () => {
      throw new Error('database.get no disponible en tests: mockear moneyQueries/moneyWrites');
    },
  },
};

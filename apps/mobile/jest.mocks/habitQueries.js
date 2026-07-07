module.exports = {
  utcNoonMs: jest.fn((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return Date.UTC(y, m - 1, d, 12, 0, 0, 0);
  }),
  shouldCompleteOnDate: jest.fn(() => true),
  listHabitsLocal: jest.fn(),
  getHabitStatsLocal: jest.fn(),
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // WatermelonDB usa decorators legacy en sus modelos.
      ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
      // react-native-reanimated MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};

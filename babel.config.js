module.exports = (api) => {
  const isProduction = api.env('production');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ...(isProduction ? [['transform-remove-console', { exclude: ['error'] }]] : []),
      // react-native-reanimated/plugin must stay last.
      'react-native-reanimated/plugin',
    ],
  };
};

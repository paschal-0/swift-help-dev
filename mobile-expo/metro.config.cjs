const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: require.resolve('./global.css'),
  configPath: require.resolve('./tailwind.config.js'),
});


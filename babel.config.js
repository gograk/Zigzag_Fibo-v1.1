module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // react-native-reanimated v4 requires this plugin (proxies react-native-worklets/plugin)
      // Without it, Metro fails silently to bundle 'worklet' directives → APK has no JS bundle
      'react-native-reanimated/plugin',
    ],
  };
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Reanimated нужно указывать последним
      "react-native-reanimated/plugin",
    ],
  };
};

module.exports = function (api) {
  api.cache(true);

  return {
    // expo-router/babel is deprecated as of SDK 50 - babel-preset-expo
    // already includes it, so this project (SDK 56) doesn't need it
    // listed separately. Removing it stops the warning spam; not a
    // functional change.
    presets: ['babel-preset-expo'],
  };
};

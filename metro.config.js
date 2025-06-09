const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

defaultConfig.resolver = defaultConfig.resolver || {};
defaultConfig.resolver.extraNodeModules = defaultConfig.resolver.extraNodeModules || {};

// Polyfills for Node.js core modules
defaultConfig.resolver.extraNodeModules = new Proxy(defaultConfig.resolver.extraNodeModules, {
  get: (target, name) => {
    if (typeof name !== 'string') {
      return target[name];
    }
    if (target.hasOwnProperty(name)) {
      return target[name];
    }
    switch (name) {
      case 'stream':
        return require.resolve('readable-stream');
      case 'http':
        return require.resolve('stream-http');
      case 'https':
        return require.resolve('stream-http'); // stream-http handles both
      case 'url':
        return require.resolve('react-native-url-polyfill'); // For URL and whatwg-url
      case 'crypto':
        // For 'crypto.getRandomValues' often used by UUID libraries
        // For a more complete crypto polyfill, you might need 'crypto-browserify'
        // but start with this for 'ws' which might only need basic crypto.
        return require.resolve('react-native-get-random-values'); 
      case 'buffer':
        return require.resolve('buffer/'); // Note the trailing slash
      case 'events':
        return require.resolve('events/'); // Note the trailing slash
      case 'util':
        return require.resolve('util/'); // Note the trailing slash
      case 'zlib':
        return require.resolve('browserify-zlib'); // Common polyfill for zlib
      case 'assert':
        return require.resolve('assert/'); // Common polyfill for assert
      // Add other Node.js core modules that 'ws' or its dependencies might need
      // e.g., 'net', 'tls', 'fs' (though 'fs' is usually a sign of deeper issues)
      case 'net':
        return require.resolve('react-native-tcp-socket');
      case 'tls':
        return require.resolve('react-native-tcp-socket'); // Attempt to use the same for tls
      default:
        return null; // Let Metro handle it or fail as usual
    }
  },
});

module.exports = defaultConfig; 
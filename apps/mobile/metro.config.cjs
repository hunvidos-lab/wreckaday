/* eslint-disable @typescript-eslint/no-require-imports */
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// __DEV__ hides the entry points; the resolver also removes their implementations
// from release dependency graphs (Metro otherwise serializes unreachable factories).
config.resolver.resolveRequest = (context, name, platform) => {
  if (!context.dev && ['./dev-console-runtime', '../src/dev-keys-form'].includes(name)) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, name, platform);
};
module.exports = config;

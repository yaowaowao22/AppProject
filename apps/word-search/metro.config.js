const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Mock native-only modules on web
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (
      moduleName === 'react-native-google-mobile-ads' ||
      moduleName === '@react-native-firebase/analytics' ||
      moduleName === '@react-native-firebase/app'
    ) {
      return {
        filePath: path.resolve(__dirname, '../../packages/ads/src/mock.ts'),
        type: 'sourceFile',
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '運転免許クイズ',
  slug: 'driving-test-quiz',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.massapp.drivingtestquiz',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.massapp.drivingtestquiz',
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-sqlite',
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
        iosAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
      },
    ],
  ],
});

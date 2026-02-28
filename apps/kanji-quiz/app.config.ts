import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '漢字クイズ',
  slug: 'kanji-quiz',
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
    bundleIdentifier: 'com.massapp.kanjiquiz',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.massapp.kanjiquiz',
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

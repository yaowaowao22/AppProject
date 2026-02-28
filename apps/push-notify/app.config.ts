import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'かんたんプッシュ',
  slug: 'push-notify',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0A1929',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.massapp.pushnotify',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0A1929',
    },
    package: 'com.massapp.pushnotify',
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: '6bb9b696-be28-40e8-a06b-dda93652e07c',
    },
  },
  owner: 'yaowao',
  plugins: [
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#1A237E',
        sounds: [],
      },
    ],
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
        iosAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
      },
    ],
  ],
});

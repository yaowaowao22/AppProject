import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'デモ計算機',
  slug: 'test-demo',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    backgroundColor: '#2196F3',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.massapp.testdemo',
  },
  android: {
    package: 'com.massapp.testdemo',
    edgeToEdgeEnabled: true,
  },
  web: {},
  plugins: [
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
        iosAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX',
      },
    ],
  ],
});

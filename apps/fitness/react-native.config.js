module.exports = {
  dependencies: {
    // Excluded: hoisted from @massapp/ads via pnpm workspace, not used by fitness
    'react-native-google-mobile-ads': {
      platforms: { ios: null, android: null },
    },
    // Excluded: hoisted from packages/analytics via pnpm workspace, not used by fitness
    '@react-native-firebase/app': {
      platforms: { ios: null, android: null },
    },
    '@react-native-firebase/analytics': {
      platforms: { ios: null, android: null },
    },
    '@react-native-firebase/crashlytics': {
      platforms: { ios: null, android: null },
    },
  },
};

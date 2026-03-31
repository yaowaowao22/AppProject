const React = require('react');

const insets = { top: 0, bottom: 0, left: 0, right: 0 };

module.exports = {
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => insets,
  SafeAreaInsetsContext: {
    Consumer: ({ children }: { children: (insets: typeof insets) => React.ReactNode }) =>
      children(insets),
  },
  initialWindowMetrics: {
    insets,
    frame: { x: 0, y: 0, width: 375, height: 812 },
  },
};

import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { PersistentHeaderProvider, useHeaderConfig, type HeaderConfig } from '../contexts/PersistentHeaderContext';
import { ScreenHeader } from './ScreenHeader';

// ── Inner component (consumes context) ───────────────────────────────────────

function StackWithHeaderInner({ children }: { children: ReactNode }) {
  const headerConfig = useHeaderConfig();

  return (
    <View style={styles.container}>
      {headerConfig.visible !== false && (
        <ScreenHeader
          title={headerConfig.title}
          subtitle={headerConfig.subtitle}
          showBack={headerConfig.showBack}
          onBack={headerConfig.onBack}
          showHamburger={headerConfig.showHamburger}
          rightAction={headerConfig.rightAction}
        />
      )}
      {children}
    </View>
  );
}

// ── Public wrapper ────────────────────────────────────────────────────────────

export function StackWithHeader({
  children,
  initialConfig,
}: {
  children: ReactNode;
  initialConfig?: HeaderConfig;
}) {
  return (
    <PersistentHeaderProvider initialConfig={initialConfig}>
      <StackWithHeaderInner>{children}</StackWithHeaderInner>
    </PersistentHeaderProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

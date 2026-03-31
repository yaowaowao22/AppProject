/**
 * App.tsx 統合テスト
 *
 * 対象: App.tsx
 * - ErrorBoundary: 子がエラーをスローした場合の表示
 * - プロバイダー階層の正しいネスト検証
 * - AppContent 内の ThemeProvider に createThemeConfig の結果が渡される
 * - WorkoutProvider が NavigationContainer 内の RootNavigator をラップしている
 * - StatusBar が style='light' で描画される
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// ── モック ─────────────────────────────────────────────────────────────────────

// 各プロバイダー・コンポーネントのレンダー追跡
const renderLog: string[] = [];

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children, style }: { children: React.ReactNode; style?: object }) => {
    renderLog.push('GestureHandlerRootView');
    const { View } = require('react-native');
    return <View style={style}>{children}</View>;
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => {
    renderLog.push('SafeAreaProvider');
    return <>{children}</>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockThemeConfig = { id: 'hakukou', colors: {} };
jest.mock('../theme', () => ({
  createThemeConfig: jest.fn(() => mockThemeConfig),
  THEME_PRESETS: {},
}));

const mockUseTheme = jest.fn(() => ({
  currentThemeId: 'hakukou',
  colors: { background: '#111113', surface1: '#1C1C1E' },
}));

jest.mock('../ThemeContext', () => ({
  TanrenThemeProvider: ({ children }: { children: React.ReactNode }) => {
    renderLog.push('TanrenThemeProvider');
    return <>{children}</>;
  },
  useTheme: () => mockUseTheme(),
}));

const mockThemeProvider = jest.fn(
  ({ children }: { children: React.ReactNode }) => {
    renderLog.push('ThemeProvider');
    return <>{children}</>;
  },
);

jest.mock('@massapp/ui', () => ({
  ThemeProvider: (props: { children: React.ReactNode; theme: object; initialMode: string }) =>
    mockThemeProvider(props),
}));

jest.mock('../WorkoutContext', () => ({
  WorkoutProvider: ({ children }: { children: React.ReactNode }) => {
    renderLog.push('WorkoutProvider');
    return <>{children}</>;
  },
  useWorkout: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => {
    renderLog.push('NavigationContainer');
    return <>{children}</>;
  },
}));

jest.mock('../navigation/RootNavigator', () => ({
  RootNavigator: () => {
    renderLog.push('RootNavigator');
    return <Text>RootNavigator</Text>;
  },
}));

const mockStatusBar = jest.fn(() => null);
jest.mock('expo-status-bar', () => ({
  StatusBar: (props: object) => {
    mockStatusBar(props);
    return null;
  },
}));

// ── ヘルパー ──────────────────────────────────────────────────────────────────

function renderApp() {
  const App = require('../App').default;
  return render(<App />);
}

// ── テスト前のリセット ─────────────────────────────────────────────────────────

beforeEach(() => {
  renderLog.length = 0;
  mockStatusBar.mockClear();
  mockThemeProvider.mockClear();
  jest.isolateModules(() => {});
});

// ── テスト ─────────────────────────────────────────────────────────────────────

describe('プロバイダー階層', () => {
  test('クラッシュせずにレンダリングできる', () => {
    const { toJSON } = renderApp();
    expect(toJSON()).not.toBeNull();
  });

  test('GestureHandlerRootView がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('GestureHandlerRootView');
  });

  test('SafeAreaProvider がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('SafeAreaProvider');
  });

  test('TanrenThemeProvider がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('TanrenThemeProvider');
  });

  test('ThemeProvider がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('ThemeProvider');
  });

  test('WorkoutProvider がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('WorkoutProvider');
  });

  test('NavigationContainer がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('NavigationContainer');
  });

  test('RootNavigator がレンダリングされる', () => {
    renderApp();
    expect(renderLog).toContain('RootNavigator');
  });

  test('GestureHandlerRootView → SafeAreaProvider → TanrenThemeProvider の順でレンダリングされる', () => {
    renderApp();
    const ghIndex = renderLog.indexOf('GestureHandlerRootView');
    const saIndex = renderLog.indexOf('SafeAreaProvider');
    const tpIndex = renderLog.indexOf('TanrenThemeProvider');
    expect(ghIndex).toBeLessThan(saIndex);
    expect(saIndex).toBeLessThan(tpIndex);
  });

  test('WorkoutProvider は NavigationContainer より前にレンダリングされる', () => {
    renderApp();
    const wpIndex = renderLog.indexOf('WorkoutProvider');
    const ncIndex = renderLog.indexOf('NavigationContainer');
    expect(wpIndex).toBeLessThan(ncIndex);
  });
});

describe('AppContent — ThemeProvider への createThemeConfig 受け渡し', () => {
  test('ThemeProvider が呼び出される', () => {
    renderApp();
    expect(mockThemeProvider).toHaveBeenCalled();
  });

  test('ThemeProvider に theme オブジェクトが渡される', () => {
    renderApp();
    const [props] = mockThemeProvider.mock.calls[0];
    expect(props.theme).toBeDefined();
  });

  test('ThemeProvider の initialMode が "dark"', () => {
    renderApp();
    const [props] = mockThemeProvider.mock.calls[0];
    expect(props.initialMode).toBe('dark');
  });
});

describe('StatusBar', () => {
  test('StatusBar が style="light" でレンダリングされる', () => {
    renderApp();
    expect(mockStatusBar).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'light' }),
    );
  });
});

describe('ErrorBoundary', () => {
  // コンソールエラーを抑制
  let consoleErrorSpy: jest.SpyInstance;
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('子がエラーをスローした場合に "App Error" テキストが表示される', () => {
    // RootNavigator をエラーを投げるものに置き換え
    jest.resetModules();

    jest.mock('../navigation/RootNavigator', () => ({
      RootNavigator: () => {
        throw new Error('test error message');
      },
    }));

    // 他のモックを再セット
    jest.mock('../ThemeContext', () => ({
      TanrenThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useTheme: () => ({
        currentThemeId: 'hakukou',
        colors: { background: '#111113', surface1: '#1C1C1E' },
      }),
    }));
    jest.mock('../WorkoutContext', () => ({
      WorkoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useWorkout: jest.fn(),
    }));
    jest.mock('@react-navigation/native', () => ({
      NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
    jest.mock('@massapp/ui', () => ({
      ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    jest.mock('../theme', () => ({
      createThemeConfig: () => ({}),
      THEME_PRESETS: {},
    }));

    const App = require('../App').default;
    const { getByText } = render(<App />);

    expect(getByText('App Error')).toBeTruthy();
  });

  test('エラーメッセージが表示される', () => {
    jest.resetModules();

    const errorMessage = 'specific error text';
    jest.mock('../navigation/RootNavigator', () => ({
      RootNavigator: () => {
        throw new Error(errorMessage);
      },
    }));
    jest.mock('../ThemeContext', () => ({
      TanrenThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useTheme: () => ({
        currentThemeId: 'hakukou',
        colors: { background: '#111113', surface1: '#1C1C1E' },
      }),
    }));
    jest.mock('../WorkoutContext', () => ({
      WorkoutProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
      useWorkout: jest.fn(),
    }));
    jest.mock('@react-navigation/native', () => ({
      NavigationContainer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
    jest.mock('@massapp/ui', () => ({
      ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    }));
    jest.mock('../theme', () => ({
      createThemeConfig: () => ({}),
      THEME_PRESETS: {},
    }));

    const App = require('../App').default;
    const { getByText } = render(<App />);

    expect(getByText(errorMessage)).toBeTruthy();
  });
});

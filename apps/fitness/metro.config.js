const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// ワークスペース全体ではなく実際に使用するパッケージのみ監視（メモリ節約）
const watchedPackages = [
  'analytics',
  'hooks',
  'navigation',
  'storage',
  'ui',
  'ads',
  'config',
].map((pkg) => path.resolve(workspaceRoot, 'packages', pkg));

config.watchFolders = [
  path.resolve(workspaceRoot, 'node_modules'),
  ...watchedPackages,
];
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(projectRoot, 'node_modules'),
];

// pnpm monorepo で @react-navigation が2箇所にインストールされるのを防ぐため
// 明示的にルートの node_modules に解決する
const rootModules = path.resolve(workspaceRoot, 'node_modules');
const reactNavigationPkgs = [
  '@react-navigation/native',
  '@react-navigation/core',
  '@react-navigation/native-stack',
  '@react-navigation/drawer',
  '@react-navigation/bottom-tabs',
  '@react-navigation/elements',
  '@react-navigation/routers',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react',
  'react-native',
];

const extraNodeModules = {};
for (const pkg of reactNavigationPkgs) {
  extraNodeModules[pkg] = path.resolve(rootModules, pkg);
}

config.resolver.extraNodeModules = new Proxy(extraNodeModules, {
  get: (target, name) =>
    target[String(name)] ?? path.join(rootModules, String(name)),
});

const dedupedSet = new Set(reactNavigationPkgs);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (dedupedSet.has(moduleName)) {
    const newContext = {
      ...context,
      nodeModulesPaths: [rootModules],
    };
    return context.resolveRequest(newContext, moduleName, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

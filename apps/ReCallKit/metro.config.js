const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// monorepo root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm monorepo: watch the entire monorepo so symlinked packages resolve
// Spread Expo's defaults to avoid replacing them (expo-doctor requirement)
config.watchFolders = [...(config.watchFolders ?? []), monorepoRoot];

// pnpm hoists to root node_modules — tell metro where to look
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// expo-sqlite Web: .wasm ファイルをアセットとして解決する
config.resolver.assetExts = [...(config.resolver.assetExts ?? []), 'wasm'];

// apps/ReCallKit/node_modules/ は Metro の HasteFS にインデックスされないため、
// ローカル npm install された @babel/runtime (7.29.x) の helpers が
// fileSystemLookup で "does not exist" と判定されバンドルが失敗する。
// resolveRequest で @babel/runtime を pnpm 管理のルート版 (7.28.x) に強制リダイレクト。
const rootNodeModules = path.resolve(monorepoRoot, 'node_modules');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@babel/runtime' || moduleName.startsWith('@babel/runtime/')) {
    const redirected = moduleName.replace(
      '@babel/runtime',
      path.join(rootNodeModules, '@babel/runtime'),
    );
    return context.resolveRequest(context, redirected, platform);
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

// Web向け: SharedArrayBuffer を使用する場合に必要な COOP/COEP ヘッダー
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;

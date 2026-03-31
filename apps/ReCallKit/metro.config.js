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

module.exports = config;

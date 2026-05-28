const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch monorepo packages
config.watchFolders = [monorepoRoot];

// Resolve modules from monorepo root first, then project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Support package.exports (pnpm)
config.resolver.unstable_enablePackageExports = true;

// Fix: override server root to project root (not monorepo root)
// When Gradle builds the APK, it passes --entry-file as a relative path from apps/mobile.
// Expo's getDefaultConfig sets unstable_serverRoot to the monorepo root, which causes Metro
// to resolve that relative path incorrectly. Setting it to projectRoot (apps/mobile) fixes it.
config.server = {
  ...config.server,
  unstable_serverRoot: projectRoot,
};

module.exports = config;

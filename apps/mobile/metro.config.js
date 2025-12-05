/**
 * Metro Configuration
 * Sprint 12 - US-108: Performance Optimization
 * Fixed for pnpm monorepo compatibility
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Fix for pnpm monorepo: redirect ../../App to the correct location
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // When expo/AppEntry.js tries to import ../../App, redirect to our App.tsx
  if (moduleName === '../../App' || moduleName === '../../App.js' || moduleName === '../../App.tsx') {
    return {
      filePath: path.resolve(projectRoot, 'App.tsx'),
      type: 'sourceFile',
    };
  }

  // Use the original resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Performance optimizations for production (US-108)
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Minification settings
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      keep_classnames: false,
      keep_fnames: false,
      mangle: {
        keep_classnames: false,
        keep_fnames: false,
      },
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        reduce_funcs: true,
        collapse_vars: true,
        pure_getters: true,
      },
      output: {
        ascii_only: true,
        comments: false,
        webkit: true,
      },
    },
  };
}

module.exports = config;

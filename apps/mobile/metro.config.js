/**
 * Metro Configuration
 * Sprint 12 - US-108: Performance Optimization
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

// Disable require.context warning
config.resolver.disableHierarchicalLookup = true;

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

  // Optimize resolver
  config.resolver = {
    ...config.resolver,
    // Disable symlinks for faster resolution
    resolveRequest: null,
  };
}

module.exports = config;

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parserOptions: {
        project: ['./apps/*/tsconfig.json', './packages/*/tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Pre-existing codebase has wide use of explicit `any` (typically for
      // loose Prisma includes and external SDK payloads). Surfaced as a
      // warning so it stays visible but doesn't block CI.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'max-len': [
        'warn',
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  // Web service worker uses browser/serviceworker globals (self, caches, clients...)
  {
    files: ['apps/web/public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    rules: {
      // The service worker is plain JS and doesn't go through tsconfig.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/prisma.config.ts',
      '**/vitest.config.ts',
      '**/vite.config.ts',
      '**/playwright.config.ts',
      'apps/web/e2e/**',
    ],
  }
);

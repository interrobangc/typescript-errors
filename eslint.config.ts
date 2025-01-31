/**
 * This is intended to be a basic starting point for linting in your app.
 * It relies on recommended configs out of the box for simplicity, but you can
 * and should modify this configuration to best suit your team's needs.
 */

import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintConfigPrettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  eslintConfigPrettier,
  {
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: true,
      },
    },
    env: {
      browser: true,
      commonjs: true,
      es6: true,
    },

    // Base config
    extends: ['eslint:recommended'],

    overrides: [
      // Typescript
      {
        files: ['**/*.{ts}'],
        plugins: ['@typescript-eslint', 'import', 'sonarjs'],
        parser: '@typescript-eslint/parser',
        settings: {
          'import/internal-regex': '^~/',
          'import/resolver': {
            node: {
              extensions: ['.ts', '.tsx'],
            },
            typescript: {
              alwaysTryTypes: true,
            },
          },
        },
        extends: [
          // 'plugin:sonarjs/recommended',
          'prettier',
          'plugin:@typescript-eslint/recommended',
          'plugin:import/recommended',
          'plugin:import/typescript',
        ],
        rules: {
          'no-console': 'error',
          'import/no-named-as-default': 'off',
          'no-prototype-builtins': 'off',
        },
      },

      // Node
      {
        files: ['.eslintrc.cjs'],
        env: {
          node: true,
        },
      },
    ],
  },
];

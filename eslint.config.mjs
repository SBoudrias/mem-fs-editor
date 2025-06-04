// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import xo from 'eslint-config-xo';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  eslint.configs.recommended,
  ...xo,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      'max-params': 'off',
      'no-eq-null': 'off',

      eqeqeq: [
        'error',
        'always',
        {
          null: 'ignore',
        },
      ],

      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.mts', '**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',

      // TODO: Need to fix the code to allow those rules
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  {
    files: ['__tests__/**'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  eslintPluginPrettierRecommended,
]);

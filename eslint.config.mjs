// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import xo from 'eslint-config-xo';
import tseslint from 'typescript-eslint';

export default tseslint.config([
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
      'default-param-last': 'off',
      'padding-line-between-statements': 'off',
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
    },
  },
  eslintPluginPrettierRecommended,
]);

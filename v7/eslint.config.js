// Flat config for ESLint v9+
import js from '@eslint/js'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import ts from '@typescript-eslint/eslint-plugin'
import importPlugin from 'eslint-plugin-import'
import promise from 'eslint-plugin-promise'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import noUnsanitized from 'eslint-plugin-no-unsanitized'

export default [
  { ignores: ['dist', 'node_modules', 'scripts/**', 'public/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, chrome: 'readonly', process: 'readonly' },
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: { '@typescript-eslint': ts, import: importPlugin, 'no-unsanitized': noUnsanitized, promise, unicorn, sonarjs, react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...js.configs.recommended.rules,
      ...ts.configs.recommended.rules,
      'import/order': ['error', { 'newlines-between': 'always' }],
      'promise/catch-or-return': 'error',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'unicorn/filename-case': 'off',
      'max-lines': ['error', { max: 75, skipBlankLines: true, skipComments: true }],
      'no-unsanitized/method': 'error',
      'no-unsanitized/property': 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { import: importPlugin },
    rules: {
      ...js.configs.recommended.rules,
      'import/order': ['error', { 'newlines-between': 'always' }],
      'max-lines': ['error', { max: 75, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['src/rules/**/*.ts'],
    rules: { 'max-lines': ['error', { max: 150, skipBlankLines: true, skipComments: true }] },
  },
  {
    files: ['src/rules/registry.ts', 'src/rules/head/metaDescription-enhanced.ts'],
    rules: { 'max-lines': 'off' },
  },
  {
    files: ['src/cli/runner.ts'],
    rules: { 'import/order': 'off' },
  },

]

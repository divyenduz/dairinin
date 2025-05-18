import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    rules: {
      'no-restricted-imports': ['error', {
        'patterns': [{
          'group': ['../*'],
          'message': 'Use @src/* imports instead of relative imports.'
        }]
      }],
      'import/no-relative-parent-imports': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'quotes': ['error', 'single']
    },
    settings: {
      'import/resolver': {
        'typescript': {}
      }
    }
  }
];
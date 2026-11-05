import css from '@eslint/css';
import js from '@eslint/js';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    rules: {
      curly: ['error', 'all'],
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: '[accessibility="private"]',
          message: '私有成员必须使用 JavaScript # 语法，禁止使用 private 关键字。'
        }
      ]
    }
  },
  { files: ['**/*.json'], language: 'json/json', extends: [json.configs.recommended] },
  { files: ['**/*.jsonc'], language: 'json/jsonc', extends: [json.configs.recommended] },
  { files: ['**/*.md'], language: 'markdown/commonmark', extends: [markdown.configs.recommended] },
  { files: ['**/*.css'], language: 'css/css', extends: [css.configs.recommended] }
]);

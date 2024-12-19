import typescriptEslint from '@typescript-eslint/eslint-plugin';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        '**/*.config.js',
        '**/coverage',
        '**/.idea',
        '**/.gitiginore',
        '**/.prettierrc',
        '**/*.tsx',
        '**/postcss.config.cjs'
    ],
}, ...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'), {
    plugins: {
        '@typescript-eslint': typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
        },

        parser: tsParser,
        ecmaVersion: 12,
        sourceType: 'module',
    },

    rules: {
        semi: ['error', 'always'],
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-unused-expressions': 'warn',
        '@typescript-eslint/no-explicit-any': 'off',
        quotes: ['error', 'single'],
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
    },
}];
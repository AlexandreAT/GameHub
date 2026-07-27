import eslint from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import typescriptEslint from 'typescript-eslint';

const typescriptFiles = ['**/*.{ts,tsx}'];

export default typescriptEslint.config(
    {
        ignores: ['dist']
    },
    {
        ...eslint.configs.recommended,
        files: typescriptFiles
    },
    ...typescriptEslint.configs.recommended.map((configuration) => ({
        ...configuration,
        files: typescriptFiles
    })),
    {
        files: typescriptFiles,
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true }
            ]
        }
    }
);

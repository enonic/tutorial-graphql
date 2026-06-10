const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    {
        // Replaces the former .eslintignore (ESLint 10 ignores that file).
        ignores: [
            'node_modules/',
            'build/',
            'dist/',
            'out/',
            '.xp/',
            'samples/',
            '**/*.js',
            '**/*.d.ts',
            '**/spec/**',
        ],
    },
    // recommendedTypeChecked == the old `recommended` + `recommended-requiring-type-checking`,
    // and also turns off core no-undef / no-unused-vars for TypeScript.
    ...tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },
        // Rules ported from the former .eslintrc.js. The ~15 core formatting rules
        // (max-len, quotes, semi, *-spacing, comma-dangle, …) and the removed
        // typescript-eslint rules (semi, ban-types, no-empty-interface) were dropped:
        // they no longer exist in ESLint 10 / typescript-eslint 8.
        rules: {
            'no-control-regex': 'off',
            'complexity': ['warn', {max: 4}],
            'prefer-const': 'off',
            'no-plusplus': 'off',
            'no-extra-boolean-cast': 'off',
            'no-prototype-builtins': 'off',
            'no-useless-escape': 'off',
            'no-empty-pattern': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/restrict-plus-operands': 'off',
            '@typescript-eslint/no-implied-eval': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/member-ordering': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            '@typescript-eslint/unbound-method': 'off',
        },
    },
);
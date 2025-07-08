const baseConfig = require('@enonic/eslint-config');
const js = require('@eslint/js');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const { plugin: tsPlugin } = require('typescript-eslint');

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
    ...baseConfig, // This includes the extended configuration from @enonic/eslint-config
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                browser: true,
                es6: true,
            },
        },
        plugins: {
            js,
            '@typescript-eslint': tsPlugin,
            'simple-import-sort': simpleImportSort,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            'eol-last': ['error', 'always'],
            'block-spacing': ['error', 'always'],
            'space-before-function-paren': ['error', {'anonymous': 'always', 'named': 'never'}],
            'space-in-parens': ['error', 'never'],
            'object-curly-spacing': ['error', 'never'],
            'lines-between-class-members': ['error', 'always', {exceptAfterSingleLine: true}],
            'spaced-comment': ['error', 'always', {'exceptions': ['-', '+']}],
            'arrow-spacing': ['error', {'before': true, 'after': true}],
            'array-bracket-spacing': ['error', 'never'],
            'computed-property-spacing': ['error', 'never'],
            'template-curly-spacing': ['error', 'never'],
            'object-property-newline': ['off', {'allowMultiplePropertiesPerLine': true}],
            'no-plusplus': ['error', {'allowForLoopAfterthoughts': true}],
            'comma-dangle': ['error', 'always-multiline'],
            'quotes': ['error', 'single', {'avoidEscape': true}],

            '@typescript-eslint/no-use-before-define': ['error', {'functions': false, 'classes': true}],
            '@typescript-eslint/member-ordering': ['error'],
            '@typescript-eslint/explicit-function-return-type': ['error', {
                allowExpressions: true,
                allowConciseArrowFunctionExpressionsStartingWithVoid: true,
            }],
            '@typescript-eslint/unbound-method': ['error', {ignoreStatic: true}],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            'semi': ['error', 'always'],

            'simple-import-sort/imports': [
                'error',
                {
                    "groups": [
                        ["^@", "^react$", "^next", "^~", "^[a-z]"],
                        ["^\\.\\.(?!/?$)", "^\\.\\./?$", "^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"], // relative
                        ["^.+\\.s?css$"], // styles
                        ["^\\u0000"], // side effects
                    ]
                }
            ],
        },
        linterOptions: {
            reportUnusedDisableDirectives: true,
        }
    },
    {
        ignores: [
            "**/node_modules/",
            "**/build/",
            "**/dist/",
            "**/.xp/",
            "**/*.js",
            "**/*.d.ts",
            "**/bin/",
            "src/test/**/*",
            "testing/**/*.js",
        ]
    }
];

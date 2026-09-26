module.exports = {
    default: {
        requireModule: ['ts-node/register', 'tsconfig-paths/register'],
        require: [
            'tests/e2e/step_definitions/**/*.ts',
            'tests/e2e/support/**/*.ts',
        ],
        paths: ['tests/e2e/features/**/*.feature'],
        format: ['pretty'],
        publishQuiet: true,
    },
};

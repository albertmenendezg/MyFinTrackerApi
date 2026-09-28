const { spawnSync } = require('node:child_process');
const path = require('node:path');

const migrationsDir = path.join(
    'libs',
    'shared',
    'src',
    'infrastructure',
    'persistence',
    'typeorm',
    'migrations',
);

const dataSource = path.join(
    'libs',
    'shared',
    'src',
    'infrastructure',
    'persistence',
    'typeorm',
    'data-source.ts'
);

const name = (process.argv[2] ?? 'migration').replace(/\.ts$/, '');
const target = path.join(migrationsDir, name);

console.log(`Generating migration: ${path.relative(process.cwd(), target)}.ts`);

let result;
try {
    result = spawnSync(
        'tsx',
        [
            path.join('node_modules', 'typeorm', 'cli.js'),
            'migration:generate',
            '-d',
            dataSource,
            '--pretty',
            target,
        ],
        { stdio: 'inherit' },
    );
} catch (error) {
    console.error(`failed to run the TypeORM CLI: ${error.message}`);
    process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
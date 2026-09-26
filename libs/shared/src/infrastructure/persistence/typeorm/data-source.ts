import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';
import { databaseEnvSchema } from '@shared/shared/infrastructure/config/env-schema';

export function createDataSourceOptions(): DataSourceOptions {
    const result = databaseEnvSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`Database environment validation failed: ${details}`);
    }

    return {
        type: 'postgres',
        host: result.data.DB_HOST,
        port: result.data.DB_PORT,
        username: result.data.DB_USER,
        password: result.data.DB_PASSWORD,
        database: result.data.DB_NAME,
        synchronize: false,
        entities: [UserEntity],
        migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
    };
}

export function createDataSource(): DataSource {
    return new DataSource(createDataSourceOptions());
}

export default createDataSource();

import { registerAs } from '@nestjs/config';
import {
    appEnvSchema,
    databaseEnvSchema,
    rabbitmqEnvSchema,
} from './env-schema';

export interface AppConfig {
    port: number;
    corsOrigin: string;
}

export interface RabbitMQConfig {
    url: string;
    exchange: {
        name: string;
        type: string;
    };
}

export interface DatabaseConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
    migrationsRun: boolean;
}

export const appConfig = registerAs('app', (): AppConfig => {
    const result = appEnvSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`App environment validation failed: ${details}`);
    }
    return {
        port: result.data.APP_PORT ?? 3000,
        corsOrigin: result.data.APP_CORS_ORIGIN,
    };
});

export const rabbitmqConfig = registerAs('rabbitmq', (): RabbitMQConfig => {
    const result = rabbitmqEnvSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`RabbitMQ environment validation failed: ${details}`);
    }
    return {
        url: result.data.RABBITMQ_URL,
        exchange: {
            name: result.data.RABBITMQ_EXCHANGE_NAME,
            type: result.data.RABBITMQ_EXCHANGE_TYPE,
        },
    };
});

export const databaseConfig = registerAs('db', (): DatabaseConfig => {
    const result = databaseEnvSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`Database environment validation failed: ${details}`);
    }

    return {
        host: result.data.DB_HOST,
        port: result.data.DB_PORT,
        username: result.data.DB_USER,
        password: result.data.DB_PASSWORD,
        name: result.data.DB_NAME,
        migrationsRun: result.data.DB_MIGRATIONS_RUN,
    };
});

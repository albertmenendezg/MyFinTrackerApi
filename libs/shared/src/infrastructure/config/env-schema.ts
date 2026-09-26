import { z } from 'zod';

export const appEnvSchema = z.object({
    APP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
});

export const rabbitmqEnvSchema = z.object({
    RABBITMQ_URL: z
        .string()
        .min(1, 'RABBITMQ_URL is required and cannot be empty'),
    RABBITMQ_EXCHANGE_NAME: z
        .string()
        .min(1, 'RABBITMQ_EXCHANGE_NAME is required and cannot be empty'),
    RABBITMQ_EXCHANGE_TYPE: z
        .string()
        .min(1, 'RABBITMQ_EXCHANGE_TYPE is required and cannot be empty'),
});

export const databaseEnvSchema = z.object({
    DB_HOST: z.string().min(1).default('localhost'),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
    DB_USER: z.string().min(1, 'DB_USER is required and cannot be empty'),
    DB_PASSWORD: z
        .string()
        .min(1, 'DB_PASSWORD is required and cannot be empty'),
    DB_NAME: z.string().min(1, 'DB_NAME is required and cannot be empty'),
    DB_MIGRATIONS_RUN: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
});

import {
    appEnvSchema,
    databaseEnvSchema,
    rabbitmqEnvSchema,
} from './env-schema';

export const envSchema = appEnvSchema
    .extend(rabbitmqEnvSchema.shape)
    .extend(databaseEnvSchema.shape);

export function validateEnv(
    config: Record<string, unknown>,
): Record<string, unknown> {
    const result = envSchema.safeParse(config);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`Environment validation failed: ${details}`);
    }
    return config;
}

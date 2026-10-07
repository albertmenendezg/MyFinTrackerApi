import { z } from 'zod';

const DURATION_UNITS_IN_SECONDS: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
};

const DURATION_PATTERN = /^(\d+)([smhd])?$/;

const durationInSeconds = (defaultValue: string) =>
    z
        .string()
        .default(defaultValue)
        .transform((value, ctx) => {
            const match = DURATION_PATTERN.exec(value.trim());
            if (!match) {
                ctx.addIssue({
                    code: 'custom',
                    message: `must be a duration in seconds, minutes, hours or days, for example "30s", "15m", "12h" or "7d" (received "${value}")`,
                });
                return z.NEVER;
            }
            const [, amount, unit = 's'] = match;
            return Number(amount) * DURATION_UNITS_IN_SECONDS[unit];
        });

export const authEnvSchema = z.object({
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31).default(10),
    JWT_SECRET: z
        .string()
        .min(
            32,
            'JWT_SECRET is required and must be at least 32 characters long',
        ),
    JWT_EXPIRES_IN: durationInSeconds('15m'),
    JWT_REFRESH_SECRET: z
        .string()
        .min(
            32,
            'JWT_REFRESH_SECRET must be at least 32 characters long when provided',
        )
        .optional(),
    JWT_REFRESH_EXPIRES_IN: durationInSeconds('7d'),
    JWT_COOKIE_NAME: z.string().min(1).default('access_token'),
    JWT_REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
});

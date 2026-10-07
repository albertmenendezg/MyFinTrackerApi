import { registerAs } from '@nestjs/config';
import { authEnvSchema } from './env-schema';

export interface AuthConfig {
    bcrypt: {
        rounds: number;
    };
    jwt: {
        secret: string;
        expiresIn: number;
        refreshSecret: string;
        refreshExpiresIn: number;
    };
    cookies: {
        access: {
            name: string;
        };
        refresh: {
            name: string;
        };
    };
}

export default registerAs('auth', (): AuthConfig => {
    const result = authEnvSchema.safeParse(process.env);
    if (!result.success) {
        const details = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; ');
        throw new Error(`Auth environment validation failed: ${details}`);
    }

    return {
        bcrypt: {
            rounds: result.data.BCRYPT_ROUNDS,
        },
        jwt: {
            secret: result.data.JWT_SECRET,
            expiresIn: result.data.JWT_EXPIRES_IN,
            refreshSecret:
                result.data.JWT_REFRESH_SECRET ?? result.data.JWT_SECRET,
            refreshExpiresIn: result.data.JWT_REFRESH_EXPIRES_IN,
        },
        cookies: {
            access: {
                name: result.data.JWT_COOKIE_NAME,
            },
            refresh: {
                name: result.data.JWT_REFRESH_COOKIE_NAME,
            },
        },
    };
});

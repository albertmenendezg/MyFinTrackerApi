import { registerAs } from '@nestjs/config';
import { authEnvSchema } from './env-schema';

export interface AuthConfig {
    bcrypt: {
        rounds: number;
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
    };
});

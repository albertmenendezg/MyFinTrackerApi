import { z } from 'zod';

export const authEnvSchema = z.object({
    BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(31).default(10),
});

import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { BcryptPasswordHasher } from '@auth/infrastructure/password-hasher/bcrypt-password-hasher';

function createHasher(rounds = 4): BcryptPasswordHasher {
    const config = {
        getOrThrow: (namespace: string) =>
            namespace === 'auth.bcrypt.rounds'
                ? rounds
                : (() => {
                      throw new Error(`Unexpected key ${namespace}`);
                  })(),
    } as unknown as ConfigService;
    return new BcryptPasswordHasher(config);
}

describe('BcryptPasswordHasher', () => {
    it('hashes and verifies a plain password', async () => {
        const hasher = createHasher();
        const hash = await hasher.hash('S3cur3Pass!');

        expect(hash).not.toBe('S3cur3Pass!');
        await expect(hasher.verify('S3cur3Pass!', hash)).resolves.toBe(true);
        await expect(hasher.verify('wrong-password', hash)).resolves.toBe(
            false,
        );
    });
});

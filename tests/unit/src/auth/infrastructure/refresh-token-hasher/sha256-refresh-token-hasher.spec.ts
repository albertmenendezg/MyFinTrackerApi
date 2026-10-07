import { describe, expect, it } from 'vitest';
import { Sha256RefreshTokenHasher } from '@auth/infrastructure/refresh-token-hasher/sha256-refresh-token-hasher';

describe('Sha256RefreshTokenHasher', () => {
    const hasher = new Sha256RefreshTokenHasher();

    it('produces a 64 character hex digest', () => {
        const hash = hasher.hash('some-refresh-token');

        expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic so a token can be looked up by its hash', () => {
        expect(hasher.hash('some-refresh-token')).toBe(
            hasher.hash('some-refresh-token'),
        );
    });

    it('differs for different tokens', () => {
        expect(hasher.hash('token-a')).not.toBe(hasher.hash('token-b'));
    });

    it('matches the digest of node crypto', async () => {
        const { createHash } = await import('node:crypto');

        expect(hasher.hash('some-refresh-token')).toBe(
            createHash('sha256').update('some-refresh-token').digest('hex'),
        );
    });
});

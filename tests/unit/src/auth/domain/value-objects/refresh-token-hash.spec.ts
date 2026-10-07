import { describe, expect, it } from 'vitest';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { InvalidRefreshTokenHash } from '@auth/domain/exceptions/invalid-refresh-token-hash';

const VALID_HASH = 'a'.repeat(64);

describe('RefreshTokenHash', () => {
    it('accepts a 64 character lowercase hex digest', () => {
        const hash = new RefreshTokenHash(VALID_HASH);

        expect(hash.value).toBe(VALID_HASH);
        expect(hash.toString()).toBe(VALID_HASH);
    });

    it('rejects an empty value', () => {
        expect(() => new RefreshTokenHash('')).toThrow(InvalidRefreshTokenHash);
    });

    it('rejects a digest that is not hexadecimal', () => {
        expect(() => new RefreshTokenHash('z'.repeat(64))).toThrow(
            InvalidRefreshTokenHash,
        );
    });

    it('rejects a digest with the wrong length', () => {
        expect(() => new RefreshTokenHash('a'.repeat(63))).toThrow(
            InvalidRefreshTokenHash,
        );
    });
});

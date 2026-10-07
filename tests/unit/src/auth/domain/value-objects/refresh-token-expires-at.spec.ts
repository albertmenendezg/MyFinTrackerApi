import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';

const NOW = '2026-01-01T10:00:00.000Z';

describe('RefreshTokenExpiresAt', () => {
    beforeEach(() => {
        vi.setSystemTime(new Date(NOW));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('derives the expiration from a ttl expressed in seconds', () => {
        const expiresAt = RefreshTokenExpiresAt.inSeconds(3600);

        expect(expiresAt).toBeInstanceOf(RefreshTokenExpiresAt);
        expect(expiresAt.toString()).toBe('2026-01-01T11:00:00.000Z');
    });

    it('accepts a zero ttl', () => {
        expect(RefreshTokenExpiresAt.inSeconds(0).toString()).toBe(NOW);
    });
});

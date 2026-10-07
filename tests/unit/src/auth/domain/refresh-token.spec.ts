import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshToken } from '@auth/domain/refresh-token';
import { UserId } from '@auth/domain/value-objects/user-id';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenRevokedAt } from '@auth/domain/value-objects/refresh-token-revoked-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { RefreshTokenCreatedEvent } from '@auth/domain/events/refresh-token-created.event';
import { RefreshTokenRevokedEvent } from '@auth/domain/events/refresh-token-revoked.event';

const HASH = 'b'.repeat(64);
const ISSUED_ON = '2026-01-01T10:00:00.000Z';

function createRefreshToken(ttlInSeconds: number): RefreshToken {
    return RefreshToken.create(
        RefreshTokenId.random(),
        UserId.random(),
        new RefreshTokenHash(HASH),
        ttlInSeconds,
    );
}

function reconstitute(revokedAt: Date | null, expiresAt: Date): RefreshToken {
    return new RefreshToken(
        RefreshTokenId.random(),
        UserId.random(),
        new RefreshTokenHash(HASH),
        new RefreshTokenExpiresAt(expiresAt),
        revokedAt ? new RefreshTokenRevokedAt(revokedAt) : null,
        new RefreshTokenCreatedAt(new Date(ISSUED_ON)),
    );
}

describe('RefreshToken', () => {
    beforeEach(() => {
        vi.setSystemTime(new Date(ISSUED_ON));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('derives the expiration from the ttl', () => {
        const refreshToken = createRefreshToken(3600);

        expect(refreshToken.expiresAt.toString()).toBe(
            '2026-01-01T11:00:00.000Z',
        );
        expect(refreshToken.createdAt.toString()).toBe(ISSUED_ON);
        expect(refreshToken.revokedAt).toBeNull();
        expect(refreshToken.userId).toBeInstanceOf(UserId);
        expect(refreshToken.id).toBeInstanceOf(RefreshTokenId);
        expect(refreshToken.tokenHash.toString()).toBe(HASH);
    });

    it('is active while it is neither expired nor revoked', () => {
        const refreshToken = createRefreshToken(3600);

        expect(refreshToken.isExpired()).toBe(false);
        expect(refreshToken.isRevoked()).toBe(false);
        expect(refreshToken.isActive()).toBe(true);
    });

    it('is expired once the ttl has elapsed', () => {
        const refreshToken = createRefreshToken(60);

        vi.setSystemTime(new Date('2026-01-01T10:01:00.000Z'));

        expect(refreshToken.isExpired()).toBe(true);
        expect(refreshToken.isActive()).toBe(false);
    });

    it('is expired exactly at the expiration instant', () => {
        const refreshToken = createRefreshToken(60);

        vi.setSystemTime(new Date('2026-01-01T10:01:00.000Z'));

        expect(refreshToken.isExpired()).toBe(true);
    });

    it('becomes revoked once revoked', () => {
        const refreshToken = createRefreshToken(3600);

        refreshToken.revoke();

        expect(refreshToken.isRevoked()).toBe(true);
        expect(refreshToken.revokedAt?.toString()).toBe(ISSUED_ON);
        expect(refreshToken.isActive()).toBe(false);
    });

    it('stays active when it expires in the future and was not revoked', () => {
        const refreshToken = reconstitute(
            null,
            new Date('2027-01-01T00:00:00.000Z'),
        );

        expect(refreshToken.isActive()).toBe(true);
    });

    it('exposes its state as primitives', () => {
        const refreshToken = createRefreshToken(3600);
        refreshToken.revoke();

        const primitives = Object.fromEntries(refreshToken.toPrimitives());

        expect(primitives).toEqual({
            id: refreshToken.id.toString(),
            userId: refreshToken.userId.toString(),
            tokenHash: HASH,
            expiresAt: '2026-01-01T11:00:00.000Z',
            revokedAt: ISSUED_ON,
            createdAt: ISSUED_ON,
        });
    });

    it('exposes a null revokedAt as a primitive before being revoked', () => {
        const refreshToken = createRefreshToken(3600);

        expect(refreshToken.toPrimitives().get('revokedAt')).toBeNull();
    });

    it('records a created event on creation', () => {
        const refreshToken = createRefreshToken(3600);
        const events = refreshToken.pullDomainEvents();

        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(RefreshTokenCreatedEvent);
        expect(events[0].eventName()).toBe('refresh_token.created');
        expect(events[0].aggregateId).toBe(refreshToken.id.toString());
        expect(events[0].body).toEqual(refreshToken.toPrimitives());
    });

    it('records a revoked event on revocation', () => {
        const refreshToken = reconstitute(
            null,
            new Date('2027-01-01T00:00:00.000Z'),
        );

        refreshToken.revoke();

        const events = refreshToken.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(RefreshTokenRevokedEvent);
        expect(events[0].eventName()).toBe('refresh_token.revoked');
        expect(events[0].aggregateId).toBe(refreshToken.id.toString());
    });

    it('records no event when reconstituted from the database', () => {
        const refreshToken = reconstitute(
            null,
            new Date('2027-01-01T00:00:00.000Z'),
        );

        expect(refreshToken.pullDomainEvents()).toHaveLength(0);
    });
});

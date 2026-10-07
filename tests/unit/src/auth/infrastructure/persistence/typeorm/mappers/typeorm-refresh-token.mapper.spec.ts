import { describe, expect, it } from 'vitest';
import { TypeormRefreshTokenMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-refresh-token.mapper';
import { UserId } from '@users/domain/value-objects/user-id';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenRevokedAt } from '@auth/domain/value-objects/refresh-token-revoked-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';
import { RefreshTokenEntity } from '@auth/infrastructure/persistence/typeorm/entities/refresh-token.entity';

const HASH = 'f'.repeat(64);
const USER_ID = '1f0a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8';

describe('TypeormRefreshTokenMapper', () => {
    const mapper = new TypeormRefreshTokenMapper();

    const refreshToken = new RefreshToken(
        new RefreshTokenId('2a3b4c5d-6e7f-4081-9203-a4b5c6d7e8f9'),
        new UserId(USER_ID),
        new RefreshTokenHash(HASH),
        new RefreshTokenExpiresAt(new Date('2027-01-01T00:00:00.000Z')),
        new RefreshTokenRevokedAt(new Date('2026-06-01T12:00:00.000Z')),
        new RefreshTokenCreatedAt(new Date('2026-01-01T10:00:00.000Z')),
    );

    it('maps the aggregate to a fresh entity', () => {
        const entity = mapper.toEntity(refreshToken);

        expect(entity).toBeInstanceOf(RefreshTokenEntity);
        expect(entity.id).toBe('2a3b4c5d-6e7f-4081-9203-a4b5c6d7e8f9');
        expect(entity.user).toEqual({ id: USER_ID });
        expect(entity.tokenHash).toBe(HASH);
        expect(entity.expiresAt).toEqual(new Date('2027-01-01T00:00:00.000Z'));
        expect(entity.revokedAt).toEqual(new Date('2026-06-01T12:00:00.000Z'));
        expect(entity.createdAt).toEqual(new Date('2026-01-01T10:00:00.000Z'));
    });

    it('maps a non revoked token to a null column', () => {
        const entity = mapper.toEntity(
            new RefreshToken(
                refreshToken.id,
                refreshToken.userId,
                refreshToken.tokenHash,
                refreshToken.expiresAt,
                null,
                refreshToken.createdAt,
            ),
        );

        expect(entity.revokedAt).toBeNull();
    });

    it('rehydrates the aggregate from the entity', () => {
        const entity = new RefreshTokenEntity();
        entity.id = '2a3b4c5d-6e7f-4081-9203-a4b5c6d7e8f9';
        entity.user = { id: USER_ID } as UserEntity;
        entity.tokenHash = HASH;
        entity.expiresAt = new Date('2027-01-01T00:00:00.000Z');
        entity.revokedAt = new Date('2026-06-01T12:00:00.000Z');
        entity.createdAt = new Date('2026-01-01T10:00:00.000Z');

        const domain = mapper.toDomain(entity);

        expect(domain).toBeInstanceOf(RefreshToken);
        expect(domain.id.toString()).toBe(
            '2a3b4c5d-6e7f-4081-9203-a4b5c6d7e8f9',
        );
        expect(domain.userId.toString()).toBe(USER_ID);
        expect(domain.tokenHash.toString()).toBe(HASH);
        expect(domain.expiresAt.toString()).toBe('2027-01-01T00:00:00.000Z');
        expect(domain.revokedAt?.toString()).toBe('2026-06-01T12:00:00.000Z');
        expect(domain.createdAt.toString()).toBe('2026-01-01T10:00:00.000Z');
    });

    it('round trips through entity and back', () => {
        const domain = mapper.toDomain(mapper.toEntity(refreshToken));

        expect(domain.toPrimitives()).toEqual(refreshToken.toPrimitives());
    });
});

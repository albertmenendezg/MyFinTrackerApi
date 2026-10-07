import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@auth/domain/refresh-token';
import { UserId } from '@auth/domain/value-objects/user-id';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenRevokedAt } from '@auth/domain/value-objects/refresh-token-revoked-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';
import { RefreshTokenEntity } from '@auth/infrastructure/persistence/typeorm/entities/refresh-token.entity';

@Injectable()
export class TypeormRefreshTokenMapper {
    toEntity(refreshToken: RefreshToken): RefreshTokenEntity {
        const entity = new RefreshTokenEntity();
        entity.id = refreshToken.id.value;
        entity.user = { id: refreshToken.userId.value } as UserEntity;
        entity.tokenHash = refreshToken.tokenHash.value;
        entity.expiresAt = refreshToken.expiresAt.value;
        entity.revokedAt = refreshToken.revokedAt
            ? refreshToken.revokedAt.value
            : null;
        entity.createdAt = refreshToken.createdAt.value;
        return entity;
    }

    toDomain(entity: RefreshTokenEntity): RefreshToken {
        return new RefreshToken(
            new RefreshTokenId(entity.id),
            new UserId(entity.user.id),
            new RefreshTokenHash(entity.tokenHash),
            new RefreshTokenExpiresAt(entity.expiresAt),
            entity.revokedAt
                ? new RefreshTokenRevokedAt(entity.revokedAt)
                : null,
            new RefreshTokenCreatedAt(entity.createdAt),
        );
    }
}

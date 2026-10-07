import { AggregateRoot } from '@shared/domain/aggregate-root';
import { UserId } from '@auth/domain/value-objects/user-id';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenRevokedAt } from '@auth/domain/value-objects/refresh-token-revoked-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { RefreshTokenCreatedEvent } from '@auth/domain/events/refresh-token-created.event';
import { RefreshTokenRevokedEvent } from '@auth/domain/events/refresh-token-revoked.event';

export class RefreshToken extends AggregateRoot {
    private readonly _id: RefreshTokenId;
    private readonly _userId: UserId;
    private readonly _tokenHash: RefreshTokenHash;
    private readonly _expiresAt: RefreshTokenExpiresAt;
    private readonly _createdAt: RefreshTokenCreatedAt;
    private _revokedAt: RefreshTokenRevokedAt | null;

    constructor(
        id: RefreshTokenId,
        userId: UserId,
        tokenHash: RefreshTokenHash,
        expiresAt: RefreshTokenExpiresAt,
        revokedAt: RefreshTokenRevokedAt | null,
        createdAt: RefreshTokenCreatedAt,
    ) {
        super();
        this._id = id;
        this._userId = userId;
        this._tokenHash = tokenHash;
        this._expiresAt = expiresAt;
        this._revokedAt = revokedAt;
        this._createdAt = createdAt;
    }

    toPrimitives(): Map<string, any> {
        return new Map<string, any>([
            ['id', this.id.toString()],
            ['userId', this.userId.toString()],
            ['tokenHash', this.tokenHash.toString()],
            ['expiresAt', this.expiresAt.toString()],
            ['revokedAt', this.revokedAt ? this.revokedAt.toString() : null],
            ['createdAt', this.createdAt.toString()],
        ]);
    }

    public static create(
        id: RefreshTokenId,
        userId: UserId,
        tokenHash: RefreshTokenHash,
        ttlInSeconds: number,
    ): RefreshToken {
        const refreshToken = new RefreshToken(
            id,
            userId,
            tokenHash,
            RefreshTokenExpiresAt.inSeconds(ttlInSeconds),
            null,
            RefreshTokenCreatedAt.now(),
        );

        refreshToken.record(
            new RefreshTokenCreatedEvent(
                id.toString(),
                refreshToken.toPrimitives(),
            ),
        );

        return refreshToken;
    }

    public isExpired(): boolean {
        return this._expiresAt.value.getTime() <= Date.now();
    }

    public isRevoked(): boolean {
        return this._revokedAt !== null;
    }

    public isActive(): boolean {
        return !this.isRevoked() && !this.isExpired();
    }

    public revoke(): void {
        this._revokedAt = RefreshTokenRevokedAt.now();

        this.record(
            new RefreshTokenRevokedEvent(
                this._id.toString(),
                this.toPrimitives(),
            ),
        );
    }

    get id(): RefreshTokenId {
        return this._id;
    }

    get userId(): UserId {
        return this._userId;
    }

    get tokenHash(): RefreshTokenHash {
        return this._tokenHash;
    }

    get expiresAt(): RefreshTokenExpiresAt {
        return this._expiresAt;
    }

    get revokedAt(): RefreshTokenRevokedAt | null {
        return this._revokedAt;
    }

    get createdAt(): RefreshTokenCreatedAt {
        return this._createdAt;
    }
}

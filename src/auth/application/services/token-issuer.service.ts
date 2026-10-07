import { Inject, Injectable } from '@nestjs/common';
import { User } from '@auth/domain/user';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import {
    TOKEN_SERVICE,
    TokenService,
} from '@auth/domain/services/token.service';
import {
    REFRESH_TOKEN_HASHER_SERVICE,
    RefreshTokenHasherService,
} from '@auth/domain/services/refresh-token-hasher.service';
import {
    REFRESH_TOKEN_REPOSITORY,
    RefreshTokenRepository,
} from '@auth/domain/repository/refresh-token.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';

@Injectable()
export class TokenIssuerService {
    constructor(
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenService,
        @Inject(REFRESH_TOKEN_HASHER_SERVICE)
        private readonly refreshTokenHasher: RefreshTokenHasherService,
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: RefreshTokenRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async issue(user: User): Promise<IssuedTokens> {
        const accessTokenData = await this.tokenService.signAccessToken(user);
        const refreshTokenData = await this.tokenService.signRefreshToken(user);

        const refreshToken = RefreshToken.create(
            RefreshTokenId.random(),
            user.id,
            this.hashToken(refreshTokenData.token),
            refreshTokenData.expiresIn,
        );

        await this.refreshTokenRepository.save(refreshToken);
        await this.domainEventPublisher.publish(
            refreshToken.pullDomainEvents(),
        );

        return new IssuedTokens(accessTokenData, refreshTokenData);
    }

    hashToken(token: string): RefreshTokenHash {
        return new RefreshTokenHash(this.refreshTokenHasher.hash(token));
    }
}

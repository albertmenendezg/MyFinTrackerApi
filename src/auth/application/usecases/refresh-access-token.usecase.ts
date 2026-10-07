import { Inject, Injectable } from '@nestjs/common';
import { RefreshAccessTokenRequest } from '@auth/application/dto/refresh-access-token.request';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';
import { InvalidRefreshToken } from '@auth/application/exceptions/invalid-refresh-token';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import {
    AUTH_CREDENTIAL_REPOSITORY,
    AuthCredentialRepository,
} from '@auth/domain/repository/auth-credential.repository';
import {
    TOKEN_SERVICE,
    TokenService,
} from '@auth/domain/services/token.service';
import {
    REFRESH_TOKEN_REPOSITORY,
    RefreshTokenRepository,
} from '@auth/domain/repository/refresh-token.repository';
import { UserId } from '@users/domain/value-objects/user-id';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class RefreshAccessTokenUseCase {
    constructor(
        @Inject(TOKEN_SERVICE)
        private readonly tokenService: TokenService,
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: RefreshTokenRepository,
        @Inject(AUTH_CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: AuthCredentialRepository,
        private readonly tokenIssuer: TokenIssuerService,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: RefreshAccessTokenRequest): Promise<IssuedTokens> {
        const { refreshToken } = request;

        const payload = this.tokenService.verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new InvalidRefreshToken();
        }

        const { sub } = payload;

        const stored = await this.refreshTokenRepository.findByTokenHash(
            this.tokenIssuer.hashToken(refreshToken),
        );

        if (!stored || !stored.isActive()) {
            throw new InvalidRefreshToken();
        }

        stored.revoke();
        await this.refreshTokenRepository.save(stored);
        await this.domainEventPublisher.publish(stored.pullDomainEvents());

        const credential = await this.credentialRepository.findByUserId(
            new UserId(sub),
        );

        if (!credential) {
            throw new InvalidRefreshToken();
        }

        return this.tokenIssuer.issue(credential);
    }
}

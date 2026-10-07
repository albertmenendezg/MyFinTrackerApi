import { Inject, Injectable } from '@nestjs/common';
import { LogoutRequest } from '@auth/application/dto/logout.request';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import {
    REFRESH_TOKEN_REPOSITORY,
    RefreshTokenRepository,
} from '@auth/domain/repository/refresh-token.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class LogoutUseCase {
    constructor(
        @Inject(REFRESH_TOKEN_REPOSITORY)
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly tokenIssuer: TokenIssuerService,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: LogoutRequest): Promise<void> {
        const { refreshToken } = request;

        const stored = await this.refreshTokenRepository.findByTokenHash(
            this.tokenIssuer.hashToken(refreshToken),
        );

        if (!stored || !stored.isActive()) {
            return;
        }

        stored.revoke();
        await this.refreshTokenRepository.save(stored);
        await this.domainEventPublisher.publish(stored.pullDomainEvents());
    }
}

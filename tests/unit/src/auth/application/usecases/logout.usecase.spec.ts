import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutUseCase } from '@auth/application/usecases/logout.usecase';
import { LogoutRequest } from '@auth/application/dto/logout.request';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { UserId } from '@auth/domain/value-objects/user-id';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { RefreshTokenRepository } from '@auth/domain/repository/refresh-token.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { DomainEvent } from '@shared/domain/events/domain-event';

const HASH = 'e'.repeat(64);

describe('LogoutUseCase', () => {
    function activeToken(): RefreshToken {
        return new RefreshToken(
            RefreshTokenId.random(),
            UserId.random(),
            new RefreshTokenHash(HASH),
            new RefreshTokenExpiresAt(new Date('2999-01-01T00:00:00.000Z')),
            null,
            new RefreshTokenCreatedAt(new Date('2026-01-01T10:00:00.000Z')),
        );
    }

    const refreshTokenRepository = {
        save: vi.fn(),
        findByTokenHash: vi.fn(),
    } as unknown as RefreshTokenRepository;

    const tokenIssuer = {
        issue: vi.fn(),
        hashToken: vi.fn(),
    } as unknown as TokenIssuerService;

    const publisher = {
        publish: vi.fn(),
    } as unknown as DomainEventPublisher;

    const useCase = new LogoutUseCase(
        refreshTokenRepository,
        tokenIssuer,
        publisher,
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (tokenIssuer.hashToken as ReturnType<typeof vi.fn>).mockReturnValue(
            new RefreshTokenHash(HASH),
        );
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(activeToken());
        (
            refreshTokenRepository.save as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('revokes the presented refresh token', async () => {
        const stored = activeToken();
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(stored);

        await useCase.execute(new LogoutRequest('presented-refresh-token'));

        expect(tokenIssuer.hashToken).toHaveBeenCalledWith(
            'presented-refresh-token',
        );
        expect(stored.isRevoked()).toBe(true);
        expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
    });

    it('publishes the revoked event', async () => {
        await useCase.execute(new LogoutRequest('presented-refresh-token'));

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        const events = (publisher.publish as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as DomainEvent[];
        expect(events).toHaveLength(1);
        expect(events[0].eventName()).toBe('refresh_token.revoked');
    });

    it('is idempotent when the token is not stored', async () => {
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
            useCase.execute(new LogoutRequest('unknown-token')),
        ).resolves.toBeUndefined();

        expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });

    it('is idempotent when the token is already revoked', async () => {
        const revoked = activeToken();
        revoked.revoke();
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(revoked);

        await expect(
            useCase.execute(new LogoutRequest('revoked-token')),
        ).resolves.toBeUndefined();

        expect(refreshTokenRepository.save).not.toHaveBeenCalled();
    });
});

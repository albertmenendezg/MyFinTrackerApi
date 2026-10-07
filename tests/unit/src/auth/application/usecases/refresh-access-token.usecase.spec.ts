import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RefreshAccessTokenUseCase } from '@auth/application/usecases/refresh-access-token.usecase';
import { RefreshAccessTokenRequest } from '@auth/application/dto/refresh-access-token.request';
import { InvalidRefreshToken } from '@auth/application/exceptions/invalid-refresh-token';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRepository } from '@auth/domain/repository/auth-credential.repository';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenId } from '@auth/domain/value-objects/refresh-token-id';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { RefreshTokenExpiresAt } from '@auth/domain/value-objects/refresh-token-expires-at';
import { RefreshTokenCreatedAt } from '@auth/domain/value-objects/refresh-token-created-at';
import { RefreshTokenRepository } from '@auth/domain/repository/refresh-token.repository';
import { TokenService } from '@auth/domain/services/token.service';
import { UserId } from '@users/domain/value-objects/user-id';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { DomainEvent } from '@shared/domain/events/domain-event';

const HASH = 'd'.repeat(64);
const ISSUED_ON = '2026-01-01T10:00:00.000Z';

describe('RefreshAccessTokenUseCase', () => {
    const userId = UserId.random();
    const credential = AuthCredential.create(
        userId,
        new AuthCredentialPassword('hashed-password'),
    );

    function activeToken(): RefreshToken {
        return new RefreshToken(
            RefreshTokenId.random(),
            userId,
            new RefreshTokenHash(HASH),
            new RefreshTokenExpiresAt(new Date('2027-01-01T00:00:00.000Z')),
            null,
            new RefreshTokenCreatedAt(new Date(ISSUED_ON)),
        );
    }

    const tokenService = {
        signAccessToken: vi.fn(),
        signRefreshToken: vi.fn(),
        verifyRefreshToken: vi.fn(),
    } as unknown as TokenService;

    const refreshTokenRepository = {
        save: vi.fn(),
        findByTokenHash: vi.fn(),
    } as unknown as RefreshTokenRepository;

    const credentialRepository = {
        save: vi.fn(),
        findByUserId: vi.fn(),
    } as unknown as AuthCredentialRepository;

    const tokenIssuer = {
        issue: vi.fn(),
        hashToken: vi.fn(),
    } as unknown as TokenIssuerService;

    const publisher = {
        publish: vi.fn(),
    } as unknown as DomainEventPublisher;

    const useCase = new RefreshAccessTokenUseCase(
        tokenService,
        refreshTokenRepository,
        credentialRepository,
        tokenIssuer,
        publisher,
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (
            tokenService.verifyRefreshToken as ReturnType<typeof vi.fn>
        ).mockReturnValue({
            sub: userId.toString(),
            jti: 'jti-1',
            type: 'refresh',
        });
        (tokenIssuer.hashToken as ReturnType<typeof vi.fn>).mockReturnValue(
            new RefreshTokenHash(HASH),
        );
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(activeToken());
        (
            refreshTokenRepository.save as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
        ).mockResolvedValue(credential);
        (tokenIssuer.issue as ReturnType<typeof vi.fn>).mockResolvedValue({
            accessToken: { token: 'new-access-token', expiresIn: 900 },
            refreshToken: { token: 'new-refresh-token', expiresIn: 604800 },
        });
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('rotates the token: revokes the old one and issues a new pair', async () => {
        const tokens = await useCase.execute(
            new RefreshAccessTokenRequest('presented-refresh-token'),
        );

        expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith(
            'presented-refresh-token',
        );
        expect(tokenIssuer.hashToken).toHaveBeenCalledWith(
            'presented-refresh-token',
        );
        expect(credentialRepository.findByUserId).toHaveBeenCalledWith(userId);
        expect(tokenIssuer.issue).toHaveBeenCalledWith(credential);
        expect(tokens).toEqual({
            accessToken: { token: 'new-access-token', expiresIn: 900 },
            refreshToken: { token: 'new-refresh-token', expiresIn: 604800 },
        });
    });

    it('revokes the stored refresh token before issuing new ones', async () => {
        const stored = activeToken();
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(stored);

        await useCase.execute(
            new RefreshAccessTokenRequest('presented-refresh-token'),
        );

        expect(stored.isRevoked()).toBe(true);
        expect(refreshTokenRepository.save).toHaveBeenCalledWith(stored);
    });

    it('publishes the revoked event of the rotated token', async () => {
        await useCase.execute(
            new RefreshAccessTokenRequest('presented-refresh-token'),
        );

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        const events = (publisher.publish as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as DomainEvent[];
        expect(events).toHaveLength(1);
        expect(events[0].eventName()).toBe('refresh_token.revoked');
    });

    it('rejects a token that does not verify', async () => {
        (
            tokenService.verifyRefreshToken as ReturnType<typeof vi.fn>
        ).mockReturnValue(null);

        await expect(
            useCase.execute(new RefreshAccessTokenRequest('bad-token')),
        ).rejects.toBeInstanceOf(InvalidRefreshToken);

        expect(refreshTokenRepository.findByTokenHash).not.toHaveBeenCalled();
        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects a token that is not stored', async () => {
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
            useCase.execute(new RefreshAccessTokenRequest('unknown-token')),
        ).rejects.toBeInstanceOf(InvalidRefreshToken);

        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects an already revoked token without rotating it again', async () => {
        const revoked = activeToken();
        revoked.revoke();
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(revoked);

        await expect(
            useCase.execute(new RefreshAccessTokenRequest('revoked-token')),
        ).rejects.toBeInstanceOf(InvalidRefreshToken);

        expect(refreshTokenRepository.save).not.toHaveBeenCalled();
        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
        const expired = new RefreshToken(
            RefreshTokenId.random(),
            userId,
            new RefreshTokenHash(HASH),
            new RefreshTokenExpiresAt(new Date('2020-01-01T00:00:00.000Z')),
            null,
            new RefreshTokenCreatedAt(new Date(ISSUED_ON)),
        );
        (
            refreshTokenRepository.findByTokenHash as ReturnType<typeof vi.fn>
        ).mockResolvedValue(expired);

        await expect(
            useCase.execute(new RefreshAccessTokenRequest('expired-token')),
        ).rejects.toBeInstanceOf(InvalidRefreshToken);

        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects when the credential behind the token no longer exists', async () => {
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
            useCase.execute(new RefreshAccessTokenRequest('presented-token')),
        ).rejects.toBeInstanceOf(InvalidRefreshToken);

        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });
});

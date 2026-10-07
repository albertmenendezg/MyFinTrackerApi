import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenRepository } from '@auth/domain/repository/refresh-token.repository';
import { TokenService } from '@auth/domain/services/token.service';
import { RefreshTokenHasherService } from '@auth/domain/services/refresh-token-hasher.service';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { DomainEvent } from '@shared/domain/events/domain-event';

const HASH = 'c'.repeat(64);

describe('TokenIssuerService', () => {
    const tokenService = {
        signAccessToken: vi.fn(),
        signRefreshToken: vi.fn(),
        verifyRefreshToken: vi.fn(),
    } as unknown as TokenService;

    const refreshTokenHasher = {
        hash: vi.fn(),
    } as unknown as RefreshTokenHasherService;

    const refreshTokenRepository = {
        save: vi.fn(),
        findByTokenHash: vi.fn(),
    } as unknown as RefreshTokenRepository;

    const publisher = {
        publish: vi.fn(),
    } as unknown as DomainEventPublisher;

    const service = new TokenIssuerService(
        tokenService,
        refreshTokenHasher,
        refreshTokenRepository,
        publisher,
    );

    const user = User.create(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserPassword('S3cur3Pass!'),
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (
            tokenService.signAccessToken as ReturnType<typeof vi.fn>
        ).mockResolvedValue({ token: 'access-token', expiresIn: 900 });
        (
            tokenService.signRefreshToken as ReturnType<typeof vi.fn>
        ).mockResolvedValue({ token: 'refresh-token', expiresIn: 604800 });
        (refreshTokenHasher.hash as ReturnType<typeof vi.fn>).mockReturnValue(
            HASH,
        );
        (
            refreshTokenRepository.save as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('signs both tokens and returns them', async () => {
        const tokens = await service.issue(user);

        expect(tokens).toBeInstanceOf(IssuedTokens);
        expect(tokens.accessToken).toEqual({
            token: 'access-token',
            expiresIn: 900,
        });
        expect(tokens.refreshToken).toEqual({
            token: 'refresh-token',
            expiresIn: 604800,
        });
    });

    it('persists the hashed refresh token with the signed ttl', async () => {
        await service.issue(user);

        expect(refreshTokenHasher.hash).toHaveBeenCalledWith('refresh-token');
        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1);

        const saved = (refreshTokenRepository.save as ReturnType<typeof vi.fn>)
            .mock.calls[0][0] as RefreshToken;
        expect(saved).toBeInstanceOf(RefreshToken);
        expect(saved.tokenHash.toString()).toBe(HASH);
        expect(saved.userId.toString()).toBe(user.id.toString());
        expect(saved.isActive()).toBe(true);
        expect(
            saved.expiresAt.value.getTime() - saved.createdAt.value.getTime(),
        ).toBe(604800 * 1000);
    });

    it('never stores the raw refresh token', async () => {
        await service.issue(user);

        const saved = (refreshTokenRepository.save as ReturnType<typeof vi.fn>)
            .mock.calls[0][0] as RefreshToken;

        expect(JSON.stringify(saved.toPrimitives())).not.toContain(
            'refresh-token',
        );
    });

    it('hashes a presented token into a refresh token hash', () => {
        const hash = service.hashToken('some-refresh-token');

        expect(hash.toString()).toBe(HASH);
        expect(refreshTokenHasher.hash).toHaveBeenCalledWith(
            'some-refresh-token',
        );
    });

    it('publishes the created event after saving', async () => {
        await service.issue(user);

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        const events = (publisher.publish as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as DomainEvent[];
        expect(events).toHaveLength(1);
        expect(events[0].eventName()).toBe('refresh_token.created');
    });

    it('drains the recorded events so they are not published twice', async () => {
        await service.issue(user);

        const saved = (refreshTokenRepository.save as ReturnType<typeof vi.fn>)
            .mock.calls[0][0] as RefreshToken;

        expect(saved.pullDomainEvents()).toHaveLength(0);
    });
});

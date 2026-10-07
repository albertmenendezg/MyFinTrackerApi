import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginUseCase } from '@auth/application/usecases/login.usecase';
import { LoginRequest } from '@auth/application/dto/login.request';
import { InvalidCredentials } from '@auth/application/exceptions/invalid-credentials';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { PasswordHasherService } from '@auth/domain/services/password-hasher.service';

describe('LoginUseCase', () => {
    const userRepository = {
        save: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const passwordHasher = {
        hash: vi.fn(),
        verify: vi.fn(),
    } as unknown as PasswordHasherService;

    const tokenIssuer = {
        issue: vi.fn(),
        hashToken: vi.fn(),
    } as unknown as TokenIssuerService;

    const useCase = new LoginUseCase(
        userRepository,
        passwordHasher,
        tokenIssuer,
    );

    const user = User.create(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserPassword('hashed-password'),
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (
            userRepository.findByEmail as ReturnType<typeof vi.fn>
        ).mockResolvedValue(user);
        (passwordHasher.verify as ReturnType<typeof vi.fn>).mockResolvedValue(
            true,
        );
        (tokenIssuer.issue as ReturnType<typeof vi.fn>).mockResolvedValue({
            accessToken: { token: 'access-token', expiresIn: 900 },
            refreshToken: { token: 'refresh-token', expiresIn: 604800 },
        });
    });

    it('issues tokens for valid credentials', async () => {
        const tokens = await useCase.execute(
            new LoginRequest('john@doe.xyz', 'S3cur3Pass!'),
        );

        expect(userRepository.findByEmail).toHaveBeenCalledWith(
            new UserEmail('john@doe.xyz'),
        );
        expect(passwordHasher.verify).toHaveBeenCalledWith(
            'S3cur3Pass!',
            'hashed-password',
        );
        expect(tokenIssuer.issue).toHaveBeenCalledWith(user);
        expect(tokens).toEqual({
            accessToken: { token: 'access-token', expiresIn: 900 },
            refreshToken: { token: 'refresh-token', expiresIn: 604800 },
        });
    });

    it('rejects an unknown email without verifying the password', async () => {
        (
            userRepository.findByEmail as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await expect(
            useCase.execute(new LoginRequest('john@doe.xyz', 'S3cur3Pass!')),
        ).rejects.toBeInstanceOf(InvalidCredentials);

        expect(passwordHasher.verify).not.toHaveBeenCalled();
        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects a wrong password', async () => {
        (passwordHasher.verify as ReturnType<typeof vi.fn>).mockResolvedValue(
            false,
        );

        await expect(
            useCase.execute(new LoginRequest('john@doe.xyz', 'wrong-password')),
        ).rejects.toBeInstanceOf(InvalidCredentials);

        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('answers with the same message for unknown email and wrong password', async () => {
        (
            userRepository.findByEmail as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);
        const unknownEmail = await useCase
            .execute(new LoginRequest('john@doe.xyz', 'S3cur3Pass!'))
            .catch((error: Error) => error.message);

        (
            userRepository.findByEmail as ReturnType<typeof vi.fn>
        ).mockResolvedValue(user);
        (passwordHasher.verify as ReturnType<typeof vi.fn>).mockResolvedValue(
            false,
        );
        const wrongPassword = await useCase
            .execute(new LoginRequest('john@doe.xyz', 'S3cur3Pass!'))
            .catch((error: Error) => error.message);

        expect(unknownEmail).toBe(wrongPassword);
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginUseCase } from '@auth/application/usecases/login.usecase';
import { LoginRequest } from '@auth/application/dto/login.request';
import { InvalidCredentials } from '@auth/application/exceptions/invalid-credentials';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRepository } from '@auth/domain/repository/auth-credential.repository';
import { PasswordHasherService } from '@auth/domain/services/password-hasher.service';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserRepository } from '@users/domain/repository/user.repository';

describe('LoginUseCase', () => {
    const userRepository = {
        save: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const credentialRepository = {
        save: vi.fn(),
        findByUserId: vi.fn(),
    } as unknown as AuthCredentialRepository;

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
        credentialRepository,
        passwordHasher,
        tokenIssuer,
    );

    const user = User.create(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );
    const credential = AuthCredential.create(
        user.id,
        new AuthCredentialPassword('hashed-password'),
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (
            userRepository.findByEmail as ReturnType<typeof vi.fn>
        ).mockResolvedValue(user);
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
        ).mockResolvedValue(credential);
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
        expect(credentialRepository.findByUserId).toHaveBeenCalledWith(user.id);
        expect(passwordHasher.verify).toHaveBeenCalledWith(
            'S3cur3Pass!',
            'hashed-password',
        );
        expect(tokenIssuer.issue).toHaveBeenCalledWith(credential);
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

        expect(credentialRepository.findByUserId).not.toHaveBeenCalled();
        expect(passwordHasher.verify).not.toHaveBeenCalled();
        expect(tokenIssuer.issue).not.toHaveBeenCalled();
    });

    it('rejects when the user has no credentials', async () => {
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
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

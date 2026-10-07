import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterUseCase } from '@auth/application/usecases/register.usecase';
import { RegisterRequest } from '@auth/application/dto/register.request';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialRepository } from '@auth/domain/repository/auth-credential.repository';
import { PasswordHasherService } from '@auth/domain/services/password-hasher.service';
import { CreateUserRequest } from '@users/application/dto/create-user.request';
import { CreateUserUseCase } from '@users/application/usecases/create-user.usecase';
import { UserWithEmailAlreadyExists } from '@users/application/exceptions/user-with-email-already-exists';
import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';

describe('RegisterUseCase', () => {
    const createUserUseCase = {
        execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as CreateUserUseCase;

    const credentialRepository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByUserId: vi.fn(),
    } as unknown as AuthCredentialRepository;

    const passwordHasher = {
        hash: vi.fn().mockResolvedValue('hashed-password'),
        verify: vi.fn(),
    } as unknown as PasswordHasherService;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new RegisterUseCase(
        passwordHasher,
        createUserUseCase,
        credentialRepository,
        publisher,
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (
            createUserUseCase.execute as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (passwordHasher.hash as ReturnType<typeof vi.fn>).mockResolvedValue(
            'hashed-password',
        );
        (
            credentialRepository.save as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('creates the user profile first and then its credentials', async () => {
        await useCase.execute(
            new RegisterRequest(
                'john@doe.xyz',
                'S3cur3Pass!',
                'John Doe',
                'EUR',
            ),
        );

        expect(createUserUseCase.execute).toHaveBeenCalledTimes(1);
        const profileRequest = (
            createUserUseCase.execute as ReturnType<typeof vi.fn>
        ).mock.calls[0][0] as CreateUserRequest;
        expect(profileRequest.email).toBe('john@doe.xyz');
        expect(profileRequest.name).toBe('John Doe');
        expect(profileRequest.preferredCurrency).toBe('EUR');

        expect(passwordHasher.hash).toHaveBeenCalledWith('S3cur3Pass!');

        expect(credentialRepository.save).toHaveBeenCalledTimes(1);
        const saved = (credentialRepository.save as ReturnType<typeof vi.fn>)
            .mock.calls[0][0] as AuthCredential;
        expect(saved).toBeInstanceOf(AuthCredential);
        expect(saved.userId.toString()).toBe(profileRequest.id);
        expect(saved.password.value).toBe('hashed-password');

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        expect(
            (publisher.publish as ReturnType<typeof vi.fn>).mock.calls[0][0],
        ).toHaveLength(1);
    });

    it('forwards optional avatar and address to the user creation', async () => {
        await useCase.execute(
            new RegisterRequest(
                'jane@doe.xyz',
                'S3cur3Pass!',
                'Jane Doe',
                'USD',
                'https://example.com/jane.png',
                {
                    street: 'Calle Mayor 1',
                    city: 'Madrid',
                    postalCode: '28001',
                    country: 'ES',
                },
            ),
        );

        expect(createUserUseCase.execute).toHaveBeenCalledTimes(1);
        const profileRequest = (
            createUserUseCase.execute as ReturnType<typeof vi.fn>
        ).mock.calls[0][0] as CreateUserRequest;
        expect(profileRequest.avatar).toBe('https://example.com/jane.png');
        expect(profileRequest.address).toEqual({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        });
        expect(credentialRepository.save).toHaveBeenCalledTimes(1);
    });

    it('propagates a duplicate email without saving credentials', async () => {
        (
            createUserUseCase.execute as ReturnType<typeof vi.fn>
        ).mockRejectedValue(new UserWithEmailAlreadyExists('john@doe.xyz'));

        await expect(
            useCase.execute(
                new RegisterRequest(
                    'john@doe.xyz',
                    'S3cur3Pass!',
                    'John Doe',
                    'EUR',
                ),
            ),
        ).rejects.toBeInstanceOf(UserWithEmailAlreadyExists);

        expect(credentialRepository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('rejects a weak password before creating anything', async () => {
        await expect(
            useCase.execute(
                new RegisterRequest('john@doe.xyz', '1234', 'John Doe', 'EUR'),
            ),
        ).rejects.toBeInstanceOf(InvalidPassword);

        expect(createUserUseCase.execute).not.toHaveBeenCalled();
        expect(passwordHasher.hash).not.toHaveBeenCalled();
        expect(credentialRepository.save).not.toHaveBeenCalled();
    });
});

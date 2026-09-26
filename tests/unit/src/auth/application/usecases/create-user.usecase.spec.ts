import { describe, expect, it, vi } from 'vitest';
import { CreateUserUseCase } from '@auth/application/usecases/create-user.usecase';
import { CreateUserRequest } from '@auth/application/dto/create-user.request';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { PasswordHasherService } from '@auth/domain/services/password-hasher.service';
import { DomainEventPublisher } from '@shared/shared/domain/events/domain-event-publisher';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserWithEmailAlreadyExists } from '@auth/application/exceptions/user-with-email-already-exists';
import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';

describe('CreateUserUseCase', () => {
    const repository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByEmail: vi.fn(),
    } as unknown as UserRepository;

    const passwordHasher = {
        hash: vi.fn().mockResolvedValue('hashed-password'),
        verify: vi.fn(),
    } as unknown as PasswordHasherService;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new CreateUserUseCase(
        passwordHasher,
        repository,
        publisher,
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );
        (passwordHasher.hash as ReturnType<typeof vi.fn>).mockResolvedValue(
            'hashed-password',
        );
        (repository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('saves a new user and publishes the domain events', async () => {
        const request = new CreateUserRequest('john@doe.xyz', 'S3cur3Pass!');

        await useCase.execute(request);

        expect(repository.findByEmail).toHaveBeenCalledWith('john@doe.xyz');
        expect(passwordHasher.hash).toHaveBeenCalledWith('S3cur3Pass!');
        expect(repository.save).toHaveBeenCalledTimes(1);
        const saved = (repository.save as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as User;
        expect(saved).toBeInstanceOf(User);
        expect(saved.email.value).toBe('john@doe.xyz');
        expect(saved.password.value).toBe('hashed-password');
        expect(publisher.publish).toHaveBeenCalledTimes(1);
        expect(
            (publisher.publish as ReturnType<typeof vi.fn>).mock.calls[0][0],
        ).toHaveLength(1);
    });

    it('rejects a duplicate email', async () => {
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            User.create(
                UserId.random(),
                new UserEmail('john@doe.xyz'),
                new UserPassword('S3cur3Pass!'),
            ),
        );

        const request = new CreateUserRequest('john@doe.xyz', 'S3cur3Pass!');

        await expect(useCase.execute(request)).rejects.toBeInstanceOf(
            UserWithEmailAlreadyExists,
        );
        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('rejects a weak password before hashing or saving', async () => {
        const request = new CreateUserRequest('john@doe.xyz', '1234');

        await expect(useCase.execute(request)).rejects.toBeInstanceOf(
            InvalidPassword,
        );
        expect(passwordHasher.hash).not.toHaveBeenCalled();
        expect(repository.save).not.toHaveBeenCalled();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserUseCase } from '@users/application/usecases/create-user.usecase';
import { CreateUserRequest } from '@users/application/dto/create-user.request';
import { UserWithEmailAlreadyExists } from '@users/application/exceptions/user-with-email-already-exists';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserRepository } from '@users/domain/repository/user.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { InvalidCurrency } from '@shared/domain/exceptions/invalid-currency';

describe('CreateUserUseCase', () => {
    const repository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new CreateUserUseCase(repository, publisher);

    beforeEach(() => {
        vi.clearAllMocks();
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );
        (repository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('saves a new user and publishes the domain events', async () => {
        const id = UserId.random().toString();
        const request = new CreateUserRequest(
            id,
            'john@doe.xyz',
            'John Doe',
            'EUR',
        );

        await useCase.execute(request);

        expect(repository.findByEmail).toHaveBeenCalledWith(
            new UserEmail('john@doe.xyz'),
        );
        expect(repository.save).toHaveBeenCalledTimes(1);
        const saved = (repository.save as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as User;
        expect(saved).toBeInstanceOf(User);
        expect(saved.id.toString()).toBe(id);
        expect(saved.email.value).toBe('john@doe.xyz');
        expect(saved.name.value).toBe('John Doe');
        expect(saved.preferredCurrency.value).toBe('EUR');
        expect(saved.avatar).toBeNull();
        expect(saved.address).toBeNull();
        expect(publisher.publish).toHaveBeenCalledTimes(1);
        expect(
            (publisher.publish as ReturnType<typeof vi.fn>).mock.calls[0][0],
        ).toHaveLength(1);
    });

    it('creates a user with optional avatar and address', async () => {
        const request = new CreateUserRequest(
            UserId.random().toString(),
            'jane@doe.xyz',
            'Jane Doe',
            'USD',
            'https://example.com/jane.png',
            {
                street: 'Calle Mayor 1',
                city: 'Madrid',
                postalCode: '28001',
                country: 'ES',
            },
        );

        await useCase.execute(request);

        expect(repository.save).toHaveBeenCalledTimes(1);
        const saved = (repository.save as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as User;
        expect(saved.avatar?.value).toBe('https://example.com/jane.png');
        expect(saved.address?.toPrimitives()).toEqual({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        });
        expect(publisher.publish).toHaveBeenCalledTimes(1);
    });

    it('rejects a duplicate email', async () => {
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            User.create(
                UserId.random(),
                new UserEmail('john@doe.xyz'),
                new UserName('John Doe'),
                new Currency('EUR'),
            ),
        );

        const request = new CreateUserRequest(
            UserId.random().toString(),
            'john@doe.xyz',
            'John Doe',
            'EUR',
        );

        await expect(useCase.execute(request)).rejects.toBeInstanceOf(
            UserWithEmailAlreadyExists,
        );
        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('rejects an unknown currency', async () => {
        const request = new CreateUserRequest(
            UserId.random().toString(),
            'john@doe.xyz',
            'John Doe',
            'XXX',
        );

        await expect(useCase.execute(request)).rejects.toBeInstanceOf(
            InvalidCurrency,
        );
        expect(repository.save).not.toHaveBeenCalled();
    });
});

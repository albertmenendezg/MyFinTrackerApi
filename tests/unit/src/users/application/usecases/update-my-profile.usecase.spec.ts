import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateMyProfileUseCase } from '@users/application/usecases/update-my-profile.usecase';
import { UpdateMyProfileRequest } from '@users/application/dto/update-my-profile.request';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { UserWithEmailAlreadyExists } from '@users/application/exceptions/user-with-email-already-exists';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserRepository } from '@users/domain/repository/user.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { DomainEvent } from '@shared/domain/events/domain-event';

describe('UpdateMyProfileUseCase', () => {
    const userId = UserId.random();
    const user = User.create(
        userId,
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );
    user.pullDomainEvents();

    const repository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new UpdateMyProfileUseCase(repository, publisher);

    beforeEach(() => {
        vi.clearAllMocks();
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            user,
        );
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

    it('updates the given fields and publishes the domain events', async () => {
        await useCase.execute(
            new UpdateMyProfileRequest(
                userId.toString(),
                undefined,
                'Jane Doe',
                'https://example.com/jane.png',
                {
                    street: 'Calle Mayor 1',
                    city: 'Madrid',
                    postalCode: '28001',
                    country: 'ES',
                },
                'USD',
            ),
        );

        expect(user.name.value).toBe('Jane Doe');
        expect(user.avatar?.value).toBe('https://example.com/jane.png');
        expect(user.address?.toPrimitives()).toEqual({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        });
        expect(user.preferredCurrency.value).toBe('USD');
        expect(repository.save).toHaveBeenCalledWith(user);
        expect(publisher.publish).toHaveBeenCalledTimes(1);
        const events = (publisher.publish as ReturnType<typeof vi.fn>).mock
            .calls[0][0] as DomainEvent[];
        expect(events).toHaveLength(1);
        expect(events[0].eventName()).toBe('user.updated');
    });

    it('changes the email when it is available', async () => {
        await useCase.execute(
            new UpdateMyProfileRequest(userId.toString(), 'jane@doe.xyz'),
        );

        expect(repository.findByEmail).toHaveBeenCalledWith(
            new UserEmail('jane@doe.xyz'),
        );
        expect(user.email.value).toBe('jane@doe.xyz');
        expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('keeps the email when it belongs to the same user', async () => {
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            user,
        );

        await useCase.execute(
            new UpdateMyProfileRequest(userId.toString(), 'john@doe.xyz'),
        );

        expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('rejects an email owned by another user', async () => {
        const other = User.create(
            UserId.random(),
            new UserEmail('jane@doe.xyz'),
            new UserName('Jane Doe'),
            new Currency('EUR'),
        );
        (repository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(
            other,
        );

        await expect(
            useCase.execute(
                new UpdateMyProfileRequest(userId.toString(), 'jane@doe.xyz'),
            ),
        ).rejects.toBeInstanceOf(UserWithEmailAlreadyExists);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('throws UserNotFoundException when the user does not exist', async () => {
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );

        await expect(
            useCase.execute(
                new UpdateMyProfileRequest(
                    userId.toString(),
                    undefined,
                    'Nope',
                ),
            ),
        ).rejects.toBeInstanceOf(UserNotFoundException);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });
});

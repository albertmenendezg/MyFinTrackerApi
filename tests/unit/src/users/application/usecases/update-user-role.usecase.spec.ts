import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateUserRoleUseCase } from '@users/application/usecases/update-user-role.usecase';
import { UpdateUserRoleRequest } from '@users/application/dto/update-user-role.request';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { UserRole } from '@users/domain/value-objects/user-role';
import { Currency } from '@shared/domain/value-objects/currency';
import { InvalidUserRole } from '@users/domain/exceptions/invalid-user-role';
import { UserRolesUpdatedEvent } from '@users/domain/events/user-roles-updated.event';
import { UserRepository } from '@users/domain/repository/user.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';

describe('UpdateUserRoleUseCase', () => {
    const user = User.create(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );
    user.pullDomainEvents();

    const repository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByEmail: vi.fn(),
        findById: vi.fn().mockResolvedValue(user),
    } as unknown as UserRepository;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new UpdateUserRoleUseCase(repository, publisher);

    beforeEach(() => {
        vi.clearAllMocks();
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            user,
        );
        (repository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('updates the user roles and saves', async () => {
        await useCase.execute(
            new UpdateUserRoleRequest(user.id.toString(), ['admin']),
        );

        expect(user.roles).toEqual([UserRole.ADMIN]);
        expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('accepts multiple roles at once', async () => {
        await useCase.execute(
            new UpdateUserRoleRequest(user.id.toString(), ['user', 'admin']),
        );

        expect(user.roles).toEqual([UserRole.USER, UserRole.ADMIN]);
        expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('publishes a UserRolesUpdatedEvent', async () => {
        await useCase.execute(
            new UpdateUserRoleRequest(user.id.toString(), ['admin']),
        );

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        const events = (publisher.publish as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserRolesUpdatedEvent);
        expect(events[0].eventName()).toBe('user.roles.updated');
    });

    it('throws UserNotFoundException when user does not exist', async () => {
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );

        await expect(
            useCase.execute(
                new UpdateUserRoleRequest(
                    '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
                    ['admin'],
                ),
            ),
        ).rejects.toBeInstanceOf(UserNotFoundException);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('throws InvalidUserRole for an invalid role', async () => {
        await expect(
            useCase.execute(
                new UpdateUserRoleRequest(user.id.toString(), ['superuser']),
            ),
        ).rejects.toBeInstanceOf(InvalidUserRole);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });
});

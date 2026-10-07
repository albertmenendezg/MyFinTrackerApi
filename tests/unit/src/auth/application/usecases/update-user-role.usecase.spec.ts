import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateUserRoleUseCase } from '@auth/application/usecases/update-user-role.usecase';
import { UpdateUserRoleRequest } from '@auth/application/dto/update-user-role.request';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserCreatedAt } from '@auth/domain/value-objects/user-created-at';
import { UserUpdatedAt } from '@auth/domain/value-objects/user-updated-at';
import { UserRole } from '@auth/domain/value-objects/user-role';
import { UserNotFoundException } from '@auth/domain/exceptions/user-not-found.exception';
import { InvalidUserRolesException } from '@auth/domain/exceptions/invalid-user-roles.exception';
import { UserRolesUpdatedEvent } from '@auth/domain/events/user-roles-updated.event';

describe('UpdateUserRoleUseCase', () => {
    const user = new User(
        new UserId('6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94'),
        new UserEmail('john@doe.xyz'),
        new UserPassword('hashed-password'),
        UserCreatedAt.now(),
        UserUpdatedAt.now(),
        [UserRole.USER],
    );

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

    it('updates the user role and saves', async () => {
        await useCase.execute(
            new UpdateUserRoleRequest(user.id.value, 'admin'),
        );

        expect(user.roles).toEqual([UserRole.ADMIN]);
        expect(repository.save).toHaveBeenCalledWith(user);
    });

    it('publishes a UserRolesUpdatedEvent', async () => {
        await useCase.execute(
            new UpdateUserRoleRequest(user.id.value, 'admin'),
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
                    'admin',
                ),
            ),
        ).rejects.toBeInstanceOf(UserNotFoundException);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('throws InvalidUserRolesException for an invalid role', async () => {
        await expect(
            useCase.execute(
                new UpdateUserRoleRequest(user.id.value, 'superuser'),
            ),
        ).rejects.toBeInstanceOf(InvalidUserRolesException);

        expect(repository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });
});

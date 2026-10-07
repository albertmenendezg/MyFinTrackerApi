import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateAuthCredentialRolesUseCase } from '@auth/application/usecases/update-auth-credential-roles.usecase';
import { UpdateAuthCredentialRolesRequest } from '@auth/application/dto/update-auth-credential-roles.request';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { AuthCredentialRepository } from '@auth/domain/repository/auth-credential.repository';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { UserRole } from '@users/domain/value-objects/user-role';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserRepository } from '@users/domain/repository/user.repository';
import { DomainEventPublisher } from '@shared/domain/events/domain-event-publisher';

describe('UpdateAuthCredentialRolesUseCase', () => {
    const userId = UserId.random();
    const user = User.create(
        userId,
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );
    user.updateRoles([UserRole.ADMIN]);
    user.pullDomainEvents();

    const credential = AuthCredential.create(
        userId,
        new AuthCredentialPassword('hashed-password'),
    );
    credential.pullDomainEvents();

    const userRepository = {
        save: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const credentialRepository = {
        save: vi.fn().mockResolvedValue(undefined),
        findByUserId: vi.fn(),
    } as unknown as AuthCredentialRepository;

    const publisher = {
        publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as DomainEventPublisher;

    const useCase = new UpdateAuthCredentialRolesUseCase(
        userRepository,
        credentialRepository,
        publisher,
    );

    beforeEach(() => {
        vi.clearAllMocks();
        (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            user,
        );
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
        ).mockResolvedValue(credential);
        (
            credentialRepository.save as ReturnType<typeof vi.fn>
        ).mockResolvedValue(undefined);
        (publisher.publish as ReturnType<typeof vi.fn>).mockResolvedValue(
            undefined,
        );
    });

    it('projects the user roles onto its credential', async () => {
        await useCase.execute(
            new UpdateAuthCredentialRolesRequest(userId.toString()),
        );

        expect(userRepository.findById).toHaveBeenCalledWith(userId);
        expect(credentialRepository.findByUserId).toHaveBeenCalledWith(userId);
        expect(credential.roles).toEqual([AuthCredentialRole.ADMIN]);
        expect(credentialRepository.save).toHaveBeenCalledWith(credential);
        expect(publisher.publish).toHaveBeenCalledTimes(1);
    });

    it('skips silently when the user no longer exists', async () => {
        (userRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );

        await useCase.execute(
            new UpdateAuthCredentialRolesRequest(userId.toString()),
        );

        expect(credentialRepository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });

    it('skips silently when the credential does not exist', async () => {
        (
            credentialRepository.findByUserId as ReturnType<typeof vi.fn>
        ).mockResolvedValue(null);

        await useCase.execute(
            new UpdateAuthCredentialRolesRequest(userId.toString()),
        );

        expect(credentialRepository.save).not.toHaveBeenCalled();
        expect(publisher.publish).not.toHaveBeenCalled();
    });
});

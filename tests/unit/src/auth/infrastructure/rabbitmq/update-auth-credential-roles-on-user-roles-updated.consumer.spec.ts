import { describe, expect, it, vi } from 'vitest';
import { UpdateAuthCredentialRolesOnUserRolesUpdated } from '@auth/infrastructure/rabbitmq/update-auth-credential-roles-on-user-roles-updated.consumer';
import { UpdateAuthCredentialRolesRequest } from '@auth/application/dto/update-auth-credential-roles.request';
import { UpdateAuthCredentialRolesUseCase } from '@auth/application/usecases/update-auth-credential-roles.usecase';
import { UserRolesUpdatedEvent } from '@users/domain/events/user-roles-updated.event';

describe('UpdateAuthCredentialRolesOnUserRolesUpdated', () => {
    it('delegates to the use case with the aggregate id', async () => {
        const useCase = {
            execute: vi.fn().mockResolvedValue(undefined),
        } as unknown as UpdateAuthCredentialRolesUseCase;
        const consumer = new UpdateAuthCredentialRolesOnUserRolesUpdated(
            useCase,
        );

        await consumer.handle(new UserRolesUpdatedEvent('user-id', {}));

        expect(useCase.execute).toHaveBeenCalledWith(
            new UpdateAuthCredentialRolesRequest('user-id'),
        );
    });
});

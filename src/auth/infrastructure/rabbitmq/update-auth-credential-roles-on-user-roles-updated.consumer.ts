import { Injectable } from '@nestjs/common';
import { DomainEventConsumer } from '@shared/infrastructure/rabbitmq/domain-event-consumer';
import { DomainEventHandler } from '@shared/domain/events/domain-event-handler';
import { UpdateAuthCredentialRolesRequest } from '@auth/application/dto/update-auth-credential-roles.request';
import { UpdateAuthCredentialRolesUseCase } from '@auth/application/usecases/update-auth-credential-roles.usecase';
import { UserRolesUpdatedEvent } from '@users/domain/events/user-roles-updated.event';

@Injectable()
@DomainEventConsumer({
    eventName: 'user.roles.updated',
    eventClass: UserRolesUpdatedEvent,
    queue: 'update_auth_credential_roles_on_user_roles_updated',
})
export class UpdateAuthCredentialRolesOnUserRolesUpdated implements DomainEventHandler<UserRolesUpdatedEvent> {
    constructor(
        private readonly updateAuthCredentialRolesUseCase: UpdateAuthCredentialRolesUseCase,
    ) {}

    async handle(event: UserRolesUpdatedEvent): Promise<void> {
        const { aggregateId } = event;

        await this.updateAuthCredentialRolesUseCase.execute(
            new UpdateAuthCredentialRolesRequest(aggregateId),
        );
    }
}

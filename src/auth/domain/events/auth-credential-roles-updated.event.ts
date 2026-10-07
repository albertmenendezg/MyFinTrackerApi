import { DomainEvent } from '@shared/domain/events/domain-event';

export class AuthCredentialRolesUpdatedEvent extends DomainEvent {
    eventName(): string {
        return 'auth_credential.roles.updated';
    }
}

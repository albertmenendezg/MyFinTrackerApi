import { DomainEvent } from '@shared/domain/events/domain-event';

export class AuthCredentialCreatedEvent extends DomainEvent {
    eventName(): string {
        return 'auth_credential.created';
    }
}

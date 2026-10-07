import { DomainEvent } from '@shared/domain/events/domain-event';

export class UserUpdatedEvent extends DomainEvent {
    eventName(): string {
        return 'user.updated';
    }
}

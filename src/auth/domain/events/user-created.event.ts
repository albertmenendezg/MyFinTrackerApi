import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export class UserCreatedEvent extends DomainEvent {
    eventName(): string {
        return 'user.created';
    }
}

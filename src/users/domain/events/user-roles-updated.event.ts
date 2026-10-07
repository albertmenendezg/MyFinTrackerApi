import { DomainEvent } from '@shared/domain/events/domain-event';

export class UserRolesUpdatedEvent extends DomainEvent {
    eventName(): string {
        return 'user.roles.updated';
    }
}

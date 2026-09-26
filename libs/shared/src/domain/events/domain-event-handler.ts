import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export interface DomainEventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}

import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export const DOMAIN_EVENT_PUBLISHER = 'domain-event-publisher';

export interface DomainEventPublisher {
    publish(events: DomainEvent[]): Promise<void>;
}

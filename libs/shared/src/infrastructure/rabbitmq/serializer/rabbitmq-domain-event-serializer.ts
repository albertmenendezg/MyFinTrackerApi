import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export type RabbitmqDomainEventMessage = DomainEvent;

export class RabbitmqDomainEventSerializer {
    toMessage(event: DomainEvent): RabbitmqDomainEventMessage {
        return {
            aggregateId: event.aggregateId,
            body: event.body,
            eventId: event.eventId,
            occurredOn: event.occurredOn,
            eventName: event.eventName,
        };
    }
}

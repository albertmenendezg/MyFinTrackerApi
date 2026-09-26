import { DomainEvent } from '@shared/shared/domain/events/domain-event';
import { DomainEventClass } from '@shared/shared/application/events/domain-event-consumer';
import { Message } from 'amqplib';

export class RabbitmqDomainEventDeserializer {
    fromMessage(message: Message, eventClass: DomainEventClass): DomainEvent {
        const payload = JSON.parse(message.content.toString()) as {
            aggregateId: string;
            body: object;
            eventId: string;
            occurredOn: string;
        };

        return new eventClass(
            payload.aggregateId,
            payload.body,
            payload.eventId,
            new Date(payload.occurredOn),
        );
    }
}

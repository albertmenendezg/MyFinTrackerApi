import { DomainEvent } from '@shared/domain/events/domain-event';
import { DomainEventClass } from '@shared/infrastructure/rabbitmq/domain-event-consumer';
import { Message } from 'amqplib';

export class RabbitmqDomainEventDeserializer {
    fromMessage(message: Message, eventClass: DomainEventClass): DomainEvent {
        const { aggregateId, body, eventId, occurredOn } = JSON.parse(
            message.content.toString(),
        ) as {
            aggregateId: string;
            body: object;
            eventId: string;
            occurredOn: string;
        };

        return new eventClass(aggregateId, body, eventId, new Date(occurredOn));
    }
}

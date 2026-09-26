import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/shared/domain/events/domain-event';
import { DomainEventPublisher } from '@shared/shared/domain/events/domain-event-publisher';
import { RabbitmqDomainEventSerializer } from '@shared/shared/infrastructure/rabbitmq/serializer/rabbitmq-domain-event-serializer';
import { RabbitMQClient } from '@shared/shared/infrastructure/rabbitmq/client/rabbitmq-client.service';

@Injectable()
export class RabbitMqDomainEventPublisher implements DomainEventPublisher {
    constructor(
        private readonly client: RabbitMQClient,
        private readonly serializer: RabbitmqDomainEventSerializer,
    ) {}

    async publish(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            await this.client.publish(
                event.eventName(),
                Buffer.from(JSON.stringify(this.serializer.toMessage(event))),
            );
        }
    }
}

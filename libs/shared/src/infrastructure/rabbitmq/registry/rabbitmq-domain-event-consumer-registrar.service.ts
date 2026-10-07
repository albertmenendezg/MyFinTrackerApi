import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { DomainEventDispatcher } from '@shared/application/events/domain-event-dispatcher';
import { DomainEventConsumer } from '@shared/application/events/domain-event-consumer';
import { DomainEvent } from '@shared/domain/events/domain-event';
import { DomainEventHandler } from '@shared/domain/events/domain-event-handler';
import { RabbitmqDomainEventDeserializer } from '@shared/infrastructure/rabbitmq/serializer/rabbitmq-domain-event-deserializer';
import { RabbitMQClient } from '@shared/infrastructure/rabbitmq/client/rabbitmq-client.service';

@Injectable()
export class RabbitmqDomainEventConsumerRegistrar implements OnApplicationBootstrap {
    constructor(
        private readonly discoveryService: DiscoveryService,
        private readonly client: RabbitMQClient,
        private readonly dispatcher: DomainEventDispatcher,
        private readonly deserializer: RabbitmqDomainEventDeserializer,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const wrappers = this.discoveryService.getProviders({
            metadataKey: DomainEventConsumer.KEY,
        });

        for (const wrapper of wrappers) {
            const metadata = this.discoveryService.getMetadataByDecorator(
                DomainEventConsumer,
                wrapper,
            );
            if (!metadata) {
                continue;
            }

            const handler = wrapper.instance as DomainEventHandler<DomainEvent>;
            this.dispatcher.register(metadata.eventName, handler);

            await this.client.consume(
                metadata.queue,
                metadata.eventName,
                async (message, { ack, nack }) => {
                    try {
                        const event = this.deserializer.fromMessage(
                            message,
                            metadata.eventClass,
                        );
                        await this.dispatcher.dispatch(event);
                        ack();
                    } catch {
                        nack();
                    }
                },
                metadata.exchange,
            );
        }
    }
}

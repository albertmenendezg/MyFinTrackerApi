import { DiscoveryService } from '@nestjs/core';
import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export interface DomainEventClass {
    new (...args: any[]): DomainEvent;
}

export interface DomainEventConsumerMetadata {
    eventName: string;
    eventClass: DomainEventClass;
    queue: string;
    exchange?: string;
}

export const DomainEventConsumer =
    DiscoveryService.createDecorator<DomainEventConsumerMetadata>();

import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/events/domain-event';
import { DomainEventHandler } from '@shared/domain/events/domain-event-handler';

@Injectable()
export class DomainEventDispatcher {
    private readonly handlers = new Map<
        string,
        DomainEventHandler<DomainEvent>
    >();

    register<T extends DomainEvent>(
        eventName: string,
        handler: DomainEventHandler<T>,
    ): void {
        this.handlers.set(
            eventName,
            handler as DomainEventHandler<DomainEvent>,
        );
    }

    async dispatch(event: DomainEvent): Promise<void> {
        const handler = this.handlers.get(event.eventName());
        if (!handler) {
            return;
        }
        await handler.handle(event);
    }
}

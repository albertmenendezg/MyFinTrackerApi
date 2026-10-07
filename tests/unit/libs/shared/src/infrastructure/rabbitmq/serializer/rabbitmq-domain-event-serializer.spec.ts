import { describe, expect, it } from 'vitest';
import { UserCreatedEvent } from '@auth/domain/events/user-created.event';
import { RabbitmqDomainEventSerializer } from '@shared/infrastructure/rabbitmq/serializer/rabbitmq-domain-event-serializer';

describe('RabbitmqDomainEventSerializer', () => {
    it('serializes a domain event to the wire format', () => {
        const event = new UserCreatedEvent('user-123', {
            email: 'john@doe.xyz',
        });
        const serializer = new RabbitmqDomainEventSerializer();

        const message = serializer.toMessage(event);

        expect(message).toEqual({
            aggregateId: 'user-123',
            body: { email: 'john@doe.xyz' },
            eventId: event.eventId,
            occurredOn: event.occurredOn,
            eventName: event.eventName,
        });
    });
});

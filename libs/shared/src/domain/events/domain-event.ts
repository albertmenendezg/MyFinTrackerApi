import { Identifier } from '@shared/shared/domain/value-objects/identifier';

export abstract class DomainEvent {
    public readonly aggregateId: string;
    public readonly body: object;
    public readonly eventId: string;
    public readonly occurredOn: Date;

    constructor(
        aggregateId: string,
        body: object,
        eventId?: string,
        occurredOn?: Date,
    ) {
        this.aggregateId = aggregateId;
        this.body = body;
        this.eventId = eventId ?? Identifier.random().toString();
        this.occurredOn = occurredOn ?? new Date();
    }

    abstract eventName(): string;
}

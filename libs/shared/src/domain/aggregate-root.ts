import { DomainEvent } from '@shared/shared/domain/events/domain-event';

export abstract class AggregateRoot {
    private readonly domainEvents: DomainEvent[] = [];

    public record(domainEvent: DomainEvent): void {
        this.domainEvents.push(domainEvent);
    }

    public pullDomainEvents(): DomainEvent[] {
        return this.domainEvents.splice(0, this.domainEvents.length);
    }

    public abstract toPrimitives(): Map<string, any>;
}

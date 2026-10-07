import { DomainEvent } from '@shared/domain/events/domain-event';

export class RefreshTokenCreatedEvent extends DomainEvent {
    eventName(): string {
        return 'refresh_token.created';
    }
}

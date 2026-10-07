import { DomainEvent } from '@shared/domain/events/domain-event';

export class RefreshTokenRevokedEvent extends DomainEvent {
    eventName(): string {
        return 'refresh_token.revoked';
    }
}

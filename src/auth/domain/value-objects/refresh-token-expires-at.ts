import { DateTime } from '@shared/domain/value-objects/date-time';

export class RefreshTokenExpiresAt extends DateTime {
    public static inSeconds(ttlInSeconds: number): RefreshTokenExpiresAt {
        return new this(new Date(Date.now() + ttlInSeconds * 1000));
    }
}

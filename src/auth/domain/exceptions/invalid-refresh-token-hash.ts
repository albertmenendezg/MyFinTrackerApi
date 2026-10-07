import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidRefreshTokenHash extends DomainException {
    constructor() {
        super(
            'Invalid refresh token hash. It must be a 64 character SHA-256 hex digest',
        );
        this.name = 'InvalidRefreshTokenHash';
    }
}

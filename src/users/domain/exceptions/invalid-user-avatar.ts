import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAvatar extends DomainException {
    constructor(avatar: any) {
        super(`Invalid user avatar ${avatar}`);
        this.name = 'InvalidUserAvatar';
    }
}

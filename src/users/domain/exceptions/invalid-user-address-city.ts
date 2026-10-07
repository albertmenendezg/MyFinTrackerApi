import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAddressCity extends DomainException {
    constructor() {
        super('Invalid user address: city is missing or too long');
        this.name = 'InvalidUserAddressCity';
    }
}

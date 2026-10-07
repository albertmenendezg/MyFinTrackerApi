import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAddressPostalCode extends DomainException {
    constructor() {
        super('Invalid user address: postal code is missing or too long');
        this.name = 'InvalidUserAddressPostalCode';
    }
}

import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAddressCountry extends DomainException {
    constructor() {
        super('Invalid user address: country is missing or too long');
        this.name = 'InvalidUserAddressCountry';
    }
}

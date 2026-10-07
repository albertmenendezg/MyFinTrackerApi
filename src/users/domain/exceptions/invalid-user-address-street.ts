import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAddressStreet extends DomainException {
    constructor() {
        super('Invalid user address: street is missing or too long');
        this.name = 'InvalidUserAddressStreet';
    }
}

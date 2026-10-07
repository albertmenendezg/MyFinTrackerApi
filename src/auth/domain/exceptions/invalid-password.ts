import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidPassword extends DomainException {
    constructor() {
        super('Invalid password. It must have at least 8 characters');
        this.name = 'InvalidPassword';
    }
}

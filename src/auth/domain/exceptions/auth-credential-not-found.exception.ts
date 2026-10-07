import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class AuthCredentialNotFoundException extends DomainException {
    constructor() {
        super('User not found');
        this.name = 'AuthCredentialNotFoundException';
    }
}

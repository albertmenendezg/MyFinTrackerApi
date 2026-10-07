import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidAuthCredentialRole extends DomainException {
    constructor(role: string) {
        super('Invalid role: ' + role);
        this.name = 'InvalidAuthCredentialRole';
    }
}

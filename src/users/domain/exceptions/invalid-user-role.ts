import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserRole extends DomainException {
    constructor(role: string) {
        super('Invalid user role: ' + role);
        this.name = 'InvalidUserRole';
    }
}

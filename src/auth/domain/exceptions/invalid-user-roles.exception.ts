import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserRolesException extends DomainException {
    constructor(role: string) {
        super('Invalid user role: ' + role);
    }
}

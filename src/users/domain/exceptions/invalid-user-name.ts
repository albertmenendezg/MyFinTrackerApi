import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserName extends DomainException {
    constructor(name: any) {
        super(`Invalid user name ${name}`);
        this.name = 'InvalidUserName';
    }
}

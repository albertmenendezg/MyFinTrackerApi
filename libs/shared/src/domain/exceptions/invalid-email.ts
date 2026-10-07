import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidEmail extends DomainException {
    constructor(email: any) {
        super(`Invalid email ${email}`);
        this.name = 'InvalidEmail';
    }
}

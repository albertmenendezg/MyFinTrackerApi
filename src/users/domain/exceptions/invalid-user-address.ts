import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidUserAddress extends DomainException {
    constructor(message: string = 'Invalid user address') {
        super(message);
        this.name = 'InvalidUserAddress';
    }
}

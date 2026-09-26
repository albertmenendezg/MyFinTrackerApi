import { DomainException } from '@shared/shared/domain/exceptions/domain-exception';

export class InvalidIdentifier extends DomainException {
    constructor(id: any) {
        super(`Invalid identifier ${id}`);
        this.name = 'InvalidIdentifier';
    }
}

import { DomainException } from '@shared/domain/exceptions/domain-exception';

export class InvalidCurrency extends DomainException {
    constructor(currency: any) {
        super(`Invalid currency ${currency}`);
        this.name = 'InvalidCurrency';
    }
}

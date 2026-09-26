import { DomainException } from '@shared/shared/domain/exceptions/domain-exception';

export class InvalidDateTime extends DomainException {
    constructor(date: any) {
        super(`Invalid date ${date}`);
        this.name = 'InvalidDateTime';
    }
}

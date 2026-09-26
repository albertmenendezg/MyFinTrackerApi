import { Email } from '@shared/shared/domain/value-objects/email';

export class UserEmail extends Email {
    constructor(value: string) {
        super(value);
    }
}

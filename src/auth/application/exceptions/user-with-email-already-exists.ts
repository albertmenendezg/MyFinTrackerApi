import { ApplicationException } from '@shared/application/exceptions/application-exception';

export class UserWithEmailAlreadyExists extends ApplicationException {
    constructor(email: string) {
        super(`User with email "${email}" already exists`);
        this.name = 'UserWithEmailAlreadyExists';
    }
}

import { InvalidUserName } from '@users/domain/exceptions/invalid-user-name';

export class UserName {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidName(value);
        this.value = value;
    }

    toString(): string {
        return this.value;
    }

    private ensureValidName(value: string): void {
        if (!value || value.trim().length < 1 || value.length > 100) {
            throw new InvalidUserName(value);
        }
    }
}

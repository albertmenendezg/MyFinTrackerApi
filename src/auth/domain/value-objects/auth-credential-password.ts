import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';

export class AuthCredentialPassword {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidPassword(value);
        this.value = value;
    }

    private ensureValidPassword(value: string): void {
        if (!value || value.length < 8) {
            throw new InvalidPassword();
        }
    }

    public toString(): string {
        return this.value;
    }
}

import { InvalidEmail } from '@shared/domain/exceptions/invalid-email';

export abstract class Email {
    public readonly value: string;

    protected constructor(value: string) {
        this.ensureValidEmail(value);
        this.value = value;
    }

    toString(): string {
        return this.value;
    }

    private ensureValidEmail(value: string): void {
        if (!value || !this.isValidEmail(value)) {
            throw new InvalidEmail(value);
        }
    }

    private isValidEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
}

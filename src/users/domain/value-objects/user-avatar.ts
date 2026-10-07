import { InvalidUserAvatar } from '@users/domain/exceptions/invalid-user-avatar';

export class UserAvatar {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidAvatar(value);
        this.value = value;
    }

    toString(): string {
        return this.value;
    }

    private ensureValidAvatar(value: string): void {
        if (!value || value.length < 1 || value.length > 500) {
            throw new InvalidUserAvatar(value);
        }
    }
}

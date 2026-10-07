import { v4, validate } from 'uuid';
import { InvalidIdentifier } from '@shared/domain/exceptions/invalid-identifier';

export class Identifier {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidIdentifier(value);
        this.value = value;
    }

    public toString(): string {
        return this.value;
    }

    private ensureValidIdentifier(value: string): void {
        if (!value || !validate(value)) {
            throw new InvalidIdentifier(value);
        }
    }

    public static random<T extends Identifier>(
        this: new (value: string) => T,
    ): T {
        return new this(v4());
    }
}

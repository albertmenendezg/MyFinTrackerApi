import { InvalidDateTime } from '@shared/shared/domain/exceptions/invalid-datetime';

export abstract class DateTime {
    public readonly value: Date;

    constructor(value: Date) {
        this.ensureValidDate(value);
        this.value = value;
    }

    public static now<T extends DateTime>(this: new (value: Date) => T): T {
        return new this(new Date());
    }

    public toString(): string {
        return this.value.toISOString();
    }

    private ensureValidDate(value: Date): void {
        if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
            throw new InvalidDateTime(value);
        }
    }
}

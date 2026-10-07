import { InvalidCurrency } from '@shared/domain/exceptions/invalid-currency';

const VALID_CURRENCIES = new Set([
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'CAD',
    'AUD',
    'CNY',
    'MXN',
    'BRL',
    'ARS',
    'CLP',
    'COP',
    'PEN',
]);

export class Currency {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidCurrency(value);
        this.value = value;
    }

    toString(): string {
        return this.value;
    }

    private ensureValidCurrency(value: string): void {
        if (!value || !VALID_CURRENCIES.has(value)) {
            throw new InvalidCurrency(value);
        }
    }
}

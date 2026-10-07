import { describe, expect, it } from 'vitest';
import { Currency } from '@shared/domain/value-objects/currency';
import { InvalidCurrency } from '@shared/domain/exceptions/invalid-currency';

describe('Currency', () => {
    it('wraps a valid ISO-4217 code', () => {
        const currency = new Currency('EUR');
        expect(currency.value).toBe('EUR');
        expect(currency.toString()).toBe('EUR');
    });

    it.each(['', 'usd', 'EURO', '123', 'X'])(
        'rejects "%s" with InvalidCurrency',
        (value) => {
            expect(() => new Currency(value)).toThrow(InvalidCurrency);
        },
    );
});

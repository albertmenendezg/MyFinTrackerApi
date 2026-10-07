import { describe, expect, it } from 'vitest';
import { DateTime } from '@shared/domain/value-objects/date-time';
import { InvalidDateTime } from '@shared/domain/exceptions/invalid-datetime';

class FixedDateTime extends DateTime {}

describe('DateTime', () => {
    const date = new Date('2026-09-25T12:00:00.000Z');

    it('wraps a valid date', () => {
        const dateTime = new FixedDateTime(date);
        expect(dateTime.value).toBe(date);
        expect(dateTime.toString()).toBe('2026-09-25T12:00:00.000Z');
    });

    it('creates a DateTime for the current instant', () => {
        const before = Date.now();
        const dateTime = FixedDateTime.now();
        expect(dateTime.value.getTime()).toBeGreaterThanOrEqual(before);
        expect(dateTime.value.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it.each([undefined, '2026-09-25', new Date('not-a-date')])(
        'rejects invalid date "%s" with InvalidDateTime',
        (value) => {
            expect(() => new FixedDateTime(value as unknown as Date)).toThrow(
                InvalidDateTime,
            );
        },
    );
});

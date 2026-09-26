import { describe, expect, it } from 'vitest';
import { validate } from 'uuid';
import { Identifier } from '@shared/shared/domain/value-objects/identifier';
import { InvalidIdentifier } from '@shared/shared/domain/exceptions/invalid-identifier';

describe('Identifier', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';

    it('wraps a valid uuid', () => {
        const id = new Identifier(uuid);
        expect(id.value).toBe(uuid);
        expect(id.toString()).toBe(uuid);
    });

    it.each(['', 'not-a-uuid', '123e4567-e89b-12d3-a456'])(
        'rejects "%s" with InvalidIdentifier',
        (value) => {
            expect(() => new Identifier(value)).toThrow(InvalidIdentifier);
        },
    );

    it('generates a random valid identifier', () => {
        expect(validate(Identifier.random().value)).toBe(true);
    });
});

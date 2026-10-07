import { describe, expect, it } from 'vitest';
import { UserName } from '@users/domain/value-objects/user-name';
import { InvalidUserName } from '@users/domain/exceptions/invalid-user-name';

describe('UserName', () => {
    it('accepts a non-empty name up to 100 characters', () => {
        const name = new UserName('Ada Lovelace');
        expect(name.value).toBe('Ada Lovelace');
        expect(name.toString()).toBe('Ada Lovelace');
    });

    it.each(['', '   ', 'a'.repeat(101)])(
        'rejects "%s" with InvalidUserName',
        (value) => {
            expect(() => new UserName(value)).toThrow(InvalidUserName);
        },
    );
});

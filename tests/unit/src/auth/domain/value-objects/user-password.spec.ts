import { describe, expect, it } from 'vitest';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';

describe('UserPassword', () => {
    it('accepts a value with at least 8 characters', () => {
        const password = new UserPassword('S3cur3Pass!');
        expect(password.value).toBe('S3cur3Pass!');
        expect(password.toString()).toBe('S3cur3Pass!');
    });

    it.each(['short', '', '123456 ', '   '])(
        'rejects "%s" with InvalidPassword',
        (value) => {
            expect(() => new UserPassword(value)).toThrow(InvalidPassword);
        },
    );
});

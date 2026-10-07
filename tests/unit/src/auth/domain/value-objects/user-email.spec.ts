import { describe, expect, it } from 'vitest';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { InvalidEmail } from '@shared/domain/exceptions/invalid-email';

describe('UserEmail', () => {
    it('accepts a well-formed email', () => {
        const email = new UserEmail('john@doe.xyz');
        expect(email.value).toBe('john@doe.xyz');
        expect(email.toString()).toBe('john@doe.xyz');
    });

    it.each(['not-an-email', '@example.com', 'a@b', 'a b@c.com'])(
        'rejects "%s" with InvalidEmail',
        (value) => {
            expect(() => new UserEmail(value)).toThrow(InvalidEmail);
        },
    );
});

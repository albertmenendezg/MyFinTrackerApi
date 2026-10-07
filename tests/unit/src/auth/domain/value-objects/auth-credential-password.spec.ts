import { describe, expect, it } from 'vitest';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';

describe('AuthCredentialPassword', () => {
    it('accepts a value with at least 8 characters', () => {
        const password = new AuthCredentialPassword('S3cur3Pass!');
        expect(password.value).toBe('S3cur3Pass!');
        expect(password.toString()).toBe('S3cur3Pass!');
    });

    it.each(['short', '', '123456 ', '   '])(
        'rejects "%s" with InvalidPassword',
        (value) => {
            expect(() => new AuthCredentialPassword(value)).toThrow(
                InvalidPassword,
            );
        },
    );
});

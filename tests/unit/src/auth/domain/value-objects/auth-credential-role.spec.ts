import { describe, expect, it } from 'vitest';
import {
    AuthCredentialRole,
    AuthCredentialRoleValues,
} from '@auth/domain/value-objects/auth-credential-role';
import { InvalidAuthCredentialRole } from '@auth/domain/exceptions/invalid-auth-credential-role';

describe('AuthCredentialRole', () => {
    it('accepts "user" as a valid role', () => {
        const role = new AuthCredentialRole('user');
        expect(role.value).toBe('user');
    });

    it('accepts "admin" as a valid role', () => {
        const role = new AuthCredentialRole('admin');
        expect(role.value).toBe('admin');
    });

    it.each(['superuser', 'moderator', '', 'USER', 'Admin'])(
        'rejects "%s" with InvalidAuthCredentialRole',
        (value) => {
            expect(() => new AuthCredentialRole(value)).toThrow(
                InvalidAuthCredentialRole,
            );
        },
    );

    it('exposes the enum values', () => {
        expect(AuthCredentialRoleValues.USER).toBe('user');
        expect(AuthCredentialRoleValues.ADMIN).toBe('admin');
    });

    it('provides static instances for each role', () => {
        expect(AuthCredentialRole.USER.value).toBe('user');
        expect(AuthCredentialRole.ADMIN.value).toBe('admin');
        expect(AuthCredentialRole.DEFAULT.value).toBe('user');
    });
});

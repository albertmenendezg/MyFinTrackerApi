import { describe, expect, it } from 'vitest';
import { UserRole, UserRoleValues } from '@auth/domain/value-objects/user-role';
import { InvalidUserRolesException } from '@auth/domain/exceptions/invalid-user-roles.exception';

describe('UserRole', () => {
    it('accepts "user" as a valid role', () => {
        const role = new UserRole('user');
        expect(role.value).toBe('user');
    });

    it('accepts "admin" as a valid role', () => {
        const role = new UserRole('admin');
        expect(role.value).toBe('admin');
    });

    it.each(['superuser', 'moderator', '', 'USER', 'Admin'])(
        'rejects "%s" with InvalidUserRolesException',
        (value) => {
            expect(() => new UserRole(value)).toThrow(
                InvalidUserRolesException,
            );
        },
    );

    it('exposes the enum values', () => {
        expect(UserRoleValues.USER).toBe('user');
        expect(UserRoleValues.ADMIN).toBe('admin');
    });

    it('provides static instances for each role', () => {
        expect(UserRole.USER.value).toBe('user');
        expect(UserRole.ADMIN.value).toBe('admin');
        expect(UserRole.DEFAULT.value).toBe('user');
    });
});

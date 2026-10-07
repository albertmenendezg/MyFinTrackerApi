import { describe, expect, it } from 'vitest';
import {
    UserRole,
    UserRoleValues,
} from '@users/domain/value-objects/user-role';
import { InvalidUserRole } from '@users/domain/exceptions/invalid-user-role';

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
        'rejects "%s" with InvalidUserRole',
        (value) => {
            expect(() => new UserRole(value)).toThrow(InvalidUserRole);
        },
    );

    it('exposes the enum values', () => {
        expect(UserRoleValues.USER).toBe('user');
        expect(UserRoleValues.ADMIN).toBe('admin');
    });

    it('provides static instances for each role', () => {
        expect(UserRole.USER.value).toBe('user');
        expect(UserRole.ADMIN.value).toBe('admin');
    });
});

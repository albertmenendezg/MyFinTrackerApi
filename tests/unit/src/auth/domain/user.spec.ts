import { describe, expect, it } from 'vitest';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserCreatedEvent } from '@auth/domain/events/user-created.event';
import { UserRolesUpdatedEvent } from '@auth/domain/events/user-roles-updated.event';
import { UserRole } from '@auth/domain/value-objects/user-role';

describe('User aggregate', () => {
    const id = UserId.random();
    const user = User.create(
        id,
        new UserEmail('john@doe.xyz'),
        new UserPassword('S3cur3Pass!'),
    );

    it('exposes its value objects', () => {
        expect(user.id).toBe(id);
        expect(user.email.value).toBe('john@doe.xyz');
        expect(user.password.value).toBe('S3cur3Pass!');
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
        expect(user.roles).toEqual([UserRole.USER]);
    });

    it('serializes to primitives', () => {
        const primitives = user.toPrimitives();
        expect(primitives.get('id')).toBe(id.toString());
        expect(primitives.get('email')).toBe('john@doe.xyz');
        expect(primitives.get('password')).toBe('S3cur3Pass!');
        expect(primitives.get('createdAt')).toBe(user.createdAt.toString());
        expect(primitives.get('updatedAt')).toBe(user.updatedAt.toString());
    });

    it('records a single UserCreatedEvent on create', () => {
        const events = user.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserCreatedEvent);
        expect(events[0].eventName()).toBe('user.created');
        expect(events[0].aggregateId).toBe(id.toString());
        expect(events[0].body).toEqual(user.toPrimitives());
        expect(user.pullDomainEvents()).toHaveLength(0);
    });

    it('records a UserRolesUpdatedEvent when roles change', () => {
        user.updateRoles([UserRole.ADMIN]);

        const events = user.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserRolesUpdatedEvent);
        expect(events[0].eventName()).toBe('user.roles.updated');
        expect(events[0].aggregateId).toBe(id.toString());
        expect(user.roles).toEqual([UserRole.ADMIN]);
    });
});

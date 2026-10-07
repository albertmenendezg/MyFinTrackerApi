import { describe, expect, it } from 'vitest';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { AuthCredentialCreatedEvent } from '@auth/domain/events/auth-credential-created.event';
import { AuthCredentialRolesUpdatedEvent } from '@auth/domain/events/auth-credential-roles-updated.event';
import { UserId } from '@users/domain/value-objects/user-id';

describe('AuthCredential aggregate', () => {
    const userId = UserId.random();
    const credential = AuthCredential.create(
        userId,
        new AuthCredentialPassword('S3cur3Pass!'),
    );

    it('exposes its value objects', () => {
        expect(credential.userId).toBe(userId);
        expect(credential.password.value).toBe('S3cur3Pass!');
        expect(credential.createdAt).toBeDefined();
        expect(credential.updatedAt).toBeDefined();
        expect(credential.roles).toEqual([AuthCredentialRole.USER]);
    });

    it('serializes to primitives without the password', () => {
        const primitives = credential.toPrimitives();
        expect(primitives.get('id')).toBe(credential.id.toString());
        expect(primitives.get('userId')).toBe(userId.toString());
        expect(primitives.has('password')).toBe(false);
        expect(primitives.get('createdAt')).toBe(
            credential.createdAt.toString(),
        );
        expect(primitives.get('updatedAt')).toBe(
            credential.updatedAt.toString(),
        );
    });

    it('records a single AuthCredentialCreatedEvent on create', () => {
        const events = credential.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(AuthCredentialCreatedEvent);
        expect(events[0].eventName()).toBe('auth_credential.created');
        expect(events[0].aggregateId).toBe(credential.id.toString());
        expect(events[0].body).toEqual(credential.toPrimitives());
        expect(credential.pullDomainEvents()).toHaveLength(0);
    });

    it('records an AuthCredentialRolesUpdatedEvent when roles change', () => {
        credential.updateRoles([AuthCredentialRole.ADMIN]);

        const events = credential.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(AuthCredentialRolesUpdatedEvent);
        expect(events[0].eventName()).toBe('auth_credential.roles.updated');
        expect(events[0].aggregateId).toBe(credential.id.toString());
        expect(credential.roles).toEqual([AuthCredentialRole.ADMIN]);
    });
});

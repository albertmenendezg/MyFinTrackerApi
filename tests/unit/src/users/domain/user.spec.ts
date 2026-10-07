import { describe, expect, it } from 'vitest';
import { Currency } from '@shared/domain/value-objects/currency';
import { User } from '@users/domain/user';
import { UserAddress } from '@users/domain/value-objects/user-address';
import { UserAvatar } from '@users/domain/value-objects/user-avatar';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { UserRole } from '@users/domain/value-objects/user-role';
import { UserCreatedEvent } from '@users/domain/events/user-created.event';
import { UserRolesUpdatedEvent } from '@users/domain/events/user-roles-updated.event';
import { UserUpdatedEvent } from '@users/domain/events/user-updated.event';

describe('User aggregate', () => {
    const id = UserId.random();
    const user = User.create(
        id,
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );

    it('exposes its value objects with an empty profile', () => {
        expect(user.id).toBe(id);
        expect(user.email.value).toBe('john@doe.xyz');
        expect(user.name.value).toBe('John Doe');
        expect(user.avatar).toBeNull();
        expect(user.address).toBeNull();
        expect(user.preferredCurrency.value).toBe('EUR');
        expect(user.roles).toEqual([UserRole.USER]);
        expect(user.createdAt).toBeDefined();
        expect(user.updatedAt).toBeDefined();
    });

    it('serializes to primitives', () => {
        const primitives = user.toPrimitives();
        expect(primitives.get('id')).toBe(id.toString());
        expect(primitives.get('email')).toBe('john@doe.xyz');
        expect(primitives.get('name')).toBe('John Doe');
        expect(primitives.get('avatar')).toBeNull();
        expect(primitives.get('address')).toBeNull();
        expect(primitives.get('preferredCurrency')).toBe('EUR');
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

    it('updates the profile partially and records a UserUpdatedEvent', () => {
        user.updateProfile({
            name: new UserName('Jane Doe'),
            avatar: new UserAvatar('https://example.com/jane.png'),
        });

        expect(user.name.value).toBe('Jane Doe');
        expect(user.avatar?.value).toBe('https://example.com/jane.png');
        expect(user.email.value).toBe('john@doe.xyz');

        const events = user.pullDomainEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
        expect(events[0].eventName()).toBe('user.updated');
        expect(user.pullDomainEvents()).toHaveLength(0);
    });

    it('clears optional fields with null', () => {
        user.updateProfile({ avatar: null, address: null });

        expect(user.avatar).toBeNull();
        expect(user.address).toBeNull();
        expect(user.pullDomainEvents()).toHaveLength(1);
    });

    it('stores a composite address', () => {
        user.updateProfile({
            address: new UserAddress({
                street: 'Calle Mayor 1',
                city: 'Madrid',
                postalCode: '28001',
                country: 'ES',
            }),
        });

        expect(user.address?.toPrimitives()).toEqual({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        });
        expect(user.pullDomainEvents()).toHaveLength(1);
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

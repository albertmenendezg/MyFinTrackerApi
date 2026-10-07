import { describe, expect, it } from 'vitest';
import { Currency } from '@shared/domain/value-objects/currency';
import { User } from '@users/domain/user';
import { UserAddress } from '@users/domain/value-objects/user-address';
import { UserAvatar } from '@users/domain/value-objects/user-avatar';
import { UserCreatedAt } from '@users/domain/value-objects/user-created-at';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { UserRole } from '@users/domain/value-objects/user-role';
import { UserUpdatedAt } from '@users/domain/value-objects/user-updated-at';
import { TypeormUserMapper } from '@users/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';

describe('TypeormUserMapper', () => {
    const mapper = new TypeormUserMapper();
    const user = new User(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new UserAvatar('https://example.com/john.png'),
        new UserAddress({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        }),
        [UserRole.USER, UserRole.ADMIN],
        new Currency('EUR'),
        UserCreatedAt.now(),
        UserUpdatedAt.now(),
    );

    it('maps a domain user to an entity', () => {
        const entity = mapper.toEntity(user);

        expect(entity.id).toBe(user.id.value);
        expect(entity.email).toBe('john@doe.xyz');
        expect(entity.name).toBe('John Doe');
        expect(entity.avatarUrl).toBe('https://example.com/john.png');
        expect(entity.addressStreet).toBe('Calle Mayor 1');
        expect(entity.addressCity).toBe('Madrid');
        expect(entity.addressPostalCode).toBe('28001');
        expect(entity.addressCountry).toBe('ES');
        expect(entity.preferredCurrency).toBe('EUR');
        expect(entity.createdAt).toEqual(user.createdAt.value);
        expect(entity.updatedAt).toEqual(user.updatedAt.value);
        expect(entity.roles).toEqual(['user', 'admin']);
    });

    it('maps missing optional fields to null columns', () => {
        const minimal = User.create(
            UserId.random(),
            new UserEmail('jane@doe.xyz'),
            new UserName('Jane Doe'),
            new Currency('USD'),
        );
        const entity = mapper.toEntity(minimal);

        expect(entity.avatarUrl).toBeNull();
        expect(entity.addressStreet).toBeNull();
        expect(entity.addressCity).toBeNull();
        expect(entity.addressPostalCode).toBeNull();
        expect(entity.addressCountry).toBeNull();
    });

    it('round-trips an entity back to the domain user', () => {
        const entity = mapper.toEntity(user);
        const domain = mapper.toDomain(entity);

        expect(domain.id.value).toBe(user.id.value);
        expect(domain.email.value).toBe('john@doe.xyz');
        expect(domain.name.value).toBe('John Doe');
        expect(domain.avatar?.value).toBe('https://example.com/john.png');
        expect(domain.address?.toPrimitives()).toEqual({
            street: 'Calle Mayor 1',
            city: 'Madrid',
            postalCode: '28001',
            country: 'ES',
        });
        expect(domain.preferredCurrency.value).toBe('EUR');
        expect(domain.roles).toEqual([UserRole.USER, UserRole.ADMIN]);
    });

    it('rehydrates a missing address as null', () => {
        const entity = mapper.toEntity(user);
        entity.addressStreet = null;
        entity.addressCity = null;
        entity.addressPostalCode = null;
        entity.addressCountry = null;

        expect(mapper.toDomain(entity).address).toBeNull();
    });

    it('parses jsonb roles returned as string by typeorm', () => {
        const entity = mapper.toEntity(user);
        entity.roles = JSON.stringify(['user', 'admin']) as any;

        const domain = mapper.toDomain(entity);

        expect(domain.roles).toEqual([UserRole.USER, UserRole.ADMIN]);
    });
});

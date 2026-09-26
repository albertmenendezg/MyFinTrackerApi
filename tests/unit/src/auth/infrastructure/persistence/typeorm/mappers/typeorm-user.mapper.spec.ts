import { describe, expect, it } from 'vitest';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { TypeormUserMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';

describe('TypeormUserMapper', () => {
    const mapper = new TypeormUserMapper();
    const user = User.create(
        UserId.random(),
        new UserEmail('john@doe.xyz'),
        new UserPassword('S3cur3Pass!'),
    );
    const plainPassword = user.password.value;

    it('maps a domain user to an entity', () => {
        const entity = mapper.toEntity(user);

        expect(entity.id).toBe(user.id.value);
        expect(entity.email).toBe('john@doe.xyz');
        expect(entity.password).toBe(plainPassword);
        expect(entity.createdAt).toEqual(user.createdAt.value);
        expect(entity.updatedAt).toEqual(user.updatedAt.value);
    });

    it('round-trips an entity back to the domain user', () => {
        const entity = mapper.toEntity(user);
        const domain = mapper.toDomain(entity);

        expect(domain.id.value).toBe(user.id.value);
        expect(domain.email.value).toBe('john@doe.xyz');
        expect(domain.password.value).toBe(plainPassword);
        expect(domain.createdAt.value.toISOString()).toBe(
            user.createdAt.value.toISOString(),
        );
        expect(domain.updatedAt.value.toISOString()).toBe(
            user.updatedAt.value.toISOString(),
        );
    });
});

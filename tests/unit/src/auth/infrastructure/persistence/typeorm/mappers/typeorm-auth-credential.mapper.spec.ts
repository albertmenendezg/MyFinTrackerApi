import { describe, expect, it } from 'vitest';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { UserId } from '@users/domain/value-objects/user-id';
import { TypeormAuthCredentialMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-auth-credential.mapper';

describe('TypeormAuthCredentialMapper', () => {
    const mapper = new TypeormAuthCredentialMapper();
    const credential = AuthCredential.create(
        UserId.random(),
        new AuthCredentialPassword('S3cur3Pass!'),
    );
    const plainPassword = credential.password.value;

    it('maps a domain credential to an entity', () => {
        const entity = mapper.toEntity(credential);

        expect(entity.id).toBe(credential.id.value);
        expect(entity.user).toEqual({ id: credential.userId.value });
        expect(entity.password).toBe(plainPassword);
        expect(entity.createdAt).toEqual(credential.createdAt.value);
        expect(entity.updatedAt).toEqual(credential.updatedAt.value);
        expect(entity.roles).toEqual(['user']);
    });

    it('round-trips an entity back to the domain credential', () => {
        const entity = mapper.toEntity(credential);
        const domain = mapper.toDomain(entity);

        expect(domain.id.value).toBe(credential.id.value);
        expect(domain.userId.value).toBe(credential.userId.value);
        expect(domain.password.value).toBe(plainPassword);
        expect(domain.createdAt.value.toISOString()).toBe(
            credential.createdAt.value.toISOString(),
        );
        expect(domain.updatedAt.value.toISOString()).toBe(
            credential.updatedAt.value.toISOString(),
        );
        expect(domain.roles).toEqual([AuthCredentialRole.USER]);
    });

    it('parses jsonb roles returned as string by typeorm', () => {
        const entity = mapper.toEntity(credential);
        entity.roles = JSON.stringify(['user']) as any;

        const domain = mapper.toDomain(entity);

        expect(domain.roles).toEqual([AuthCredentialRole.USER]);
    });
});

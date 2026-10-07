import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialCreatedAt } from '@auth/domain/value-objects/auth-credential-created-at';
import { AuthCredentialId } from '@auth/domain/value-objects/auth-credential-id';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { AuthCredentialUpdatedAt } from '@auth/domain/value-objects/auth-credential-updated-at';
import { UserId } from '@users/domain/value-objects/user-id';
import { AuthCredentialEntity } from '@auth/infrastructure/persistence/typeorm/entities/auth-credential.entity';
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';

export class TypeormAuthCredentialMapper {
    toEntity(credential: AuthCredential): AuthCredentialEntity {
        const entity = new AuthCredentialEntity();
        entity.id = credential.id.value;
        entity.user = { id: credential.userId.value } as UserEntity;
        entity.password = credential.password.value;
        entity.createdAt = credential.createdAt.value;
        entity.updatedAt = credential.updatedAt.value;
        entity.roles = credential.roles.map((r) => r.value);
        return entity;
    }

    toDomain(entity: AuthCredentialEntity): AuthCredential {
        const rawRoles =
            typeof entity.roles === 'string'
                ? JSON.parse(entity.roles)
                : entity.roles;
        return new AuthCredential(
            new AuthCredentialId(entity.id),
            new UserId(entity.user.id),
            new AuthCredentialPassword(entity.password),
            new AuthCredentialCreatedAt(entity.createdAt),
            new AuthCredentialUpdatedAt(entity.updatedAt),
            rawRoles.map((r: string) => new AuthCredentialRole(r)),
        );
    }
}

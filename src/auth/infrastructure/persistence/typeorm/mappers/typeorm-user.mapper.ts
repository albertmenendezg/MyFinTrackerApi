import { User } from '@auth/domain/user';
import { UserCreatedAt } from '@auth/domain/value-objects/user-created-at';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserUpdatedAt } from '@auth/domain/value-objects/user-updated-at';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';

export class TypeormUserMapper {
    toEntity(user: User): UserEntity {
        const entity = new UserEntity();
        entity.id = user.id.value;
        entity.email = user.email.value;
        entity.password = user.password.value;
        entity.createdAt = user.createdAt.value;
        entity.updatedAt = user.updatedAt.value;
        return entity;
    }

    toDomain(entity: UserEntity): User {
        return new User(
            new UserId(entity.id),
            new UserEmail(entity.email),
            new UserPassword(entity.password),
            new UserCreatedAt(entity.createdAt),
            new UserUpdatedAt(entity.updatedAt),
        );
    }
}

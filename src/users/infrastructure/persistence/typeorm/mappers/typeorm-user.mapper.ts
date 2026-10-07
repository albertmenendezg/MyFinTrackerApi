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
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';

export class TypeormUserMapper {
    toEntity(user: User): UserEntity {
        const entity = new UserEntity();
        entity.id = user.id.value;
        entity.email = user.email.value;
        entity.name = user.name.value;
        entity.avatarUrl = user.avatar ? user.avatar.value : null;
        entity.addressStreet = user.address ? user.address.street : null;
        entity.addressCity = user.address ? user.address.city : null;
        entity.addressPostalCode = user.address
            ? user.address.postalCode
            : null;
        entity.addressCountry = user.address ? user.address.country : null;
        entity.preferredCurrency = user.preferredCurrency.value;
        entity.createdAt = user.createdAt.value;
        entity.updatedAt = user.updatedAt.value;
        entity.roles = user.roles.map((r) => r.value);
        return entity;
    }

    toDomain(entity: UserEntity): User {
        const rawRoles =
            typeof entity.roles === 'string'
                ? JSON.parse(entity.roles)
                : entity.roles;
        return new User(
            new UserId(entity.id),
            new UserEmail(entity.email),
            new UserName(entity.name),
            entity.avatarUrl ? new UserAvatar(entity.avatarUrl) : null,
            this.toAddress(entity),
            rawRoles.map((r: string) => new UserRole(r)),
            new Currency(entity.preferredCurrency),
            new UserCreatedAt(entity.createdAt),
            new UserUpdatedAt(entity.updatedAt),
        );
    }

    private toAddress(entity: UserEntity): UserAddress | null {
        const {
            addressStreet,
            addressCity,
            addressPostalCode,
            addressCountry,
        } = entity;

        if (
            !addressStreet ||
            !addressCity ||
            !addressPostalCode ||
            !addressCountry
        ) {
            return null;
        }

        return new UserAddress({
            street: addressStreet,
            city: addressCity,
            postalCode: addressPostalCode,
            country: addressCountry,
        });
    }
}

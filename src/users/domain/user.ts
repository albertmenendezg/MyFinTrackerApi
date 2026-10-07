import { AggregateRoot } from '@shared/domain/aggregate-root';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserAddress } from '@users/domain/value-objects/user-address';
import { UserAvatar } from '@users/domain/value-objects/user-avatar';
import { UserCreatedAt } from '@users/domain/value-objects/user-created-at';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { UserRole } from '@users/domain/value-objects/user-role';
import { UserUpdatedAt } from '@users/domain/value-objects/user-updated-at';
import { UserCreatedEvent } from '@users/domain/events/user-created.event';
import { UserRolesUpdatedEvent } from '@users/domain/events/user-roles-updated.event';
import { UserUpdatedEvent } from '@users/domain/events/user-updated.event';

export interface UserProfilePatch {
    email?: UserEmail;
    name?: UserName;
    avatar?: UserAvatar | null;
    address?: UserAddress | null;
    preferredCurrency?: Currency;
}

export class User extends AggregateRoot {
    private readonly _id: UserId;
    private _email: UserEmail;
    private _name: UserName;
    private _avatar: UserAvatar | null;
    private _address: UserAddress | null;
    private _preferredCurrency: Currency;
    private _roles: UserRole[];
    private readonly _createdAt: UserCreatedAt;
    private _updatedAt: UserUpdatedAt;

    constructor(
        id: UserId,
        email: UserEmail,
        name: UserName,
        avatar: UserAvatar | null,
        address: UserAddress | null,
        roles: UserRole[],
        preferredCurrency: Currency,
        createdAt: UserCreatedAt,
        updatedAt: UserUpdatedAt,
    ) {
        super();
        this._id = id;
        this._email = email;
        this._name = name;
        this._avatar = avatar;
        this._address = address;
        this._roles = roles;
        this._preferredCurrency = preferredCurrency;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
    }

    toPrimitives(): Map<string, any> {
        return new Map<string, any>([
            ['id', this.id.toString()],
            ['email', this.email.toString()],
            ['name', this.name.toString()],
            ['avatar', this.avatar ? this.avatar.toString() : null],
            ['address', this.address ? this.address.toPrimitives() : null],
            ['preferredCurrency', this.preferredCurrency.toString()],
            ['roles', this.roles.map((r) => r.toString())],
            ['createdAt', this.createdAt.toString()],
            ['updatedAt', this.updatedAt.toString()],
        ]);
    }

    public static create(
        id: UserId,
        email: UserEmail,
        name: UserName,
        preferredCurrency: Currency,
        avatar: UserAvatar | null = null,
        address: UserAddress | null = null,
    ): User {
        const user = new User(
            id,
            email,
            name,
            avatar,
            address,
            [UserRole.USER],
            preferredCurrency,
            UserCreatedAt.now(),
            UserUpdatedAt.now(),
        );

        user.record(new UserCreatedEvent(id.toString(), user.toPrimitives()));

        return user;
    }

    public updateProfile(patch: UserProfilePatch): void {
        const { email, name, avatar, address, preferredCurrency } = patch;

        if (email !== undefined) {
            this._email = email;
        }

        if (name !== undefined) {
            this._name = name;
        }

        if (avatar !== undefined) {
            this._avatar = avatar;
        }

        if (address !== undefined) {
            this._address = address;
        }

        if (preferredCurrency !== undefined) {
            this._preferredCurrency = preferredCurrency;
        }

        this._updatedAt = UserUpdatedAt.now();

        this.record(
            new UserUpdatedEvent(this._id.toString(), this.toPrimitives()),
        );
    }

    get id(): UserId {
        return this._id;
    }

    get email(): UserEmail {
        return this._email;
    }

    get name(): UserName {
        return this._name;
    }

    get avatar(): UserAvatar | null {
        return this._avatar;
    }

    get address(): UserAddress | null {
        return this._address;
    }

    get preferredCurrency(): Currency {
        return this._preferredCurrency;
    }

    get roles(): UserRole[] {
        return this._roles;
    }

    public updateRoles(roles: UserRole[]): void {
        this._roles = roles;
        this._updatedAt = UserUpdatedAt.now();

        this.record(
            new UserRolesUpdatedEvent(this._id.toString(), this.toPrimitives()),
        );
    }

    get createdAt(): UserCreatedAt {
        return this._createdAt;
    }

    get updatedAt(): UserUpdatedAt {
        return this._updatedAt;
    }
}

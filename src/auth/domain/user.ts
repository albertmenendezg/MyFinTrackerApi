import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserUpdatedAt } from '@auth/domain/value-objects/user-updated-at';
import { UserCreatedAt } from '@auth/domain/value-objects/user-created-at';
import { AggregateRoot } from '@shared/shared/domain/aggregate-root';
import { UserCreatedEvent } from '@auth/domain/events/user-created.event';

export class User extends AggregateRoot {
    private readonly _id: UserId;
    private readonly _email: UserEmail;
    private readonly _password: UserPassword;
    private readonly _updatedAt: UserUpdatedAt;
    private readonly _createdAt: UserCreatedAt;

    constructor(
        id: UserId,
        email: UserEmail,
        password: UserPassword,
        createdAt: UserCreatedAt,
        updatedAt: UserUpdatedAt,
    ) {
        super();
        this._id = id;
        this._email = email;
        this._password = password;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
    }

    toPrimitives(): Map<string, any> {
        return new Map<string, any>([
            ['id', this.id.toString()],
            ['email', this.email.toString()],
            ['password', this.password.toString()],
            ['createdAt', this.createdAt.toString()],
            ['updatedAt', this.updatedAt.toString()],
        ]);
    }

    public static create(
        id: UserId,
        email: UserEmail,
        password: UserPassword,
    ): User {
        const user = new User(
            id,
            email,
            password,
            UserCreatedAt.now(),
            UserUpdatedAt.now(),
        );

        user.record(new UserCreatedEvent(id.toString(), user.toPrimitives()));

        return user;
    }

    get id(): UserId {
        return this._id;
    }

    get email(): UserEmail {
        return this._email;
    }

    get password(): UserPassword {
        return this._password;
    }

    get updatedAt(): UserUpdatedAt {
        return this._updatedAt;
    }

    get createdAt(): UserCreatedAt {
        return this._createdAt;
    }
}

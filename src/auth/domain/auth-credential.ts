import { AggregateRoot } from '@shared/domain/aggregate-root';
import { UserId } from '@users/domain/value-objects/user-id';
import { AuthCredentialCreatedAt } from '@auth/domain/value-objects/auth-credential-created-at';
import { AuthCredentialId } from '@auth/domain/value-objects/auth-credential-id';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { AuthCredentialUpdatedAt } from '@auth/domain/value-objects/auth-credential-updated-at';
import { AuthCredentialCreatedEvent } from '@auth/domain/events/auth-credential-created.event';
import { AuthCredentialRolesUpdatedEvent } from '@auth/domain/events/auth-credential-roles-updated.event';

export class AuthCredential extends AggregateRoot {
    private readonly _id: AuthCredentialId;
    private readonly _userId: UserId;
    private readonly _password: AuthCredentialPassword;
    private _roles: AuthCredentialRole[];
    private readonly _updatedAt: AuthCredentialUpdatedAt;
    private readonly _createdAt: AuthCredentialCreatedAt;

    constructor(
        id: AuthCredentialId,
        userId: UserId,
        password: AuthCredentialPassword,
        createdAt: AuthCredentialCreatedAt,
        updatedAt: AuthCredentialUpdatedAt,
        roles: AuthCredentialRole[] = [AuthCredentialRole.USER],
    ) {
        super();
        this._id = id;
        this._userId = userId;
        this._password = password;
        this._roles = roles;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
    }

    toPrimitives(): Map<string, any> {
        return new Map<string, any>([
            ['id', this.id.toString()],
            ['userId', this.userId.toString()],
            ['roles', this.roles.map((r) => r.toString())],
            ['createdAt', this.createdAt.toString()],
            ['updatedAt', this.updatedAt.toString()],
        ]);
    }

    public static create(
        userId: UserId,
        password: AuthCredentialPassword,
    ): AuthCredential {
        const credential = new AuthCredential(
            AuthCredentialId.random(),
            userId,
            password,
            AuthCredentialCreatedAt.now(),
            AuthCredentialUpdatedAt.now(),
        );

        credential.record(
            new AuthCredentialCreatedEvent(
                credential.id.toString(),
                credential.toPrimitives(),
            ),
        );

        return credential;
    }

    get id(): AuthCredentialId {
        return this._id;
    }

    get userId(): UserId {
        return this._userId;
    }

    get password(): AuthCredentialPassword {
        return this._password;
    }

    get updatedAt(): AuthCredentialUpdatedAt {
        return this._updatedAt;
    }

    get createdAt(): AuthCredentialCreatedAt {
        return this._createdAt;
    }

    get roles(): AuthCredentialRole[] {
        return this._roles;
    }

    public updateRoles(roles: AuthCredentialRole[]): void {
        this._roles = roles;
        this.record(
            new AuthCredentialRolesUpdatedEvent(
                this._id.value,
                this.toPrimitives(),
            ),
        );
    }
}

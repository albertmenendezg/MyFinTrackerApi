import { InvalidUserRolesException } from '@auth/domain/exceptions/invalid-user-roles.exception';

export enum UserRoleValues {
    ADMIN = 'admin',
    USER = 'user',
}

export class UserRole {
    public static readonly DEFAULT = new UserRole(UserRoleValues.USER);
    public static readonly USER = new UserRole(UserRoleValues.USER);
    public static readonly ADMIN = new UserRole(UserRoleValues.ADMIN);

    private readonly _value: string;

    constructor(value: string) {
        this.validateRoles(value);
        this._value = value;
    }

    private validateRoles(value: string) {
        if (!Object.values(UserRoleValues).includes(value as UserRoleValues)) {
            throw new InvalidUserRolesException(value);
        }
    }

    get value(): string {
        return this._value;
    }

    public toString(): string {
        return this.value;
    }
}

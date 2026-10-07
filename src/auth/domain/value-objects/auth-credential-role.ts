import { InvalidAuthCredentialRole } from '@auth/domain/exceptions/invalid-auth-credential-role';

export enum AuthCredentialRoleValues {
    ADMIN = 'admin',
    USER = 'user',
}

export class AuthCredentialRole {
    public static readonly DEFAULT = new AuthCredentialRole(
        AuthCredentialRoleValues.USER,
    );
    public static readonly USER = new AuthCredentialRole(
        AuthCredentialRoleValues.USER,
    );
    public static readonly ADMIN = new AuthCredentialRole(
        AuthCredentialRoleValues.ADMIN,
    );

    private readonly _value: string;

    constructor(value: string) {
        this.validateRoles(value);
        this._value = value;
    }

    private validateRoles(value: string) {
        if (
            !Object.values(AuthCredentialRoleValues).includes(
                value as AuthCredentialRoleValues,
            )
        ) {
            throw new InvalidAuthCredentialRole(value);
        }
    }

    get value(): string {
        return this._value;
    }

    public toString(): string {
        return this.value;
    }
}

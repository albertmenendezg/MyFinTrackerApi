import { UserId } from '@users/domain/value-objects/user-id';
import { AuthCredential } from '@auth/domain/auth-credential';

export const AUTH_CREDENTIAL_REPOSITORY = 'auth-credential-repository';

export interface AuthCredentialRepository {
    save(credential: AuthCredential): Promise<void>;
    findByUserId(userId: UserId): Promise<AuthCredential | null>;
}

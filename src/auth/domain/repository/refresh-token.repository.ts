import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';

export const REFRESH_TOKEN_REPOSITORY = 'refresh-token-repository';

export interface RefreshTokenRepository {
    save(refreshToken: RefreshToken): Promise<void>;
    findByTokenHash(tokenHash: RefreshTokenHash): Promise<RefreshToken | null>;
}

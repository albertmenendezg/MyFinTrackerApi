import { AuthCredential } from '@auth/domain/auth-credential';

export const TOKEN_SERVICE: string = 'token-service';

export const ACCESS_TOKEN_TYPE = 'access';
export const REFRESH_TOKEN_TYPE = 'refresh';

export interface AccessTokenPayload {
    sub: string;
    type: typeof ACCESS_TOKEN_TYPE;
}

export interface RefreshTokenPayload {
    sub: string;
    jti: string;
    type: typeof REFRESH_TOKEN_TYPE;
}

export interface AccessTokenData {
    token: string;
    expiresIn: number;
}

export interface RefreshTokenData {
    token: string;
    expiresIn: number;
}

export interface TokenService {
    signAccessToken(credential: AuthCredential): Promise<AccessTokenData>;
    signRefreshToken(credential: AuthCredential): Promise<RefreshTokenData>;
    verifyRefreshToken(token: string): RefreshTokenPayload | null;
}

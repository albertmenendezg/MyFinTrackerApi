import { User } from '@auth/domain/user';

export const TOKEN_SERVICE: string = 'token-service';

export const ACCESS_TOKEN_TYPE = 'access';
export const REFRESH_TOKEN_TYPE = 'refresh';

export interface AccessTokenPayload {
    sub: string;
    email: string;
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
    signAccessToken(user: User): Promise<AccessTokenData>;
    signRefreshToken(user: User): Promise<RefreshTokenData>;
    verifyRefreshToken(token: string): RefreshTokenPayload | null;
}

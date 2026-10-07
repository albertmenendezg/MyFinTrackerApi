import {
    AccessTokenData,
    RefreshTokenData,
} from '@auth/domain/services/token.service';

export class IssuedTokens {
    constructor(
        public readonly accessToken: AccessTokenData,
        public readonly refreshToken: RefreshTokenData,
    ) {}
}

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthCredential } from '@auth/domain/auth-credential';
import { Identifier } from '@shared/domain/value-objects/identifier';
import {
    ACCESS_TOKEN_TYPE,
    AccessTokenData,
    AccessTokenPayload,
    REFRESH_TOKEN_TYPE,
    RefreshTokenData,
    RefreshTokenPayload,
    TokenService,
} from '@auth/domain/services/token.service';

@Injectable()
export class JwtTokenService implements TokenService {
    constructor(
        @Inject(JwtService)
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    async signAccessToken(
        credential: AuthCredential,
    ): Promise<AccessTokenData> {
        const payload: AccessTokenPayload = {
            sub: credential.userId.toString(),
            type: ACCESS_TOKEN_TYPE,
        };

        const token = await this.jwtService.signAsync(payload, {
            secret: this.secret,
            expiresIn: this.expiresIn,
        });

        return { token, expiresIn: this.expiresIn };
    }

    async signRefreshToken(
        credential: AuthCredential,
    ): Promise<RefreshTokenData> {
        const payload: RefreshTokenPayload = {
            sub: credential.userId.toString(),
            jti: Identifier.random().toString(),
            type: REFRESH_TOKEN_TYPE,
        };

        const token = await this.jwtService.signAsync(payload, {
            secret: this.refreshSecret,
            expiresIn: this.refreshExpiresIn,
        });

        return { token, expiresIn: this.refreshExpiresIn };
    }

    verifyRefreshToken(token: string): RefreshTokenPayload | null {
        try {
            const payload = this.jwtService.verify<RefreshTokenPayload>(token, {
                secret: this.refreshSecret,
            });

            if (payload.type !== REFRESH_TOKEN_TYPE) {
                return null;
            }

            return payload;
        } catch {
            return null;
        }
    }

    private get secret(): string {
        return this.config.getOrThrow<string>('auth.jwt.secret');
    }

    private get refreshSecret(): string {
        return this.config.getOrThrow<string>('auth.jwt.refreshSecret');
    }

    private get expiresIn(): number {
        return this.config.getOrThrow<number>('auth.jwt.expiresIn');
    }

    private get refreshExpiresIn(): number {
        return this.config.getOrThrow<number>('auth.jwt.refreshExpiresIn');
    }
}

import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
    ACCESS_TOKEN_TYPE,
    AccessTokenPayload,
} from '@auth/domain/services/token.service';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';
import {
    AUTH_CREDENTIAL_REPOSITORY,
    AuthCredentialRepository,
} from '@auth/domain/repository/auth-credential.repository';
import { UserId } from '@users/domain/value-objects/user-id';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        @Inject(AUTH_CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: AuthCredentialRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
    ) {
        const cookieName = config.getOrThrow<string>(
            'auth.cookies.access.name',
        );

        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request: Request) => request?.cookies?.[cookieName],
                ExtractJwt.fromAuthHeaderAsBearerToken(),
            ]),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('auth.jwt.secret'),
        });
    }

    async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
        const { type, sub } = payload;

        if (type !== ACCESS_TOKEN_TYPE) {
            throw new UnauthorizedException('Invalid access token');
        }

        const credential = await this.credentialRepository.findByUserId(
            new UserId(sub),
        );
        if (!credential) {
            throw new UnauthorizedException('Missing access token');
        }

        const user = await this.userRepository.findById(new UserId(sub));
        if (!user) {
            throw new UnauthorizedException('Missing access token');
        }

        return {
            id: sub,
            email: user.email.toString(),
            roles: credential.roles.map((r) => r.toString()),
        };
    }
}

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
import { USER_REPOSITORY } from '@auth/domain/repository/user.repository';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { UserId } from '@auth/domain/value-objects/user-id';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
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
        const { type, sub, email } = payload;

        if (type !== ACCESS_TOKEN_TYPE) {
            throw new UnauthorizedException('Invalid access token');
        }

        const user = await this.userRepository.findById(new UserId(sub));
        if (!user) {
            throw new UnauthorizedException('Missing access token');
        }

        return {
            id: sub,
            email: email ?? user.email.toString(),
            roles: user.roles.map((r) => r.toString()),
        };
    }
}

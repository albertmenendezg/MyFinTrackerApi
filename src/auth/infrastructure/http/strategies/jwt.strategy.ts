import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
    ACCESS_TOKEN_TYPE,
    AccessTokenPayload,
} from '@auth/domain/services/token.service';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
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

    validate(payload: AccessTokenPayload): AuthenticatedUser {
        const { type, sub, email } = payload;

        if (type !== ACCESS_TOKEN_TYPE) {
            throw new UnauthorizedException('Invalid access token');
        }

        return { id: sub, email };
    }
}

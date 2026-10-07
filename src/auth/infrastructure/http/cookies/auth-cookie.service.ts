import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';
import {
    AccessTokenData,
    RefreshTokenData,
} from '@auth/domain/services/token.service';

const ACCESS_COOKIE_PATH = '/';
const REFRESH_COOKIE_PATH = '/auth';

@Injectable()
export class AuthCookieService {
    constructor(private readonly config: ConfigService) {}

    setAccessToken(response: Response, accessToken: AccessTokenData): void {
        response.cookie(
            this.accessName,
            accessToken.token,
            this.toCookieOptions(ACCESS_COOKIE_PATH, accessToken.expiresIn),
        );
    }

    setRefreshToken(response: Response, refreshToken: RefreshTokenData): void {
        response.cookie(
            this.refreshName,
            refreshToken.token,
            this.toCookieOptions(REFRESH_COOKIE_PATH, refreshToken.expiresIn),
        );
    }

    readRefreshToken(request: Request): string | null {
        const token = request.cookies?.[this.refreshName];
        return typeof token === 'string' && token.length > 0 ? token : null;
    }

    clear(response: Response): void {
        response.clearCookie(
            this.accessName,
            this.toCookieOptions(ACCESS_COOKIE_PATH),
        );
        response.clearCookie(
            this.refreshName,
            this.toCookieOptions(REFRESH_COOKIE_PATH),
        );
    }

    private toCookieOptions(path: string, expiresIn?: number): CookieOptions {
        return {
            httpOnly: true,
            path,
            sameSite: 'lax',
            secure: false,
            ...(expiresIn === undefined ? {} : { maxAge: expiresIn * 1000 }),
        };
    }

    private get accessName(): string {
        return this.config.getOrThrow<string>('auth.cookies.access.name');
    }

    private get refreshName(): string {
        return this.config.getOrThrow<string>('auth.cookies.refresh.name');
    }
}

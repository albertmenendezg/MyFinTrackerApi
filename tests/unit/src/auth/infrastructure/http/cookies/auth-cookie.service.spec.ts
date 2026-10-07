import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthCookieService } from '@auth/infrastructure/http/cookies/auth-cookie.service';

function createService(
    accessName = 'access_token',
    refreshName = 'refresh_token',
): AuthCookieService {
    const settings: Record<string, string> = {
        'auth.cookies.access.name': accessName,
        'auth.cookies.refresh.name': refreshName,
    };
    const config = {
        getOrThrow: (key: string) => {
            if (!(key in settings)) {
                throw new Error(`Unexpected key ${key}`);
            }
            return settings[key];
        },
    } as unknown as ConfigService;
    return new AuthCookieService(config);
}

function createResponse(): Response {
    return {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
    } as unknown as Response;
}

describe('AuthCookieService', () => {
    it('sets an httpOnly access cookie scoped to the whole api', () => {
        const response = createResponse();

        createService().setAccessToken(response, {
            token: 'jwt',
            expiresIn: 900,
        });

        expect(response.cookie).toHaveBeenCalledWith('access_token', 'jwt', {
            httpOnly: true,
            path: '/',
            sameSite: 'lax',
            secure: false,
            maxAge: 900000,
        });
    });

    it('scopes the refresh cookie to the auth routes only', () => {
        const response = createResponse();

        createService().setRefreshToken(response, {
            token: 'jwt',
            expiresIn: 604800,
        });

        expect(response.cookie).toHaveBeenCalledWith('refresh_token', 'jwt', {
            httpOnly: true,
            path: '/auth',
            sameSite: 'lax',
            secure: false,
            maxAge: 604800000,
        });
    });

    it('honours the configured cookie names', () => {
        const response = createResponse();
        const service = createService('at', 'rt');

        service.setAccessToken(response, { token: 'jwt', expiresIn: 900 });
        service.setRefreshToken(response, { token: 'jwt', expiresIn: 604800 });

        expect(response.cookie).toHaveBeenCalledWith(
            'at',
            'jwt',
            expect.anything(),
        );
        expect(response.cookie).toHaveBeenCalledWith(
            'rt',
            'jwt',
            expect.anything(),
        );
    });

    it('reads the refresh token from the cookie jar', () => {
        const request = {
            cookies: { access_token: 'jwt', refresh_token: 'refresh-jwt' },
        } as unknown as Request;

        expect(createService().readRefreshToken(request)).toBe('refresh-jwt');
    });

    it('returns null when the refresh cookie is absent', () => {
        const request = {
            cookies: { access_token: 'jwt' },
        } as unknown as Request;

        expect(createService().readRefreshToken(request)).toBeNull();
    });

    it('returns null when the request carries no cookies at all', () => {
        expect(createService().readRefreshToken({} as Request)).toBeNull();
    });

    it('returns null when the refresh cookie is empty', () => {
        const request = {
            cookies: { refresh_token: '' },
        } as unknown as Request;

        expect(createService().readRefreshToken(request)).toBeNull();
    });

    it('clears both cookies repeating their original options', () => {
        const response = createResponse();

        createService().clear(response);

        expect(response.clearCookie).toHaveBeenCalledTimes(2);
        expect(response.clearCookie).toHaveBeenCalledWith(
            'access_token',
            expect.objectContaining({ path: '/', httpOnly: true }),
        );
        expect(response.clearCookie).toHaveBeenCalledWith(
            'refresh_token',
            expect.objectContaining({ path: '/auth', httpOnly: true }),
        );
    });

    it('does not set a maxAge when clearing, otherwise the cookie survives', () => {
        const response = createResponse();

        createService().clear(response);

        expect(response.clearCookie).toHaveBeenCalledWith(
            'access_token',
            expect.not.objectContaining({ maxAge: expect.anything() }),
        );
    });
});

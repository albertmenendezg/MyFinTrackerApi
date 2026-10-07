import { afterEach, describe, expect, it, vi } from 'vitest';
import authConfig from '@auth/infrastructure/config/auth.config';

const SECRET = 'a'.repeat(32);
const OTHER_SECRET = 'b'.repeat(40);

const AUTH_VARS = [
    'BCRYPT_ROUNDS',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_SECRET',
    'JWT_REFRESH_EXPIRES_IN',
    'JWT_COOKIE_NAME',
    'JWT_REFRESH_COOKIE_NAME',
];

function stubAuthEnv(vars: Record<string, string | undefined>): void {
    for (const name of AUTH_VARS) {
        vi.stubEnv(name, vars[name]);
    }
}

function load(): ReturnType<typeof authConfig> {
    return authConfig();
}

describe('authConfig', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('maps the defaults when only the required vars are present', () => {
        stubAuthEnv({ JWT_SECRET: SECRET, BCRYPT_ROUNDS: '4' });

        const config = load();

        expect(config.bcrypt).toEqual({ rounds: 4 });
        expect(config.jwt.secret).toBe(SECRET);
        expect(config.jwt.expiresIn).toBe(900);
        expect(config.jwt.refreshExpiresIn).toBe(604800);
        expect(config.cookies).toEqual({
            access: { name: 'access_token' },
            refresh: { name: 'refresh_token' },
        });
    });

    it('falls back to the access secret when no refresh secret is given', () => {
        stubAuthEnv({ JWT_SECRET: SECRET, BCRYPT_ROUNDS: '4' });

        expect(load().jwt.refreshSecret).toBe(SECRET);
    });

    it('keeps a distinct refresh secret when given', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            JWT_REFRESH_SECRET: OTHER_SECRET,
            BCRYPT_ROUNDS: '4',
        });

        expect(load().jwt.refreshSecret).toBe(OTHER_SECRET);
    });

    it('parses human friendly durations into seconds', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            BCRYPT_ROUNDS: '4',
            JWT_EXPIRES_IN: '2h',
            JWT_REFRESH_EXPIRES_IN: '30d',
        });

        const { jwt } = load();

        expect(jwt.expiresIn).toBe(7200);
        expect(jwt.refreshExpiresIn).toBe(2592000);
    });

    it('treats a bare number as seconds', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            BCRYPT_ROUNDS: '4',
            JWT_EXPIRES_IN: '45',
        });

        expect(load().jwt.expiresIn).toBe(45);
    });

    it('maps the cookie name overrides on both cookies', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            BCRYPT_ROUNDS: '4',
            JWT_COOKIE_NAME: 'at',
            JWT_REFRESH_COOKIE_NAME: 'rt',
        });

        expect(load().cookies).toEqual({
            access: { name: 'at' },
            refresh: { name: 'rt' },
        });
    });

    it('fails when the access secret is missing', () => {
        stubAuthEnv({ BCRYPT_ROUNDS: '4' });

        expect(() => load()).toThrow(
            /Auth environment validation failed: JWT_SECRET/,
        );
    });

    it('fails when the access secret is too short', () => {
        stubAuthEnv({ JWT_SECRET: 'too-short', BCRYPT_ROUNDS: '4' });

        expect(() => load()).toThrow(/at least 32 characters long/);
    });

    it('fails when a duration is not parseable', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            BCRYPT_ROUNDS: '4',
            JWT_EXPIRES_IN: 'forever',
        });

        expect(() => load()).toThrow(
            /JWT_EXPIRES_IN: must be a duration in seconds/,
        );
    });

    it('fails when the refresh secret is too short', () => {
        stubAuthEnv({
            JWT_SECRET: SECRET,
            BCRYPT_ROUNDS: '4',
            JWT_REFRESH_SECRET: 'short',
        });

        expect(() => load()).toThrow(/JWT_REFRESH_SECRET/);
    });
});

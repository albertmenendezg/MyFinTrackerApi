import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '@auth/infrastructure/http/strategies/jwt.strategy';

const SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'b'.repeat(40);

const SETTINGS: Record<string, string> = {
    'auth.jwt.secret': SECRET,
    'auth.jwt.refreshSecret': REFRESH_SECRET,
    'auth.cookies.access.name': 'access_token',
};

function createConfigService(): ConfigService {
    return {
        getOrThrow: (key: string) => {
            if (!(key in SETTINGS)) {
                throw new Error(`Unexpected key ${key}`);
            }
            return SETTINGS[key];
        },
    } as unknown as ConfigService;
}

describe('JwtStrategy', () => {
    it('maps a valid access payload to the authenticated user', () => {
        const strategy = new JwtStrategy(createConfigService());

        expect(
            strategy.validate({
                sub: 'user-id',
                email: 'john@doe.xyz',
                type: 'access',
            }),
        ).toEqual({ id: 'user-id', email: 'john@doe.xyz' });
    });

    it('rejects a payload whose type is not access', () => {
        const strategy = new JwtStrategy(createConfigService());

        expect(() =>
            strategy.validate({
                sub: 'user-id',
                email: 'john@doe.xyz',
                type: 'refresh',
            } as never),
        ).toThrow(UnauthorizedException);
    });
});

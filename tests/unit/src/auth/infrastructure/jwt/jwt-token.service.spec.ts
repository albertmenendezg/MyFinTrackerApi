import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtTokenService } from '@auth/infrastructure/jwt/jwt-token.service';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { UserId } from '@users/domain/value-objects/user-id';

const SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'b'.repeat(40);

const SETTINGS: Record<string, number | string> = {
    'auth.jwt.secret': SECRET,
    'auth.jwt.refreshSecret': REFRESH_SECRET,
    'auth.jwt.expiresIn': 900,
    'auth.jwt.refreshExpiresIn': 604800,
};

function createService(): {
    service: JwtTokenService;
    jwtService: JwtService;
} {
    const config = {
        getOrThrow: (key: string) => {
            if (!(key in SETTINGS)) {
                throw new Error(`Unexpected key ${key}`);
            }
            return SETTINGS[key];
        },
    } as unknown as ConfigService;
    const jwtService = new JwtService();
    return { service: new JwtTokenService(jwtService, config), jwtService };
}

const credential = AuthCredential.create(
    UserId.random(),
    new AuthCredentialPassword('hashed-password'),
);

describe('JwtTokenService', () => {
    it('signs an access token carrying the identity and its type', async () => {
        const { service, jwtService } = createService();

        const { token, expiresIn } = await service.signAccessToken(credential);
        const payload = jwtService.verify(token, { secret: SECRET });

        expect(expiresIn).toBe(900);
        expect(payload).toMatchObject({
            sub: credential.userId.toString(),
            type: 'access',
        });
        expect(payload).not.toHaveProperty('email');
    });

    it('gives the access token a finite expiry', async () => {
        const { service, jwtService } = createService();

        const { token } = await service.signAccessToken(credential);
        const { exp, iat } = jwtService.verify(token, { secret: SECRET });

        expect((exp as number) - (iat as number)).toBe(900);
    });

    it('signs a refresh token with a jti and no email claim', async () => {
        const { service, jwtService } = createService();

        const { token, expiresIn } = await service.signRefreshToken(credential);
        const payload = jwtService.verify(token, { secret: REFRESH_SECRET });

        expect(expiresIn).toBe(604800);
        expect(payload.sub).toBe(credential.userId.toString());
        expect(payload.type).toBe('refresh');
        expect(payload.jti).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(payload).not.toHaveProperty('email');
    });

    it('gives each refresh token its own jti', async () => {
        const { service, jwtService } = createService();

        const first = await service.signRefreshToken(credential);
        const second = await service.signRefreshToken(credential);

        expect(
            jwtService.verify(first.token, { secret: REFRESH_SECRET }).jti,
        ).not.toBe(
            jwtService.verify(second.token, { secret: REFRESH_SECRET }).jti,
        );
    });

    it('does not let an access token verify as a refresh token', async () => {
        const { service } = createService();
        const { token } = await service.signAccessToken(credential);

        expect(service.verifyRefreshToken(token)).toBeNull();
    });

    it('rejects a refresh token signed with another secret', async () => {
        const { service, jwtService } = createService();
        const foreign = jwtService.sign(
            { sub: credential.userId.toString(), jti: 'jti', type: 'refresh' },
            { secret: 'c'.repeat(32), expiresIn: 900 },
        );

        expect(service.verifyRefreshToken(foreign)).toBeNull();
    });

    it('rejects a token that is not a jwt', async () => {
        const { service } = createService();

        expect(service.verifyRefreshToken('not-a-token')).toBeNull();
    });

    it('rejects an expired refresh token', async () => {
        const { service, jwtService } = createService();
        const expired = jwtService.sign(
            { sub: credential.userId.toString(), jti: 'jti', type: 'refresh' },
            { secret: REFRESH_SECRET, expiresIn: -10 },
        );

        expect(service.verifyRefreshToken(expired)).toBeNull();
    });

    it('accepts a valid refresh token', async () => {
        const { service } = createService();
        const { token } = await service.signRefreshToken(credential);

        const payload = service.verifyRefreshToken(token);

        expect(payload).toMatchObject({
            sub: credential.userId.toString(),
            jti: expect.any(String),
            type: 'refresh',
        });
    });
});

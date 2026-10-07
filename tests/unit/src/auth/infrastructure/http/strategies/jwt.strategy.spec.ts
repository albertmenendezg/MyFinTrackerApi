import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '@auth/infrastructure/http/strategies/jwt.strategy';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { Currency } from '@shared/domain/value-objects/currency';

const SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'b'.repeat(40);

const SETTINGS: Record<string, string> = {
    'auth.jwt.secret': SECRET,
    'auth.jwt.refreshSecret': REFRESH_SECRET,
    'auth.cookies.access.name': 'access_token',
};

const USER_ID = '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94';

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

function createCredentialMock() {
    return AuthCredential.create(
        new UserId(USER_ID),
        new AuthCredentialPassword('Password123!'),
    );
}

function createUserMock() {
    return User.create(
        new UserId(USER_ID),
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );
}

function createStrategy(credential: AuthCredential | null, user: User | null) {
    const credentialRepository = {
        findByUserId: vi.fn().mockResolvedValue(credential),
        save: vi.fn(),
    } as any;
    const userRepository = {
        findById: vi.fn().mockResolvedValue(user),
        save: vi.fn(),
        findByEmail: vi.fn(),
    } as any;
    return new JwtStrategy(
        createConfigService(),
        credentialRepository,
        userRepository,
    );
}

describe('JwtStrategy', () => {
    it('maps a valid access payload to the authenticated user', async () => {
        const strategy = createStrategy(
            createCredentialMock(),
            createUserMock(),
        );

        await expect(
            strategy.validate({
                sub: USER_ID,
                type: 'access',
            }),
        ).resolves.toEqual({
            id: USER_ID,
            email: 'john@doe.xyz',
            roles: ['user'],
        });
    });

    it('resolves admin roles from the credential projection', async () => {
        const credential = createCredentialMock();
        credential.updateRoles([AuthCredentialRole.ADMIN]);
        const strategy = createStrategy(credential, createUserMock());

        const authenticated = await strategy.validate({
            sub: USER_ID,
            type: 'access',
        });

        expect(authenticated.roles).toEqual(['admin']);
    });

    it('rejects a payload whose type is not access', async () => {
        const strategy = createStrategy(
            createCredentialMock(),
            createUserMock(),
        );

        await expect(
            strategy.validate({
                sub: USER_ID,
                type: 'refresh',
            } as never),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the credential behind the token no longer exists', async () => {
        const strategy = createStrategy(null, createUserMock());

        await expect(
            strategy.validate({ sub: USER_ID, type: 'access' }),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the user behind the token no longer exists', async () => {
        const strategy = createStrategy(createCredentialMock(), null);

        await expect(
            strategy.validate({ sub: USER_ID, type: 'access' }),
        ).rejects.toThrow(UnauthorizedException);
    });
});

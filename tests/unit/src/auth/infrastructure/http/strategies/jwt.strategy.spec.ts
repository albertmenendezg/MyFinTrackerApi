import { describe, expect, it, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '@auth/infrastructure/http/strategies/jwt.strategy';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import { UserCreatedAt } from '@auth/domain/value-objects/user-created-at';
import { UserUpdatedAt } from '@auth/domain/value-objects/user-updated-at';
import { UserRole } from '@auth/domain/value-objects/user-role';

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

function createUserMock() {
    return new User(
        new UserId('6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94'),
        new UserEmail('john@doe.xyz'),
        new UserPassword('Password123!'),
        UserCreatedAt.now(),
        UserUpdatedAt.now(),
        [UserRole.USER],
    );
}

describe('JwtStrategy', () => {
    it('maps a valid access payload to the authenticated user', async () => {
        const userMock = createUserMock();
        const userRepository = {
            findById: vi.fn().mockResolvedValue(userMock),
            save: vi.fn(),
        } as any;
        const strategy = new JwtStrategy(createConfigService(), userRepository);

        await expect(
            strategy.validate({
                sub: '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
                email: 'john@doe.xyz',
                type: 'access',
            }),
        ).resolves.toEqual({
            id: '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
            email: 'john@doe.xyz',
            roles: ['user'],
        });
    });

    it('rejects a payload whose type is not access', async () => {
        const userMock = createUserMock();
        const userRepository = {
            findById: vi.fn().mockResolvedValue(userMock),
            save: vi.fn(),
        } as any;
        const strategy = new JwtStrategy(createConfigService(), userRepository);

        await expect(
            strategy.validate({
                sub: '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
                email: 'john@doe.xyz',
                type: 'refresh',
            } as never),
        ).rejects.toThrow(UnauthorizedException);
    });
});

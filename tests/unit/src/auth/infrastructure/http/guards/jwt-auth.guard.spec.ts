import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '@auth/infrastructure/http/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '@auth/infrastructure/http/decorators/public.decorator';

const { passportCanActivate } = vi.hoisted(() => ({
    passportCanActivate: vi.fn(() => true),
}));

vi.mock('@nestjs/passport', () => ({
    AuthGuard: () =>
        class {
            canActivate() {
                return passportCanActivate();
            }
        },
}));

const HANDLER = () => undefined;
const CLASS = class {};

function executionContext(): ExecutionContext {
    return {
        getHandler: () => HANDLER,
        getClass: () => CLASS,
    } as unknown as ExecutionContext;
}

function createGuard(isPublic?: boolean): JwtAuthGuard {
    const reflector = {
        getAllAndOverride: (key: string) => {
            if (key !== IS_PUBLIC_KEY) {
                throw new Error(`Unexpected key ${key}`);
            }
            return isPublic;
        },
    } as unknown as Reflector;
    return new JwtAuthGuard(reflector);
}

describe('JwtAuthGuard', () => {
    it('lets a public route through without touching passport', () => {
        const guard = createGuard(true);

        expect(guard.canActivate(executionContext())).toBe(true);
        expect(passportCanActivate).not.toHaveBeenCalled();
    });

    it('delegates to passport for a protected route', () => {
        const guard = createGuard(undefined);

        expect(guard.canActivate(executionContext())).toBe(true);
        expect(passportCanActivate).toHaveBeenCalledTimes(1);
    });

    it('asks for the metadata of both the handler and the class', async () => {
        const getAllAndOverride = vi.fn().mockReturnValue(true);
        const guard = new JwtAuthGuard({
            getAllAndOverride,
        } as unknown as Reflector);

        await guard.canActivate(executionContext());

        expect(getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
            HANDLER,
            CLASS,
        ]);
    });

    it('returns the verified user untouched', () => {
        const guard = createGuard(undefined);
        const user = { id: 'user-id', email: 'john@doe.xyz' };

        expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('rejects when passport reports a failure', () => {
        const guard = createGuard(undefined);

        expect(() =>
            guard.handleRequest(new Error('jwt expired'), null),
        ).toThrow(/Invalid or expired access token/);
    });

    it('rejects when passport resolves without a user', () => {
        const guard = createGuard(undefined);

        expect(() => guard.handleRequest(null, null)).toThrow(
            /Missing access token/,
        );
    });
});

import { describe, expect, it, vi } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '@auth/infrastructure/http/guards/roles.guard';
import { IS_PUBLIC_KEY } from '@auth/infrastructure/http/decorators/public.decorator';
import { ROLES_KEY } from '@auth/infrastructure/http/decorators/roles.decorator';

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

function createGuard(opts: {
    isPublic?: boolean;
    requiredRoles?: string[];
}): RolesGuard {
    const reflector = {
        getAllAndOverride: (key: string) => {
            if (key === IS_PUBLIC_KEY) return opts.isPublic;
            if (key === ROLES_KEY) return opts.requiredRoles;
            throw new Error(`Unexpected key ${key}`);
        },
    } as unknown as Reflector;
    return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
    it('lets a public route through without touching passport', () => {
        const guard = createGuard({ isPublic: true });

        expect(guard.canActivate(executionContext())).toBe(true);
        expect(passportCanActivate).not.toHaveBeenCalled();
    });

    it('delegates to passport for a protected route', () => {
        const guard = createGuard({});

        expect(guard.canActivate(executionContext())).toBe(true);
        expect(passportCanActivate).toHaveBeenCalledTimes(1);
    });

    it('allows access when no roles are required', () => {
        const guard = createGuard({});
        const user = { id: 'user-id', email: 'john@doe.xyz', roles: ['user'] };

        expect(guard.handleRequest(null, user, null, executionContext())).toBe(
            user,
        );
    });

    it('allows access when the user has the required role', () => {
        const guard = createGuard({ requiredRoles: ['admin'] });
        const user = {
            id: 'user-id',
            email: 'admin@doe.xyz',
            roles: ['admin'],
        };

        expect(guard.handleRequest(null, user, null, executionContext())).toBe(
            user,
        );
    });

    it('rejects with ForbiddenException when the user lacks the required role', () => {
        const guard = createGuard({ requiredRoles: ['admin'] });
        const user = { id: 'user-id', email: 'john@doe.xyz', roles: ['user'] };

        expect(() =>
            guard.handleRequest(null, user, null, executionContext()),
        ).toThrow(ForbiddenException);
    });

    it('rejects when passport reports a failure', () => {
        const guard = createGuard({});

        expect(() =>
            guard.handleRequest(new Error('jwt expired'), null, null, executionContext()),
        ).toThrow(/Invalid or expired access token/);
    });

    it('rejects when passport resolves without a user', () => {
        const guard = createGuard({});

        expect(() =>
            guard.handleRequest(null, null, null, executionContext()),
        ).toThrow(/Missing access token/);
    });
});

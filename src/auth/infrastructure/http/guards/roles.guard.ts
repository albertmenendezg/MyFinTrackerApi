import {
    ExecutionContext,
    ForbiddenException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '@auth/infrastructure/http/decorators/public.decorator';
import { ROLES_KEY } from '@auth/infrastructure/http/decorators/roles.decorator';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest<TUser = AuthenticatedUser>(
        err: unknown,
        user: TUser,
        info: unknown,
        context: ExecutionContext,
    ): TUser {
        if (err) {
            throw new UnauthorizedException('Invalid or expired access token');
        }

        if (!user) {
            throw new UnauthorizedException('Missing access token');
        }

        const requiredRoles = this.reflector.getAllAndOverride<
            string[] | undefined
        >(ROLES_KEY, [context.getHandler(), context.getClass()]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return user;
        }

        const userRoles = (user as unknown as AuthenticatedUser).roles;

        const hasRole = requiredRoles.some((role) =>
            userRoles.includes(role.toLowerCase()),
        );

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return user;
    }
}

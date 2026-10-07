import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '@auth/infrastructure/http/decorators/public.decorator';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
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

    handleRequest<TUser = AuthenticatedUser>(err: unknown, user: TUser): TUser {
        if (err) {
            throw new UnauthorizedException('Invalid or expired access token');
        }

        if (!user) {
            throw new UnauthorizedException('Missing access token');
        }

        return user;
    }
}

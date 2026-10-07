import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import {
    AuthenticatedRequest,
    AuthenticatedUser,
} from '@auth/infrastructure/http/types/authenticated-request';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
        const request = context
            .switchToHttp()
            .getRequest<AuthenticatedRequest>();
        return request.user;
    },
);

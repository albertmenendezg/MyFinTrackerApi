import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Req,
    Res,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCookieAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CreateUserUseCase } from '@auth/application/usecases/create-user.usecase';
import { LoginUseCase } from '@auth/application/usecases/login.usecase';
import { LogoutUseCase } from '@auth/application/usecases/logout.usecase';
import { RefreshAccessTokenUseCase } from '@auth/application/usecases/refresh-access-token.usecase';
import { UpdateUserRoleUseCase } from '@auth/application/usecases/update-user-role.usecase';
import { CreateUserRequest } from '@auth/application/dto/create-user.request';
import { LoginRequest } from '@auth/application/dto/login.request';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';
import { LogoutRequest } from '@auth/application/dto/logout.request';
import { RefreshAccessTokenRequest } from '@auth/application/dto/refresh-access-token.request';
import { UpdateUserRoleRequest } from '@auth/application/dto/update-user-role.request';
import { MissingRefreshToken } from '@auth/application/exceptions/missing-refresh-token';
import { CreateUserPayload } from '@auth/infrastructure/http/dto/create-user.payload';
import { LoginPayload } from '@auth/infrastructure/http/dto/login.payload';
import { MeResponse } from '@auth/infrastructure/http/dto/me-response.dto';
import { UpdateUserRolePayload } from '@auth/infrastructure/http/dto/update-user-role.payload';
import { AuthCookieService } from '@auth/infrastructure/http/cookies/auth-cookie.service';
import { CurrentUser } from '@auth/infrastructure/http/decorators/current-user.decorator';
import { Public } from '@auth/infrastructure/http/decorators/public.decorator';
import { Roles } from '@auth/infrastructure/http/decorators/roles.decorator';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly refreshAccessTokenUseCase: RefreshAccessTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
        private readonly authCookieService: AuthCookieService,
    ) {}

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({ description: 'User created' })
    @ApiBadRequestResponse({ description: 'Invalid email or password' })
    async createUser(@Body() request: CreateUserPayload): Promise<void> {
        const { email, password } = request;

        await this.createUserUseCase.execute(
            new CreateUserRequest(email, password),
        );
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Log in and receive the auth cookies' })
    @ApiNoContentResponse({
        description: 'Access and refresh cookies set, no body returned',
    })
    @ApiBadRequestResponse({ description: 'Malformed login payload' })
    @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
    async login(
        @Body() payload: LoginPayload,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const { email, password } = payload;

        const tokens = await this.loginUseCase.execute(
            new LoginRequest(email, password),
        );

        this.setAuthCookies(response, tokens);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Rotate the auth cookies using the refresh cookie',
    })
    @ApiNoContentResponse({
        description: 'Access and refresh cookies rotated, no body returned',
    })
    @ApiUnauthorizedResponse({
        description: 'Missing, invalid, expired or revoked refresh token',
    })
    async refreshAccessToken(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const refreshToken = this.authCookieService.readRefreshToken(request);

        if (!refreshToken) {
            throw new MissingRefreshToken();
        }

        const tokens = await this.refreshAccessTokenUseCase.execute(
            new RefreshAccessTokenRequest(refreshToken),
        );

        this.setAuthCookies(response, tokens);
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Revoke the refresh token and clear the auth cookies',
    })
    @ApiNoContentResponse({ description: 'Auth cookies cleared' })
    async logout(
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        const refreshToken = this.authCookieService.readRefreshToken(request);

        if (refreshToken) {
            await this.logoutUseCase.execute(new LogoutRequest(refreshToken));
        }

        this.authCookieService.clear(response);
    }

    @Get('me')
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Return the authenticated user' })
    @ApiOkResponse({ type: MeResponse })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
    me(@CurrentUser() user: AuthenticatedUser): MeResponse {
        return user;
    }

    @Patch('users/:id/roles')
    @Roles(['admin'])
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiCookieAuth()
    @ApiTags('Auth')
    @ApiOperation({ summary: 'Update user roles (admin only)' })
    @ApiNoContentResponse({ description: 'User roles updated' })
    @ApiBadRequestResponse({ description: 'Invalid role' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
    @ApiForbiddenResponse({ description: 'Insufficient permissions' })
    @ApiNotFoundResponse({ description: 'User not found' })
    async updateUserRole(
        @Param('id') userId: string,
        @Body() payload: UpdateUserRolePayload,
    ): Promise<void> {
        await this.updateUserRoleUseCase.execute(
            new UpdateUserRoleRequest(userId, payload.roles),
        );
    }

    private setAuthCookies(response: Response, tokens: IssuedTokens): void {
        this.authCookieService.setAccessToken(response, tokens.accessToken);
        this.authCookieService.setRefreshToken(response, tokens.refreshToken);
    }
}

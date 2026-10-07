import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCookieAuth,
    ApiForbiddenResponse,
    ApiNoContentResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@auth/infrastructure/http/decorators/current-user.decorator';
import { Roles } from '@auth/infrastructure/http/decorators/roles.decorator';
import { AuthenticatedUser } from '@auth/infrastructure/http/types/authenticated-request';
import { GetMyProfileRequest } from '@users/application/dto/get-my-profile.request';
import { UpdateMyProfileRequest } from '@users/application/dto/update-my-profile.request';
import { UpdateUserRoleRequest } from '@users/application/dto/update-user-role.request';
import { GetMyProfileUseCase } from '@users/application/usecases/get-my-profile.usecase';
import { UpdateMyProfileUseCase } from '@users/application/usecases/update-my-profile.usecase';
import { UpdateUserRoleUseCase } from '@users/application/usecases/update-user-role.usecase';
import { UserProfileResponse } from '@users/infrastructure/http/dto/user-profile-response.dto';
import { UpdateMyProfilePayload } from '@users/infrastructure/http/dto/update-my-profile.payload';
import { UpdateUserRolePayload } from '@users/infrastructure/http/dto/update-user-role.payload';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly getMyProfileUseCase: GetMyProfileUseCase,
        private readonly updateMyProfileUseCase: UpdateMyProfileUseCase,
        private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
    ) {}

    @Get('me')
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Return the authenticated user profile' })
    @ApiOkResponse({ type: UserProfileResponse })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
    @ApiNotFoundResponse({ description: 'User not found' })
    async getMyProfile(
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<UserProfileResponse> {
        const result = await this.getMyProfileUseCase.execute(
            new GetMyProfileRequest(user.id),
        );

        return {
            id: result.id,
            email: result.email,
            name: result.name,
            avatar: result.avatar,
            address: result.address
                ? {
                      street: result.address.street,
                      city: result.address.city,
                      postalCode: result.address.postalCode,
                      country: result.address.country,
                  }
                : null,
            preferredCurrency: result.preferredCurrency,
        };
    }

    @Patch('me')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiCookieAuth()
    @ApiOperation({ summary: 'Update the authenticated user profile' })
    @ApiNoContentResponse({ description: 'User profile updated' })
    @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
    @ApiNotFoundResponse({ description: 'User not found' })
    async updateMyProfile(
        @CurrentUser() user: AuthenticatedUser,
        @Body() payload: UpdateMyProfilePayload,
    ): Promise<void> {
        const { email, name, avatar, address, preferredCurrency } = payload;

        await this.updateMyProfileUseCase.execute(
            new UpdateMyProfileRequest(
                user.id,
                email,
                name,
                avatar,
                address,
                preferredCurrency,
            ),
        );
    }

    @Patch(':id/roles')
    @Roles(['admin'])
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiCookieAuth()
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
}

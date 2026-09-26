import { Body, Controller, Post } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '@auth/application/usecases/create-user.usecase';
import { CreateUserRequest } from '@auth/application/dto/create-user.request';
import { CreateUserPayload } from '@auth/infrastructure/http/dto/create-user.payload';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly createUserUseCase: CreateUserUseCase) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiCreatedResponse({ description: 'User created' })
    @ApiBadRequestResponse({ description: 'Invalid email or password' })
    async createUser(@Body() request: CreateUserPayload): Promise<void> {
        await this.createUserUseCase.execute(
            new CreateUserRequest(request.email, request.password),
        );
    }
}

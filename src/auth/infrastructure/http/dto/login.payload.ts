import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginPayload {
    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    @IsEmail()
    readonly email: string;

    @ApiProperty({ example: 'S3cur3Pass!', description: 'Plain text password' })
    @IsString()
    @MinLength(8)
    readonly password: string;
}

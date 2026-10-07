import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsString,
    Length,
    MaxLength,
    MinLength,
} from 'class-validator';

export class RegisterPayload {
    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    @IsEmail()
    readonly email: string;

    @ApiProperty({ example: 'S3cur3Pass!', description: 'Plain text password' })
    @IsString()
    @MinLength(8)
    readonly password: string;

    @ApiProperty({ example: 'Ada Lovelace', description: 'User name' })
    @IsString()
    @MaxLength(100)
    readonly name: string;

    @ApiProperty({ example: 'EUR', description: 'Preferred ISO-4217 currency' })
    @IsString()
    @Length(3, 3)
    readonly preferredCurrency: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';

export class AddressPayload {
    @ApiProperty({ example: 'Calle Mayor 1', description: 'Street' })
    @IsString()
    @MaxLength(255)
    readonly street: string;

    @ApiProperty({ example: 'Madrid', description: 'City' })
    @IsString()
    @MaxLength(100)
    readonly city: string;

    @ApiProperty({ example: '28001', description: 'Postal code' })
    @IsString()
    @MaxLength(20)
    readonly postalCode: string;

    @ApiProperty({ example: 'ES', description: 'Country' })
    @IsString()
    @MaxLength(100)
    readonly country: string;
}

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

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.png',
        description: 'Avatar URL',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    readonly avatar?: string;

    @ApiPropertyOptional({
        type: AddressPayload,
        description: 'Address',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressPayload)
    readonly address?: AddressPayload;
}

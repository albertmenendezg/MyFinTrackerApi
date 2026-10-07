import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsOptional,
    IsString,
    Length,
    MaxLength,
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

export class UpdateMyProfilePayload {
    @ApiPropertyOptional({
        example: 'user@example.com',
        description: 'User email',
    })
    @IsOptional()
    @IsEmail()
    readonly email?: string;

    @ApiPropertyOptional({ example: 'Ada Lovelace', description: 'User name' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    readonly name?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/avatar.png',
        description: 'Avatar URL, null clears it',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    readonly avatar?: string | null;

    @ApiPropertyOptional({
        type: AddressPayload,
        description: 'Address, null clears it',
        nullable: true,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => AddressPayload)
    readonly address?: AddressPayload | null;

    @ApiPropertyOptional({
        example: 'EUR',
        description: 'Preferred ISO-4217 currency',
    })
    @IsOptional()
    @IsString()
    @Length(3, 3)
    readonly preferredCurrency?: string;
}

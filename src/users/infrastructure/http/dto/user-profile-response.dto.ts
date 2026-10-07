import { ApiProperty } from '@nestjs/swagger';

export class AddressResponse {
    @ApiProperty({ example: 'Calle Mayor 1', description: 'Street' })
    readonly street: string;

    @ApiProperty({ example: 'Madrid', description: 'City' })
    readonly city: string;

    @ApiProperty({ example: '28001', description: 'Postal code' })
    readonly postalCode: string;

    @ApiProperty({ example: 'ES', description: 'Country' })
    readonly country: string;
}

export class UserProfileResponse {
    @ApiProperty({
        example: '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
        description: 'User id',
    })
    readonly id: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    readonly email: string;

    @ApiProperty({ example: 'Ada Lovelace', description: 'User name' })
    readonly name: string;

    @ApiProperty({
        example: 'https://example.com/avatar.png',
        description: 'Avatar URL',
        nullable: true,
    })
    readonly avatar: string | null;

    @ApiProperty({
        type: AddressResponse,
        description: 'Address',
        nullable: true,
    })
    readonly address: AddressResponse | null;

    @ApiProperty({ example: 'EUR', description: 'Preferred ISO-4217 currency' })
    readonly preferredCurrency: string;
}

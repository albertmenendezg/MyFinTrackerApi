import { ApiProperty } from '@nestjs/swagger';

export class MeResponse {
    @ApiProperty({
        example: '6f1c9a2e-3b7d-4f52-9c0a-8d1e5b3a7c94',
        description: 'Authenticated user id',
    })
    readonly id: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    readonly email: string;

    @ApiProperty({
        enum: ['user', 'admin'],
        example: 'user',
        description: 'User role',
    })
    readonly roles: string[];
}

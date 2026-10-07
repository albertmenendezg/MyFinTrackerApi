import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolePayload {
    @ApiProperty({
        enum: ['user', 'admin'],
        example: 'admin',
        description: 'New user role',
    })
    readonly role: string;
}

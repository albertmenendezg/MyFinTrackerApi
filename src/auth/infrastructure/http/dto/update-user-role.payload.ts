import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolePayload {
    @ApiProperty({
        enum: ['user', 'admin'],
        example: ['admin'],
        description: 'New user roles',
        type: [String],
    })
    readonly roles: string[];
}

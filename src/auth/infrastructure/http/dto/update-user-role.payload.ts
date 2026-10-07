import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateUserRolePayload {
    @ApiProperty({
        enum: ['user', 'admin'],
        example: ['admin'],
        description: 'New user roles',
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    readonly roles: string[];
}

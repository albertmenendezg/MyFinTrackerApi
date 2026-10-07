import { UnauthorizedException } from '@nestjs/common';

export class InvalidRefreshToken extends UnauthorizedException {
    constructor() {
        super('Invalid, expired or revoked refresh token');
        this.name = 'InvalidRefreshToken';
    }
}

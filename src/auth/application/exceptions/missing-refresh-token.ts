import { UnauthorizedException } from '@nestjs/common';

export class MissingRefreshToken extends UnauthorizedException {
    constructor() {
        super('Missing refresh token cookie');
        this.name = 'MissingRefreshToken';
    }
}

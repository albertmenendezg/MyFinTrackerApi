import { UnauthorizedException } from '@nestjs/common';

export class InvalidCredentials extends UnauthorizedException {
    constructor() {
        super('Invalid email or password');
        this.name = 'InvalidCredentials';
    }
}

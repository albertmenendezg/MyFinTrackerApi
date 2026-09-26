import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasherService } from '@auth/domain/services/password-hasher.service';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherService {
    private readonly rounds: number;

    constructor(config: ConfigService) {
        this.rounds = config.getOrThrow<number>('auth.bcrypt.rounds');
    }

    async hash(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, this.rounds);
    }

    async verify(
        plainPassword: string,
        hashedPassword: string,
    ): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

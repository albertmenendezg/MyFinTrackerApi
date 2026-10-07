import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RefreshTokenHasherService } from '@auth/domain/services/refresh-token-hasher.service';

@Injectable()
export class Sha256RefreshTokenHasher implements RefreshTokenHasherService {
    hash(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }
}

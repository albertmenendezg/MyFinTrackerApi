import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '@auth/domain/refresh-token';
import { RefreshTokenRepository } from '@auth/domain/repository/refresh-token.repository';
import { RefreshTokenHash } from '@auth/domain/value-objects/refresh-token-hash';
import { TypeormRefreshTokenMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-refresh-token.mapper';
import { RefreshTokenEntity } from '@auth/infrastructure/persistence/typeorm/entities/refresh-token.entity';

@Injectable()
export class TypeormRefreshTokenRepository implements RefreshTokenRepository {
    constructor(
        @InjectRepository(RefreshTokenEntity)
        private readonly repository: Repository<RefreshTokenEntity>,
        private readonly mapper: TypeormRefreshTokenMapper,
    ) {}

    async save(refreshToken: RefreshToken): Promise<void> {
        await this.repository.save(this.mapper.toEntity(refreshToken));
    }

    async findByTokenHash(
        tokenHash: RefreshTokenHash,
    ): Promise<RefreshToken | null> {
        const entity = await this.repository.findOne({
            where: { tokenHash: tokenHash.value },
        });
        return entity ? this.mapper.toDomain(entity) : null;
    }
}

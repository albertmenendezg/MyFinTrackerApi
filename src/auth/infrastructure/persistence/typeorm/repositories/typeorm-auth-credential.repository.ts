import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialRepository } from '@auth/domain/repository/auth-credential.repository';
import { UserId } from '@users/domain/value-objects/user-id';
import { TypeormAuthCredentialMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-auth-credential.mapper';
import { AuthCredentialEntity } from '@auth/infrastructure/persistence/typeorm/entities/auth-credential.entity';

@Injectable()
export class TypeormAuthCredentialRepository implements AuthCredentialRepository {
    constructor(
        @InjectRepository(AuthCredentialEntity)
        private readonly repository: Repository<AuthCredentialEntity>,
        private readonly mapper: TypeormAuthCredentialMapper,
    ) {}

    async save(credential: AuthCredential): Promise<void> {
        const entity = this.mapper.toEntity(credential);
        await this.repository.save(entity);
    }

    async findByUserId(userId: UserId): Promise<AuthCredential | null> {
        const entity = await this.repository.findOne({
            where: { user: { id: userId.value } },
        });
        return entity ? this.mapper.toDomain(entity) : null;
    }
}

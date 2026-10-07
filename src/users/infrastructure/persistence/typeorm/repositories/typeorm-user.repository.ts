import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserRepository } from '@users/domain/repository/user.repository';
import { TypeormUserMapper } from '@users/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';

@Injectable()
export class TypeormUserRepository implements UserRepository {
    constructor(
        @InjectRepository(UserEntity)
        private readonly repository: Repository<UserEntity>,
        private readonly mapper: TypeormUserMapper,
    ) {}

    async save(user: User): Promise<void> {
        const entity = this.mapper.toEntity(user);
        await this.repository.save(entity);
    }

    async findByEmail(email: UserEmail): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { email: email.value },
        });
        return entity ? this.mapper.toDomain(entity) : null;
    }

    async findById(id: UserId): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { id: id.value },
        });
        return entity ? this.mapper.toDomain(entity) : null;
    }
}

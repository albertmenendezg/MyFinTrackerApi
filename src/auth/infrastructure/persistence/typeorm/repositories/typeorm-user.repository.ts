import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@auth/domain/user';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { TypeormUserMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';

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

    async findByEmail(email: string): Promise<User | null> {
        const entity = await this.repository.findOne({
            where: { email },
        });
        return entity ? this.mapper.toDomain(entity) : null;
    }
}

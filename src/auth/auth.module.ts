import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@auth/infrastructure/http/controllers/auth.controller';
import { CreateUserUseCase } from '@auth/application/usecases/create-user.usecase';
import { BcryptPasswordHasher } from '@auth/infrastructure/password-hasher/bcrypt-password-hasher';
import { PASSWORD_HASHER_SERVICE } from '@auth/domain/services/password-hasher.service';
import authConfig from '@auth/infrastructure/config/auth.config';
import { USER_REPOSITORY } from '@auth/domain/repository/user.repository';
import { TypeormUserRepository } from '@auth/infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { TypeormUserMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';

@Module({
    imports: [
        ConfigModule.forFeature(authConfig),
        TypeOrmModule.forFeature([UserEntity]),
    ],
    controllers: [AuthController],
    providers: [
        CreateUserUseCase,
        TypeormUserMapper,
        {
            provide: PASSWORD_HASHER_SERVICE,
            useClass: BcryptPasswordHasher,
        },
        {
            provide: USER_REPOSITORY,
            useClass: TypeormUserRepository,
        },
    ],
    exports: [],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserUseCase } from '@users/application/usecases/create-user.usecase';
import { GetMyProfileUseCase } from '@users/application/usecases/get-my-profile.usecase';
import { UpdateMyProfileUseCase } from '@users/application/usecases/update-my-profile.usecase';
import { UpdateUserRoleUseCase } from '@users/application/usecases/update-user-role.usecase';
import { USER_REPOSITORY } from '@users/domain/repository/user.repository';
import { UsersController } from '@users/infrastructure/http/controllers/users.controller';
import { UserEntity } from '@users/infrastructure/persistence/typeorm/entities/user.entity';
import { TypeormUserMapper } from '@users/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';
import { TypeormUserRepository } from '@users/infrastructure/persistence/typeorm/repositories/typeorm-user.repository';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity])],
    controllers: [UsersController],
    providers: [
        CreateUserUseCase,
        GetMyProfileUseCase,
        UpdateMyProfileUseCase,
        UpdateUserRoleUseCase,
        TypeormUserMapper,
        {
            provide: USER_REPOSITORY,
            useClass: TypeormUserRepository,
        },
    ],
    exports: [USER_REPOSITORY, CreateUserUseCase],
})
export class UsersModule {}

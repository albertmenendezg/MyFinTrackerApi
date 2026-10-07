import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@auth/infrastructure/http/controllers/auth.controller';
import { CreateUserUseCase } from '@auth/application/usecases/create-user.usecase';
import { LoginUseCase } from '@auth/application/usecases/login.usecase';
import { LogoutUseCase } from '@auth/application/usecases/logout.usecase';
import { RefreshAccessTokenUseCase } from '@auth/application/usecases/refresh-access-token.usecase';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { BcryptPasswordHasher } from '@auth/infrastructure/password-hasher/bcrypt-password-hasher';
import { PASSWORD_HASHER_SERVICE } from '@auth/domain/services/password-hasher.service';
import { TOKEN_SERVICE } from '@auth/domain/services/token.service';
import { REFRESH_TOKEN_HASHER_SERVICE } from '@auth/domain/services/refresh-token-hasher.service';
import authConfig from '@auth/infrastructure/config/auth.config';
import { USER_REPOSITORY } from '@auth/domain/repository/user.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@auth/domain/repository/refresh-token.repository';
import { TypeormUserRepository } from '@auth/infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { TypeormUserMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-user.mapper';
import { TypeormRefreshTokenRepository } from '@auth/infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeormRefreshTokenMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-refresh-token.mapper';
import { UserEntity } from '@auth/infrastructure/persistence/typeorm/entities/user.entity';
import { RefreshTokenEntity } from '@auth/infrastructure/persistence/typeorm/entities/refresh-token.entity';
import { JwtTokenService } from '@auth/infrastructure/jwt/jwt-token.service';
import { Sha256RefreshTokenHasher } from '@auth/infrastructure/refresh-token-hasher/sha256-refresh-token-hasher';
import { JwtStrategy } from '@auth/infrastructure/http/strategies/jwt.strategy';
import { AuthCookieService } from '@auth/infrastructure/http/cookies/auth-cookie.service';

@Module({
    imports: [
        ConfigModule.forFeature(authConfig),
        PassportModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    ],
    controllers: [AuthController],
    providers: [
        CreateUserUseCase,
        LoginUseCase,
        RefreshAccessTokenUseCase,
        LogoutUseCase,
        TokenIssuerService,
        TypeormUserMapper,
        TypeormRefreshTokenMapper,
        AuthCookieService,
        JwtStrategy,
        {
            provide: PASSWORD_HASHER_SERVICE,
            useClass: BcryptPasswordHasher,
        },
        {
            provide: TOKEN_SERVICE,
            useClass: JwtTokenService,
        },
        {
            provide: REFRESH_TOKEN_HASHER_SERVICE,
            useClass: Sha256RefreshTokenHasher,
        },
        {
            provide: USER_REPOSITORY,
            useClass: TypeormUserRepository,
        },
        {
            provide: REFRESH_TOKEN_REPOSITORY,
            useClass: TypeormRefreshTokenRepository,
        },
    ],
    exports: [],
})
export class AuthModule {}

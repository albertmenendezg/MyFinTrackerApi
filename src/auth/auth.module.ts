import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@auth/infrastructure/http/controllers/auth.controller';
import { RegisterUseCase } from '@auth/application/usecases/register.usecase';
import { LoginUseCase } from '@auth/application/usecases/login.usecase';
import { LogoutUseCase } from '@auth/application/usecases/logout.usecase';
import { RefreshAccessTokenUseCase } from '@auth/application/usecases/refresh-access-token.usecase';
import { UpdateAuthCredentialRolesUseCase } from '@auth/application/usecases/update-auth-credential-roles.usecase';
import { UpdateAuthCredentialRolesOnUserRolesUpdated } from '@auth/infrastructure/rabbitmq/update-auth-credential-roles-on-user-roles-updated.consumer';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { BcryptPasswordHasher } from '@auth/infrastructure/password-hasher/bcrypt-password-hasher';
import { PASSWORD_HASHER_SERVICE } from '@auth/domain/services/password-hasher.service';
import { TOKEN_SERVICE } from '@auth/domain/services/token.service';
import { REFRESH_TOKEN_HASHER_SERVICE } from '@auth/domain/services/refresh-token-hasher.service';
import authConfig from '@auth/infrastructure/config/auth.config';
import { AUTH_CREDENTIAL_REPOSITORY } from '@auth/domain/repository/auth-credential.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@auth/domain/repository/refresh-token.repository';
import { TypeormAuthCredentialRepository } from '@auth/infrastructure/persistence/typeorm/repositories/typeorm-auth-credential.repository';
import { TypeormAuthCredentialMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-auth-credential.mapper';
import { TypeormRefreshTokenRepository } from '@auth/infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository';
import { TypeormRefreshTokenMapper } from '@auth/infrastructure/persistence/typeorm/mappers/typeorm-refresh-token.mapper';
import { AuthCredentialEntity } from '@auth/infrastructure/persistence/typeorm/entities/auth-credential.entity';
import { RefreshTokenEntity } from '@auth/infrastructure/persistence/typeorm/entities/refresh-token.entity';
import { JwtTokenService } from '@auth/infrastructure/jwt/jwt-token.service';
import { Sha256RefreshTokenHasher } from '@auth/infrastructure/refresh-token-hasher/sha256-refresh-token-hasher';
import { JwtStrategy } from '@auth/infrastructure/http/strategies/jwt.strategy';
import { AuthCookieService } from '@auth/infrastructure/http/cookies/auth-cookie.service';
import { UsersModule } from '@users/users.module';

@Module({
    imports: [
        ConfigModule.forFeature(authConfig),
        PassportModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([AuthCredentialEntity, RefreshTokenEntity]),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [
        RegisterUseCase,
        LoginUseCase,
        RefreshAccessTokenUseCase,
        LogoutUseCase,
        UpdateAuthCredentialRolesUseCase,
        UpdateAuthCredentialRolesOnUserRolesUpdated,
        TokenIssuerService,
        TypeormAuthCredentialMapper,
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
            provide: AUTH_CREDENTIAL_REPOSITORY,
            useClass: TypeormAuthCredentialRepository,
        },
        {
            provide: REFRESH_TOKEN_REPOSITORY,
            useClass: TypeormRefreshTokenRepository,
        },
    ],
    exports: [],
})
export class AuthModule {}

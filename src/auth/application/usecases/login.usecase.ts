import { Inject, Injectable } from '@nestjs/common';
import { LoginRequest } from '@auth/application/dto/login.request';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';
import { InvalidCredentials } from '@auth/application/exceptions/invalid-credentials';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import {
    AUTH_CREDENTIAL_REPOSITORY,
    AuthCredentialRepository,
} from '@auth/domain/repository/auth-credential.repository';
import {
    PASSWORD_HASHER_SERVICE,
    PasswordHasherService,
} from '@auth/domain/services/password-hasher.service';
import { UserEmail } from '@users/domain/value-objects/user-email';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
        @Inject(AUTH_CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: AuthCredentialRepository,
        @Inject(PASSWORD_HASHER_SERVICE)
        private readonly passwordHasher: PasswordHasherService,
        private readonly tokenIssuer: TokenIssuerService,
    ) {}

    async execute(request: LoginRequest): Promise<IssuedTokens> {
        const { email, password } = request;

        const user = await this.userRepository.findByEmail(
            new UserEmail(email),
        );

        if (!user) {
            throw new InvalidCredentials();
        }

        const credential = await this.credentialRepository.findByUserId(
            user.id,
        );

        if (!credential) {
            throw new InvalidCredentials();
        }

        const passwordMatches = await this.passwordHasher.verify(
            password,
            credential.password.toString(),
        );

        if (!passwordMatches) {
            throw new InvalidCredentials();
        }

        return this.tokenIssuer.issue(credential);
    }
}

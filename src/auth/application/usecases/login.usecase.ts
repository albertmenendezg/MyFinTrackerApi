import { Inject, Injectable } from '@nestjs/common';
import { LoginRequest } from '@auth/application/dto/login.request';
import { IssuedTokens } from '@auth/application/dto/issued-tokens';
import { InvalidCredentials } from '@auth/application/exceptions/invalid-credentials';
import { TokenIssuerService } from '@auth/application/services/token-issuer.service';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import {
    PASSWORD_HASHER_SERVICE,
    PasswordHasherService,
} from '@auth/domain/services/password-hasher.service';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@auth/domain/repository/user.repository';

@Injectable()
export class LoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
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

        const passwordMatches = await this.passwordHasher.verify(
            password,
            user.password.toString(),
        );

        if (!passwordMatches) {
            throw new InvalidCredentials();
        }

        return this.tokenIssuer.issue(user);
    }
}

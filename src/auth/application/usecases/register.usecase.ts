import { Inject, Injectable } from '@nestjs/common';
import { RegisterRequest } from '@auth/application/dto/register.request';
import { AuthCredential } from '@auth/domain/auth-credential';
import { AuthCredentialPassword } from '@auth/domain/value-objects/auth-credential-password';
import {
    AUTH_CREDENTIAL_REPOSITORY,
    AuthCredentialRepository,
} from '@auth/domain/repository/auth-credential.repository';
import {
    PASSWORD_HASHER_SERVICE,
    PasswordHasherService,
} from '@auth/domain/services/password-hasher.service';
import { CreateUserRequest } from '@users/application/dto/create-user.request';
import { CreateUserUseCase } from '@users/application/usecases/create-user.usecase';
import { UserId } from '@users/domain/value-objects/user-id';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class RegisterUseCase {
    constructor(
        @Inject(PASSWORD_HASHER_SERVICE)
        private readonly passwordHasher: PasswordHasherService,
        private readonly createUserUseCase: CreateUserUseCase,
        @Inject(AUTH_CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: AuthCredentialRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: RegisterRequest): Promise<void> {
        const { email, password, name, preferredCurrency, avatar, address } =
            request;

        new AuthCredentialPassword(password);

        const userId = UserId.random();

        await this.createUserUseCase.execute(
            new CreateUserRequest(
                userId.toString(),
                email,
                name,
                preferredCurrency,
                avatar,
                address,
            ),
        );

        const hashedPassword = await this.passwordHasher.hash(password);

        const credential = AuthCredential.create(
            userId,
            new AuthCredentialPassword(hashedPassword),
        );

        await this.credentialRepository.save(credential);
        await this.domainEventPublisher.publish(credential.pullDomainEvents());
    }
}

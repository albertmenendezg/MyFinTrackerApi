import { Inject, Injectable } from '@nestjs/common';
import { CreateUserRequest } from '@auth/application/dto/create-user.request';
import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';
import { UserPassword } from '@auth/domain/value-objects/user-password';
import {
    PASSWORD_HASHER_SERVICE,
    PasswordHasherService,
} from '@auth/domain/services/password-hasher.service';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@auth/domain/repository/user.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/shared/domain/events/domain-event-publisher';
import { UserWithEmailAlreadyExists } from '@auth/application/exceptions/user-with-email-already-exists';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(PASSWORD_HASHER_SERVICE)
        private readonly passwordHasher: PasswordHasherService,
        @Inject(USER_REPOSITORY)
        private readonly repository: UserRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: CreateUserRequest): Promise<void> {
        const { email, password } = request;

        const userExistsByEmail = await this.repository.findByEmail(email);

        if (userExistsByEmail) {
            throw new UserWithEmailAlreadyExists(email);
        }

        new UserPassword(password);

        const hashedPassword = await this.passwordHasher.hash(password);

        const user = User.create(
            UserId.random(),
            new UserEmail(email),
            new UserPassword(hashedPassword),
        );

        await this.repository.save(user);
        await this.domainEventPublisher.publish(user.pullDomainEvents());
    }
}

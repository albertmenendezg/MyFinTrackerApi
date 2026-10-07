import { Inject, Injectable } from '@nestjs/common';
import { CreateUserRequest } from '@users/application/dto/create-user.request';
import { UserWithEmailAlreadyExists } from '@users/application/exceptions/user-with-email-already-exists';
import { Currency } from '@shared/domain/value-objects/currency';
import { User } from '@users/domain/user';
import { UserAddress } from '@users/domain/value-objects/user-address';
import { UserAvatar } from '@users/domain/value-objects/user-avatar';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: CreateUserRequest): Promise<void> {
        const { id, email, name, preferredCurrency, avatar, address } = request;

        const userExistsByEmail = await this.userRepository.findByEmail(
            new UserEmail(email),
        );

        if (userExistsByEmail) {
            throw new UserWithEmailAlreadyExists(email);
        }

        const user = User.create(
            new UserId(id),
            new UserEmail(email),
            new UserName(name),
            new Currency(preferredCurrency),
            avatar ? new UserAvatar(avatar) : null,
            address ? new UserAddress(address) : null,
        );

        await this.userRepository.save(user);
        await this.domainEventPublisher.publish(user.pullDomainEvents());
    }
}

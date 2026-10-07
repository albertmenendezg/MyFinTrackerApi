import { Inject, Injectable } from '@nestjs/common';
import { UpdateMyProfileRequest } from '@users/application/dto/update-my-profile.request';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { UserWithEmailAlreadyExists } from '@users/application/exceptions/user-with-email-already-exists';
import { Currency } from '@shared/domain/value-objects/currency';
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
export class UpdateMyProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly domainEventPublisher: DomainEventPublisher,
    ) {}

    async execute(request: UpdateMyProfileRequest): Promise<void> {
        const { userId, email, name, avatar, address, preferredCurrency } =
            request;

        const user = await this.userRepository.findById(new UserId(userId));

        if (!user) {
            throw new UserNotFoundException();
        }

        if (email !== undefined) {
            await this.ensureEmailAvailable(email, userId);
        }

        user.updateProfile({
            email: email !== undefined ? new UserEmail(email) : undefined,
            name: name !== undefined ? new UserName(name) : undefined,
            avatar:
                avatar !== undefined
                    ? avatar === null
                        ? null
                        : new UserAvatar(avatar)
                    : undefined,
            address:
                address !== undefined
                    ? address === null
                        ? null
                        : new UserAddress(address)
                    : undefined,
            preferredCurrency:
                preferredCurrency !== undefined
                    ? new Currency(preferredCurrency)
                    : undefined,
        });

        await this.userRepository.save(user);
        await this.domainEventPublisher.publish(user.pullDomainEvents());
    }

    private async ensureEmailAvailable(
        email: string,
        userId: string,
    ): Promise<void> {
        const candidate = await this.userRepository.findByEmail(
            new UserEmail(email),
        );

        if (candidate && candidate.id.toString() !== userId) {
            throw new UserWithEmailAlreadyExists(email);
        }
    }
}

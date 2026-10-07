import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserRoleRequest } from '@users/application/dto/update-user-role.request';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserRole } from '@users/domain/value-objects/user-role';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class UpdateUserRoleUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly repository: UserRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly publisher: DomainEventPublisher,
    ) {}

    async execute(request: UpdateUserRoleRequest): Promise<void> {
        const { userId, roles } = request;

        const user = await this.repository.findById(new UserId(userId));

        if (!user) {
            throw new UserNotFoundException();
        }

        const userRoles = roles.map((r) => new UserRole(r));
        user.updateRoles(userRoles);

        await this.repository.save(user);
        await this.publisher.publish(user.pullDomainEvents());
    }
}

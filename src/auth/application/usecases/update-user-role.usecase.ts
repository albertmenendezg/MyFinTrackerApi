import { Inject, Injectable } from '@nestjs/common';
import { UpdateUserRoleRequest } from '@auth/application/dto/update-user-role.request';
import { UserNotFoundException } from '@auth/domain/exceptions/user-not-found.exception';
import { USER_REPOSITORY } from '@auth/domain/repository/user.repository';
import { UserRepository } from '@auth/domain/repository/user.repository';
import { UserRole } from '@auth/domain/value-objects/user-role';
import { UserId } from '@auth/domain/value-objects/user-id';
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
        const { userId, role } = request;

        const user = await this.repository.findById(new UserId(userId));

        if (!user) {
            throw new UserNotFoundException();
        }

        const userRole = new UserRole(role);
        user.updateRoles([userRole]);

        await this.repository.save(user);
        await this.publisher.publish(user.pullDomainEvents());
    }
}

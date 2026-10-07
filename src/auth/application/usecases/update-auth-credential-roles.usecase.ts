import { Inject, Injectable } from '@nestjs/common';
import { UpdateAuthCredentialRolesRequest } from '@auth/application/dto/update-auth-credential-roles.request';
import {
    AUTH_CREDENTIAL_REPOSITORY,
    AuthCredentialRepository,
} from '@auth/domain/repository/auth-credential.repository';
import { AuthCredentialRole } from '@auth/domain/value-objects/auth-credential-role';
import { UserId } from '@users/domain/value-objects/user-id';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';
import {
    DOMAIN_EVENT_PUBLISHER,
    DomainEventPublisher,
} from '@shared/domain/events/domain-event-publisher';

@Injectable()
export class UpdateAuthCredentialRolesUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
        @Inject(AUTH_CREDENTIAL_REPOSITORY)
        private readonly credentialRepository: AuthCredentialRepository,
        @Inject(DOMAIN_EVENT_PUBLISHER)
        private readonly publisher: DomainEventPublisher,
    ) {}

    async execute(request: UpdateAuthCredentialRolesRequest): Promise<void> {
        const { userId } = request;

        const user = await this.userRepository.findById(new UserId(userId));
        const credential = await this.credentialRepository.findByUserId(
            new UserId(userId),
        );

        if (!user || !credential) {
            return;
        }

        credential.updateRoles(
            user.roles.map((role) => new AuthCredentialRole(role.toString())),
        );

        await this.credentialRepository.save(credential);
        await this.publisher.publish(credential.pullDomainEvents());
    }
}

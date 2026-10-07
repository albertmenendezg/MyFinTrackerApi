import { Inject, Injectable } from '@nestjs/common';
import { GetMyProfileRequest } from '@users/application/dto/get-my-profile.request';
import { UserProfileResult } from '@users/application/dto/user-profile.result';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { UserId } from '@users/domain/value-objects/user-id';
import {
    USER_REPOSITORY,
    UserRepository,
} from '@users/domain/repository/user.repository';

@Injectable()
export class GetMyProfileUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
    ) {}

    async execute(request: GetMyProfileRequest): Promise<UserProfileResult> {
        const { userId } = request;

        const user = await this.userRepository.findById(new UserId(userId));

        if (!user) {
            throw new UserNotFoundException();
        }

        return new UserProfileResult(
            user.id.toString(),
            user.email.toString(),
            user.name.toString(),
            user.avatar ? user.avatar.toString() : null,
            user.address ? user.address.toPrimitives() : null,
            user.preferredCurrency.toString(),
        );
    }
}

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetMyProfileUseCase } from '@users/application/usecases/get-my-profile.usecase';
import { GetMyProfileRequest } from '@users/application/dto/get-my-profile.request';
import { UserNotFoundException } from '@users/application/exceptions/user-not-found';
import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';
import { UserName } from '@users/domain/value-objects/user-name';
import { Currency } from '@shared/domain/value-objects/currency';
import { UserRepository } from '@users/domain/repository/user.repository';

describe('GetMyProfileUseCase', () => {
    const userId = UserId.random();
    const user = User.create(
        userId,
        new UserEmail('john@doe.xyz'),
        new UserName('John Doe'),
        new Currency('EUR'),
    );

    const repository = {
        save: vi.fn(),
        findByEmail: vi.fn(),
        findById: vi.fn(),
    } as unknown as UserRepository;

    const useCase = new GetMyProfileUseCase(repository);

    beforeEach(() => {
        vi.clearAllMocks();
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            user,
        );
    });

    it('returns the user profile', async () => {
        const result = await useCase.execute(
            new GetMyProfileRequest(userId.toString()),
        );

        expect(repository.findById).toHaveBeenCalledWith(userId);
        expect(result.id).toBe(userId.toString());
        expect(result.email).toBe('john@doe.xyz');
        expect(result.name).toBe('John Doe');
        expect(result.avatar).toBeNull();
        expect(result.address).toBeNull();
        expect(result.preferredCurrency).toBe('EUR');
    });

    it('throws UserNotFoundException when the user does not exist', async () => {
        (repository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
            null,
        );

        await expect(
            useCase.execute(new GetMyProfileRequest(userId.toString())),
        ).rejects.toBeInstanceOf(UserNotFoundException);
    });
});

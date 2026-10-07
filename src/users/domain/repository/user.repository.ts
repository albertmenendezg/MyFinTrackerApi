import { User } from '@users/domain/user';
import { UserEmail } from '@users/domain/value-objects/user-email';
import { UserId } from '@users/domain/value-objects/user-id';

export const USER_REPOSITORY = 'user-repository';

export interface UserRepository {
    save(user: User): Promise<void>;
    findByEmail(email: UserEmail): Promise<User | null>;
    findById(id: UserId): Promise<User | null>;
}

import { User } from '@auth/domain/user';
import { UserId } from '@auth/domain/value-objects/user-id';
import { UserEmail } from '@auth/domain/value-objects/user-email';

export const USER_REPOSITORY = 'user-repositories';

export interface UserRepository {
    save(user: User): Promise<void>;
    findByEmail(email: UserEmail): Promise<User | null>;
    findById(id: UserId): Promise<User | null>;
}

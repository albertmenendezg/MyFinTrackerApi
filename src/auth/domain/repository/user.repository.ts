import { User } from '@auth/domain/user';

export const USER_REPOSITORY = 'user-repositories';

export interface UserRepository {
    save(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | null>;
}

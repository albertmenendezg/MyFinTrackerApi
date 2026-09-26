export const PASSWORD_HASHER_SERVICE: string = 'password-hasher';

export interface PasswordHasherService {
    hash(plainPassword: string): Promise<string>;
    verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

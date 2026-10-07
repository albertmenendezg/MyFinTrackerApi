export const REFRESH_TOKEN_HASHER_SERVICE: string = 'refresh-token-hasher';

export interface RefreshTokenHasherService {
    hash(token: string): string;
}

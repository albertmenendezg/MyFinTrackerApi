import { CreateAuthCredentialsTable1790628891091 } from './1790628891091-CreateAuthCredentialsTable';
import { CreateRefreshTokensTable1790628891092 } from './1790628891092-CreateRefreshTokensTable';
import { CreateUsersTable1790628891090 } from './1790628891090-CreateUsersTable';

export const migrations = [
    CreateUsersTable1790628891090,
    CreateAuthCredentialsTable1790628891091,
    CreateRefreshTokensTable1790628891092,
];

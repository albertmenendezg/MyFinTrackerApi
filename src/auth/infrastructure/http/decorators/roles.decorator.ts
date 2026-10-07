import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type RoleLiteral = 'user' | 'admin';

export const Roles = (roles: (RoleLiteral | string)[]) =>
    SetMetadata(ROLES_KEY, roles);

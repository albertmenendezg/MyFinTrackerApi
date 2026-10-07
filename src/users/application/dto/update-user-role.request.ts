export class UpdateUserRoleRequest {
    constructor(
        readonly userId: string,
        readonly roles: string[],
    ) {}
}

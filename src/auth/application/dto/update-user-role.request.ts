export class UpdateUserRoleRequest {
    constructor(
        readonly userId: string,
        readonly role: string,
    ) {}
}

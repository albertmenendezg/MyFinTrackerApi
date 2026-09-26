export class CreateUserRequest {
    constructor(
        public readonly email: string,
        public readonly password: string,
    ) {}
}

export class RegisterRequest {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly name: string,
        public readonly preferredCurrency: string,
    ) {}
}

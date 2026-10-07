export class CreateUserRequest {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly name: string,
        public readonly preferredCurrency: string,
        public readonly avatar?: string | null,
        public readonly address?: {
            street: string;
            city: string;
            postalCode: string;
            country: string;
        } | null,
    ) {}
}

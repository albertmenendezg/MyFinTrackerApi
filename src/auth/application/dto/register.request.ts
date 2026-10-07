import { AddressDto } from '@users/application/dto/address.dto';

export class RegisterRequest {
    constructor(
        public readonly email: string,
        public readonly password: string,
        public readonly name: string,
        public readonly preferredCurrency: string,
        public readonly avatar?: string | null,
        public readonly address?: AddressDto | null,
    ) {}
}

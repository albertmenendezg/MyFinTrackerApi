import { AddressDto } from '@users/application/dto/address.dto';

export class UpdateMyProfileRequest {
    constructor(
        public readonly userId: string,
        public readonly email?: string,
        public readonly name?: string,
        public readonly avatar?: string | null,
        public readonly address?: AddressDto | null,
        public readonly preferredCurrency?: string,
    ) {}
}

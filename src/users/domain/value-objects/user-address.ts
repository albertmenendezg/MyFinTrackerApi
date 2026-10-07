import { InvalidUserAddressCity } from '@users/domain/exceptions/invalid-user-address-city';
import { InvalidUserAddressCountry } from '@users/domain/exceptions/invalid-user-address-country';
import { InvalidUserAddressPostalCode } from '@users/domain/exceptions/invalid-user-address-postal-code';
import { InvalidUserAddressStreet } from '@users/domain/exceptions/invalid-user-address-street';

export interface UserAddressProps {
    street: string;
    city: string;
    postalCode: string;
    country: string;
}

export class UserAddress {
    public readonly street: string;
    public readonly city: string;
    public readonly postalCode: string;
    public readonly country: string;

    constructor(props: UserAddressProps) {
        this.ensureValid(props);
        this.street = props.street.trim();
        this.city = props.city.trim();
        this.postalCode = props.postalCode.trim();
        this.country = props.country.trim();
    }

    private ensureValid(props: UserAddressProps): void {
        if (!props.street?.trim() || props.street.length > 255) {
            throw new InvalidUserAddressStreet();
        }
        if (!props.city?.trim() || props.city.length > 100) {
            throw new InvalidUserAddressCity();
        }
        if (!props.postalCode?.trim() || props.postalCode.length > 20) {
            throw new InvalidUserAddressPostalCode();
        }
        if (!props.country?.trim() || props.country.length > 100) {
            throw new InvalidUserAddressCountry();
        }
    }

    toPrimitives(): UserAddressProps {
        return {
            street: this.street,
            city: this.city,
            postalCode: this.postalCode,
            country: this.country,
        };
    }
}

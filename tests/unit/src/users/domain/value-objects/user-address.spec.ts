import { describe, expect, it } from 'vitest';
import { UserAddress } from '@users/domain/value-objects/user-address';
import { InvalidUserAddressStreet } from '@users/domain/exceptions/invalid-user-address-street';
import { InvalidUserAddressCity } from '@users/domain/exceptions/invalid-user-address-city';
import { InvalidUserAddressPostalCode } from '@users/domain/exceptions/invalid-user-address-postal-code';
import { InvalidUserAddressCountry } from '@users/domain/exceptions/invalid-user-address-country';

const VALID = {
    street: 'Calle Mayor 1',
    city: 'Madrid',
    postalCode: '28001',
    country: 'ES',
};

describe('UserAddress', () => {
    it('accepts a complete address and trims its parts', () => {
        const address = new UserAddress({
            ...VALID,
            street: '  Calle Mayor 1  ',
        });

        expect(address.street).toBe('Calle Mayor 1');
        expect(address.toPrimitives()).toEqual(VALID);
    });

    it('rejects a missing street with InvalidUserAddressStreet', () => {
        expect(() => new UserAddress({ ...VALID, street: '   ' })).toThrow(
            InvalidUserAddressStreet,
        );
    });

    it('rejects a missing city with InvalidUserAddressCity', () => {
        expect(() => new UserAddress({ ...VALID, city: '' })).toThrow(
            InvalidUserAddressCity,
        );
    });

    it('rejects a missing postal code with InvalidUserAddressPostalCode', () => {
        expect(() => new UserAddress({ ...VALID, postalCode: '' })).toThrow(
            InvalidUserAddressPostalCode,
        );
    });

    it('rejects a missing country with InvalidUserAddressCountry', () => {
        expect(() => new UserAddress({ ...VALID, country: '' })).toThrow(
            InvalidUserAddressCountry,
        );
    });

    it('rejects parts that exceed their max length', () => {
        expect(
            () => new UserAddress({ ...VALID, street: 's'.repeat(256) }),
        ).toThrow(InvalidUserAddressStreet);
        expect(
            () => new UserAddress({ ...VALID, city: 'c'.repeat(101) }),
        ).toThrow(InvalidUserAddressCity);
        expect(
            () => new UserAddress({ ...VALID, postalCode: 'p'.repeat(21) }),
        ).toThrow(InvalidUserAddressPostalCode);
        expect(
            () => new UserAddress({ ...VALID, country: 'c'.repeat(101) }),
        ).toThrow(InvalidUserAddressCountry);
    });
});

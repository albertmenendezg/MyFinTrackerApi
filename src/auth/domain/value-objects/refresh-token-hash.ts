import { InvalidRefreshTokenHash } from '@auth/domain/exceptions/invalid-refresh-token-hash';

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

export class RefreshTokenHash {
    public readonly value: string;

    constructor(value: string) {
        this.ensureValidHash(value);
        this.value = value;
    }

    public toString(): string {
        return this.value;
    }

    private ensureValidHash(value: string): void {
        if (!value || !SHA256_HEX_PATTERN.test(value)) {
            throw new InvalidRefreshTokenHash();
        }
    }
}

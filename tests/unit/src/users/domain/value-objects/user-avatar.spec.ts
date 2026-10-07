import { describe, expect, it } from 'vitest';
import { UserAvatar } from '@users/domain/value-objects/user-avatar';
import { InvalidUserAvatar } from '@users/domain/exceptions/invalid-user-avatar';

describe('UserAvatar', () => {
    it('accepts a value within 500 characters', () => {
        const avatar = new UserAvatar('https://example.com/avatar.png');
        expect(avatar.value).toBe('https://example.com/avatar.png');
        expect(avatar.toString()).toBe('https://example.com/avatar.png');
    });

    it.each(['', 'a'.repeat(501)])(
        'rejects "%s" with InvalidUserAvatar',
        (value) => {
            expect(() => new UserAvatar(value)).toThrow(InvalidUserAvatar);
        },
    );
});

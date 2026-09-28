import { BadRequestException } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { describe, expect, it } from 'vitest';
import {
    createValidationPipe,
    validationMessages,
} from '@shared/shared/infrastructure/http/validation-pipe';

class PayloadDto {
    @IsEmail()
    readonly email: string;

    @IsString()
    readonly password: string;
}

describe('validationMessages', () => {
    it('joins the constraint messages of a validation error', () => {
        const errors = [
            {
                property: 'email',
                constraints: { isEmail: 'email must be an email' },
            },
        ];
        expect(validationMessages(errors)).toBe('email must be an email');
    });

    it('returns an empty string when constraints are missing', () => {
        expect(validationMessages([{ property: 'admin' }])).toBe('');
    });
});

describe('createValidationPipe', () => {
    it('rejects unknown properties with a 400 bad request', async () => {
        const pipe = createValidationPipe();
        const transform = pipe.transform(
            { email: 'user@example.com', password: 'S3cur3Pass!', admin: 'x' },
            { type: 'body', metatype: PayloadDto },
        );
        await expect(transform).rejects.toThrowError(BadRequestException);
        await expect(transform).rejects.toThrow(
            'property admin should not exist',
        );
    });

    it('rejects an invalid email with its constraint message', async () => {
        const pipe = createValidationPipe();
        await expect(
            pipe.transform(
                { email: 'a@b', password: 'S3cur3Pass!' },
                { type: 'body', metatype: PayloadDto },
            ),
        ).rejects.toThrow('email must be an email');
    });

    it('accepts a valid payload and transforms it into the DTO', async () => {
        const pipe = createValidationPipe();
        const result = await pipe.transform(
            { email: 'user@example.com', password: 'S3cur3Pass!' },
            { type: 'body', metatype: PayloadDto },
        );
        expect(result).toBeInstanceOf(PayloadDto);
        expect(result).toEqual({
            email: 'user@example.com',
            password: 'S3cur3Pass!',
        });
    });
});

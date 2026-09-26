import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export function validationMessages(errors: ValidationError[]): string {
    return errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .join('; ');
}

export function createValidationPipe(): ValidationPipe {
    return new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) =>
            new BadRequestException(validationMessages(errors)),
    });
}
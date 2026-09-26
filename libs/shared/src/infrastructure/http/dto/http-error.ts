import { HttpStatus } from '@nestjs/common';

export class HttpError {
    constructor(
        public readonly path: string,
        public readonly status: HttpStatus,
        public readonly message: string,
        public readonly timestamp: Date,
    ) {}
}

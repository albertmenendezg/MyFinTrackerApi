import {
    ArgumentsHost,
    Catch,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HttpError } from '@shared/shared/infrastructure/http/dto/http-error';
import { HTTP_ERROR_CODES } from '@shared/shared/infrastructure/http/http-error-codes';

@Catch(Error)
export class GlobalHttpExceptionHandler {
    catch(exception: Error, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        const body: HttpError = {
            path: request.url,
            status: this.statusFor(exception),
            message: exception.message,
            timestamp: new Date(),
        };
        response.status(body.status).json(body);
    }

    private statusFor(exception: unknown): HttpStatus {
        if (exception instanceof HttpException) {
            return exception.getStatus();
        }

        for (const [exceptionClass, status] of HTTP_ERROR_CODES) {
            if (exception instanceof exceptionClass) {
                return status;
            }
        }

        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
}

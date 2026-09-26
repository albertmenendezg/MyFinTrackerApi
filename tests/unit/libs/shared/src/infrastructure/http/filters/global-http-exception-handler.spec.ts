import { describe, expect, it, vi } from 'vitest';
import {
    ArgumentsHost,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { GlobalHttpExceptionHandler } from '@shared/shared/infrastructure/http/filters/global-http-exception-handler';
import { InvalidPassword } from '@auth/domain/exceptions/invalid-password';
import { UserWithEmailAlreadyExists } from '@auth/application/exceptions/user-with-email-already-exists';
import { InvalidDateTime } from '@shared/shared/domain/exceptions/invalid-datetime';
import { RabbitMQConnectionFailedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-connection-failed.exception';
import { RabbitMQNotConnectedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-not-connected.exception';

function mockHttpHost(): {
    host: ArgumentsHost;
    url: string;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
} {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const url = '/auth/register';
    const host = {
        getType: () => 'http',
        switchToHttp: () => ({
            getRequest: () => ({ url }),
            getResponse: () => ({ status }),
        }),
    } as unknown as ArgumentsHost;
    return { host, url, status, json };
}

describe('GlobalHttpExceptionHandler', () => {
    const filter = new GlobalHttpExceptionHandler();

    it('maps a DomainException subclass to 400', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new InvalidPassword(), host);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 400,
            message: 'Invalid password. It must have at least 8 characters',
            timestamp: expect.any(Date),
        });
    });

    it('resolves a concrete DomainException registered in HTTP_ERROR_CODES to 400', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new InvalidDateTime(new Date('not-a-date')), host);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 400,
            message: 'Invalid date Invalid Date',
            timestamp: expect.any(Date),
        });
    });

    it('maps an ApplicationException subclass to 409', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new UserWithEmailAlreadyExists('john@doe.xyz'), host);

        expect(status).toHaveBeenCalledWith(409);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 409,
            message: 'User with email "john@doe.xyz" already exists',
            timestamp: expect.any(Date),
        });
    });

    it('maps an InfrastructureException subclass to 503', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new RabbitMQNotConnectedException(), host);

        expect(status).toHaveBeenCalledWith(503);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 503,
            message: expect.any(String),
            timestamp: expect.any(Date),
        });
    });

    it('maps a RabbitMQConnectionFailedException to 503', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new RabbitMQConnectionFailedException('timeout'), host);

        expect(status).toHaveBeenCalledWith(503);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 503,
            message: 'Failed to connect to RabbitMQ: timeout',
            timestamp: expect.any(Date),
        });
    });

    it.each([
        { exception: () => new BadRequestException('nope'), status: 400 },
        { exception: () => new NotFoundException(), status: 404 },
    ] as const)(
        'responds with HttpError using the HttpException own status $status',
        ({ exception, status }) => {
            const { host, url, status: statusMock, json } = mockHttpHost();

            filter.catch(exception(), host);

            expect(statusMock).toHaveBeenCalledWith(status);
            expect(json).toHaveBeenCalledWith({
                path: url,
                status,
                message: expect.any(String),
                timestamp: expect.any(Date),
            });
        },
    );

    it('maps unknown exceptions to 500', () => {
        const { host, url, status, json } = mockHttpHost();

        filter.catch(new Error('boom'), host);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            path: url,
            status: 500,
            message: 'boom',
            timestamp: expect.any(Date),
        });
    });
});
import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '@shared/shared/application/exceptions/application-exception';
import { DomainException } from '@shared/shared/domain/exceptions/domain-exception';
import { InvalidDateTime } from '@shared/shared/domain/exceptions/invalid-datetime';
import { InvalidEmail } from '@shared/shared/domain/exceptions/invalid-email';
import { InvalidIdentifier } from '@shared/shared/domain/exceptions/invalid-identifier';
import { InfrastructureException } from '@shared/shared/infrastructure/exceptions/infrastructure-exception';
import { RabbitMQConnectionFailedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-connection-failed.exception';
import { RabbitMQNotConnectedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-not-connected.exception';

export type ExceptionClass = abstract new (...args: never[]) => Error;

export const HTTP_ERROR_CODES: ReadonlyMap<ExceptionClass, HttpStatus> =
    new Map<ExceptionClass, HttpStatus>([
        [InvalidDateTime, HttpStatus.BAD_REQUEST],
        [InvalidEmail, HttpStatus.BAD_REQUEST],
        [InvalidIdentifier, HttpStatus.BAD_REQUEST],
        [RabbitMQConnectionFailedException, HttpStatus.SERVICE_UNAVAILABLE],
        [RabbitMQNotConnectedException, HttpStatus.SERVICE_UNAVAILABLE],
        [DomainException, HttpStatus.BAD_REQUEST],
        [ApplicationException, HttpStatus.CONFLICT],
        [InfrastructureException, HttpStatus.SERVICE_UNAVAILABLE],
    ]);

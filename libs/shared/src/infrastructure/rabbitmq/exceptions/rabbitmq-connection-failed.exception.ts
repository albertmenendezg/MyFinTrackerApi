import { InfrastructureException } from '@shared/infrastructure/exceptions/infrastructure-exception';

export class RabbitMQConnectionFailedException extends InfrastructureException {
    constructor(message: string) {
        super(`Failed to connect to RabbitMQ: ${message}`);
        this.name = 'RabbitMQConnectionFailedException';
    }
}

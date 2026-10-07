import { InfrastructureException } from '@shared/infrastructure/exceptions/infrastructure-exception';

export class RabbitMQNotConnectedException extends InfrastructureException {
    constructor() {
        super('RabbitMQ client is not connected');
        this.name = 'RabbitMQNotConnectedException';
    }
}

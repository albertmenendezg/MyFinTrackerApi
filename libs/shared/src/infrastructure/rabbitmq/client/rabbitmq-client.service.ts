import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, ChannelModel, connect, Message } from 'amqplib';
import { RabbitMQConnectionFailedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-connection-failed.exception';
import { RabbitMQNotConnectedException } from '@shared/shared/infrastructure/rabbitmq/exceptions/rabbitmq-not-connected.exception';

@Injectable()
export class RabbitMQClient implements OnModuleInit, OnModuleDestroy {
    private readonly url: string;
    private readonly exchangeName: string;
    private readonly exchangeType: string;
    private connection?: ChannelModel;
    private channel?: Channel;

    constructor(config: ConfigService) {
        this.url = config.getOrThrow<string>('rabbitmq.url');
        this.exchangeName = config.getOrThrow<string>('rabbitmq.exchange.name');
        this.exchangeType = config.getOrThrow<string>('rabbitmq.exchange.type');
    }

    async onModuleInit(): Promise<void> {
        await this.connect();
        await this.ensureExchange(this.getChannel(), this.exchangeName);
    }

    async publish(
        routingKey: string,
        message: Buffer,
        exchange: string = this.exchangeName,
    ): Promise<void> {
        const channel = this.getChannel();
        await this.ensureExchange(channel, exchange);
        channel.publish(exchange, routingKey, message, {
            persistent: true,
        });
    }

    async consume(
        queue: string,
        routingKey: string,
        onMessage: (
            message: Message,
            context: { ack: () => void; nack: () => void },
        ) => Promise<void>,
        exchange: string = this.exchangeName,
    ): Promise<void> {
        const channel = this.getChannel();
        await this.ensureExchange(channel, exchange);
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);
        await channel.consume(queue, (message) => {
            if (!message) {
                return;
            }
            void onMessage(message, {
                ack: () => channel.ack(message),
                nack: () => channel.nack(message, false, false),
            });
        });
    }

    private async connect(): Promise<void> {
        try {
            this.connection = await connect(this.url);
            this.channel = await this.connection.createChannel();
        } catch (error) {
            throw new RabbitMQConnectionFailedException(
                error instanceof Error ? error.message : String(error),
            );
        }
    }

    private getChannel(): Channel {
        if (!this.channel) {
            throw new RabbitMQNotConnectedException();
        }
        return this.channel;
    }

    private async ensureExchange(
        channel: Channel,
        exchange: string,
    ): Promise<void> {
        await channel.assertExchange(exchange, this.exchangeType, {
            durable: true,
        });
    }

    async onModuleDestroy(): Promise<void> {
        await this.channel?.close();
        await this.connection?.close();
    }
}

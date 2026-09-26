import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainEventDispatcher } from '@shared/shared/application/events/domain-event-dispatcher';
import { DOMAIN_EVENT_PUBLISHER } from '@shared/shared/domain/events/domain-event-publisher';
import { RabbitMqDomainEventPublisher } from '@shared/shared/infrastructure/rabbitmq/publisher/rabbitmq-domain-event-publisher';
import { RabbitmqDomainEventConsumerRegistrar } from '@shared/shared/infrastructure/rabbitmq/registry/rabbitmq-domain-event-consumer-registrar.service';
import { RabbitmqDomainEventDeserializer } from '@shared/shared/infrastructure/rabbitmq/serializer/rabbitmq-domain-event-deserializer';
import { RabbitmqDomainEventSerializer } from '@shared/shared/infrastructure/rabbitmq/serializer/rabbitmq-domain-event-serializer';
import { RabbitMQClient } from '@shared/shared/infrastructure/rabbitmq/client/rabbitmq-client.service';
import {
    appConfig,
    databaseConfig,
    rabbitmqConfig,
} from '@shared/shared/infrastructure/config/shared.config';
import { validateEnv } from '@shared/shared/infrastructure/config/env.validation';
import * as path from 'path';

@Global()
@Module({
    imports: [
        DiscoveryModule,
        ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
        ConfigModule.forFeature(appConfig),
        ConfigModule.forFeature(rabbitmqConfig),
        ConfigModule.forFeature(databaseConfig),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.getOrThrow<string>('db.host'),
                port: config.getOrThrow<number>('db.port'),
                username: config.getOrThrow<string>('db.username'),
                password: config.getOrThrow<string>('db.password'),
                database: config.getOrThrow<string>('db.name'),
                migrationsRun: config.getOrThrow<boolean>('db.migrationsRun'),
                migrations: [
                    path.join(
                        __dirname,
                        'infrastructure',
                        'persistence',
                        'typeorm',
                        'migrations',
                        '*.{ts,js}',
                    ),
                ],
                autoLoadEntities: true,
            }),
        }),
    ],
    providers: [
        RabbitMQClient,
        {
            provide: DOMAIN_EVENT_PUBLISHER,
            useClass: RabbitMqDomainEventPublisher,
        },
        DomainEventDispatcher,
        RabbitmqDomainEventDeserializer,
        RabbitmqDomainEventSerializer,
        RabbitmqDomainEventConsumerRegistrar,
    ],
    exports: [DOMAIN_EVENT_PUBLISHER, RabbitMQClient, DomainEventDispatcher],
})
export class SharedModule {}

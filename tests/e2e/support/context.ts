import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { createValidationPipe } from '@shared/shared/infrastructure/http/validation-pipe';
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import {
    RabbitMQContainer,
    StartedRabbitMQContainer,
} from '@testcontainers/rabbitmq';
import { Server } from 'node:http';
import { DataSource } from 'typeorm';
import { Response } from 'supertest';

export class ApiContext {
    private static instance?: ApiContext;

    app!: INestApplication;
    httpServer!: Server;
    dataSource!: DataSource;
    lastResponse?: Response;
    private postgres?: StartedPostgreSqlContainer;
    private rabbit?: StartedRabbitMQContainer;

    static async start(): Promise<void> {
        const context = new ApiContext();
        context.postgres = await new PostgreSqlContainer(
            'postgres:17-alpine',
        ).start();
        context.rabbit = await new RabbitMQContainer(
            'rabbitmq:4-management-alpine',
        ).start();

        process.env.BCRYPT_ROUNDS = '4';
        process.env.RABBITMQ_URL = context.rabbit.getAmqpUrl();
        process.env.RABBITMQ_EXCHANGE_NAME = 'myfintracker.events.e2e';
        process.env.RABBITMQ_EXCHANGE_TYPE = 'topic';
        process.env.DB_HOST = context.postgres.getHost();
        process.env.DB_PORT = String(context.postgres.getPort());
        process.env.DB_USER = context.postgres.getUsername();
        process.env.DB_PASSWORD = context.postgres.getPassword();
        process.env.DB_NAME = context.postgres.getDatabase();
        process.env.DB_MIGRATIONS_RUN = 'true';

        const { AppModule } = await import('../../../src/app.module');
        context.app = await NestFactory.create(AppModule, {
            logger: false,
        });
        context.app.useGlobalPipes(createValidationPipe());
        await context.app.init();
        context.httpServer = context.app.getHttpServer() as Server;
        context.dataSource = context.app.get(DataSource);

        ApiContext.instance = context;
    }

    static async stop(): Promise<void> {
        const context = ApiContext.instance;
        if (!context) {
            return;
        }
        await context.app.close();
        await context.postgres?.stop();
        await context.rabbit?.stop();
        ApiContext.instance = undefined;
    }

    static current(): ApiContext {
        if (!ApiContext.instance) {
            throw new Error(
                'ApiContext not started: run the cucumber BeforeAll hook first',
            );
        }
        return ApiContext.instance;
    }
}

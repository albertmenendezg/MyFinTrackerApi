import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createValidationPipe } from '@shared/shared/infrastructure/http/validation-pipe';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

    app.enableCors({
        origin: '*',
    });

    app.useGlobalPipes(createValidationPipe());

    const swaggerConfig = new DocumentBuilder()
        .setTitle('MyFinTracker API')
        .setDescription('Personal finance API organized in bounded contexts')
        .setVersion('0.0.1')
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    await app.listen(config.getOrThrow<number>('app.port'));
}
void bootstrap();

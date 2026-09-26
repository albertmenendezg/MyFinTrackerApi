import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalHttpExceptionHandler } from '@shared/shared/infrastructure/http/filters/global-http-exception-handler';
import { AuthModule } from '@auth/auth.module';
import { SharedModule } from '@shared/shared/shared.module';

@Module({
    imports: [SharedModule, AuthModule],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalHttpExceptionHandler,
        },
    ],
})
export class AppModule {}

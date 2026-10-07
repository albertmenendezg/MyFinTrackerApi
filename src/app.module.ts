import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalHttpExceptionHandler } from '@shared/infrastructure/http/filters/global-http-exception-handler';
import { JwtAuthGuard } from '@auth/infrastructure/http/guards/jwt-auth.guard';
import { AuthModule } from '@auth/auth.module';
import { SharedModule } from '@shared/shared.module';

@Module({
    imports: [SharedModule, AuthModule],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalHttpExceptionHandler,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}

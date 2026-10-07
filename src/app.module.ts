import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalHttpExceptionHandler } from '@shared/infrastructure/http/filters/global-http-exception-handler';
import { RolesGuard } from '@auth/infrastructure/http/guards/roles.guard';
import { AuthModule } from '@auth/auth.module';
import { UsersModule } from '@users/users.module';
import { SharedModule } from '@shared/shared.module';

@Module({
    imports: [SharedModule, AuthModule, UsersModule],
    controllers: [],
    providers: [
        {
            provide: APP_FILTER,
            useClass: GlobalHttpExceptionHandler,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
})
export class AppModule {}

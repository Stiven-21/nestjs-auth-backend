import { Module } from '@nestjs/common';
import { I18nModule } from 'src/shared/i18n/i18n.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailsModule } from 'src/mails/mail.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { CommonModule } from 'src/shared/common/common.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { ThrottlerModule } from 'src/shared/throttler/thorttler.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import frontendConfig from 'src/config/frontend.config';
import { validationSchema } from 'src/config/validation.schema';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { createDataSourceOptions } from 'src/database/data-source.factory';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [frontendConfig],
      validationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createDataSourceOptions(configService),
    }),
    ThrottlerModule,
    MailsModule,
    I18nModule,
    CommonModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

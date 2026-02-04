import { Module } from '@nestjs/common';
import { I18nModule } from 'src/shared/i18n/i18n.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailsModule } from 'src/mails/mail.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';
import { CommonModule } from 'src/shared/common/common.module';
import { RolesModule } from 'src/modules/roles/roles.module';
import { ThrottlerModule } from 'src/shared/throttler/thorttler.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
      ssl: process.env.DB_SSL === 'true',
      extra: {
        ssl:
          process.env.DB_SSL === 'true'
            ? {
                rejectUnauthorized: false,
              }
            : null,
      },
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
  controllers: [],
  providers: [],
})
export class AppModule {}

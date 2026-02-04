import { forwardRef, Module } from '@nestjs/common';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditLogController } from 'src/modules/audit-log/audit-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/modules/audit-log/entities/audit-log.entity';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
    forwardRef(() => AuthModule),
    UsersModule,
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [TypeOrmModule, AuditLogService],
})
export class AuditLogModule {}

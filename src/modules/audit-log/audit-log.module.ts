import { Module } from '@nestjs/common';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditLogController } from 'src/modules/audit-log/audit-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from 'src/modules/audit-log/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [TypeOrmModule, AuditLogService],
})
export class AuditLogModule {}

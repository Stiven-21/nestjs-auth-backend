import { Controller, Get, Param } from '@nestjs/common';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Auth('audit-log:read', {
    superadminOnly: true,
  })
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.auditLogService.findOne(id);
  }
}

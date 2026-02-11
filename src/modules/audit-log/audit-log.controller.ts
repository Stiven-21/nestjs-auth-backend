import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Auth('audit-log:read', {
    superadminOnly: true,
  })
  @Get(':userId')
  @ApiOperation({ summary: 'Find one audit log' })
  findOne(@Param('userId') userId: number, i18n: I18nContext) {
    return this.auditLogService.findOne(userId, i18n);
  }
}

import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';

@ApiTags('Audit Log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Auth('audit-log:read', {
    superadminOnly: true,
  })
  @Get(':userId')
  @ApiOperation({ summary: 'Obtener logs de auditoría por usuario' })
  @ApiOkResponse({ description: 'Logs de auditoría recuperados' })
  findOne(@Param('userId') userId: number, i18n: I18nContext) {
    console.error(
      '🚀 ~ file: audit-log.controller.ts:19 ~ AuditLogController ~ findOne ~ i18n',
      i18n,
    );
    return this.auditLogService.findOne(userId, i18n);
  }
}

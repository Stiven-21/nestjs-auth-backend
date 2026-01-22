import { Controller, Get, Param } from '@nestjs/common';
import { EmailLogChangesService } from './email-log-changes.service';
import { I18n, I18nContext } from 'nestjs-i18n';

@Controller('email-log-changes')
export class EmailLogChangesController {
  constructor(
    private readonly emailLogChangesService: EmailLogChangesService,
  ) {}

  @Get('revoke-email/:token')
  async changeEmail(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return this.emailLogChangesService.rollbackEmail(token, i18n);
  }
}

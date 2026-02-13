import { Controller, Get, Param } from '@nestjs/common';
import { EmailChangeRequestService } from './email-change-request.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('email-change-request')
export class EmailChangeRequestController {
  constructor(
    private readonly emailChangeRequestService: EmailChangeRequestService,
  ) {}

  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify email change request' })
  @ApiOkResponse({ description: 'Email change request verified' })
  async verify(@Param('token') token: string, @I18n() i18n: I18nContext) {
    return this.emailChangeRequestService.changeEmail(token, i18n);
  }
}

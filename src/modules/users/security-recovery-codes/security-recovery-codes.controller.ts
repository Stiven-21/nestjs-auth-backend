import { Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { SecurityRecoveryCodesService } from 'src/modules/users/security-recovery-codes/security-recovery-codes.service';

@Controller('security-recovery-codes')
export class SecurityRecoveryCodesController {
  constructor(
    private readonly securityRecoveryCodesService: SecurityRecoveryCodesService,
  ) {}

  @Auth()
  @ApiOperation({ summary: 'Generate security recovery codes' })
  @ApiOkResponse({ description: 'Security recovery codes generated' })
  @Post('generate')
  async generate(@Req() req: Request, @I18n() i18n: I18nContext) {
    const userId = req.user['sub'];
    return await this.securityRecoveryCodesService.generate(userId, i18n);
  }
}

import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ReAuthService } from 'src/modules/auth/re-auth/re-auth.service';
import { ReAuthDto } from 'src/modules/auth/dto/re-auth.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { ThorttleLimit } from 'src/common/decorators/throttle.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('auth/re-auth')
export class ReAuthController {
  constructor(private readonly reAuthService: ReAuthService) {}

  @Auth()
  @ThorttleLimit(5, 60)
  @Post()
  @ApiOperation({ summary: 'Re-authenticate' })
  async reauthenticate(
    @Req() req: Request,
    @Body() reauthDto: ReAuthDto,
    @I18n() i18n: I18nContext,
  ) {
    const userId = req.user['sub'];
    return this.reAuthService.reauthenticate(userId, reauthDto.password, i18n);
  }
}

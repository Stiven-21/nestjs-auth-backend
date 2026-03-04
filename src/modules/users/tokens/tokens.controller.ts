import { Controller, Get, Param } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { I18nContext } from 'nestjs-i18n';

@Controller('tokens')
export class TokensController {
  constructor(private readonly tokensService: TokensService) {}

  @Get('verify/:token')
  async verifyToken(@Param('token') token: string, i18n: I18nContext) {
    return this.tokensService.verifyToken(token, i18n);
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { I18n, I18nContext } from 'nestjs-i18n';

@ApiTags()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  async health(@I18n() i18n: I18nContext) {
    return await this.appService.getHealthStatus(i18n);
  }
}

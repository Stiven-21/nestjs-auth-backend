import { Controller, Get, Param, Query } from '@nestjs/common';
import { SessionService } from './session.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Find sessions by user id' })
  @ApiOkResponse({ description: 'Sessions found' })
  @Auth()
  async findByUserId(
    @Param('userId') id: number,
    @Query() query: DynamicQueryDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.sessionService.findByUserId(query, id, i18n);
  }
}

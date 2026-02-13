import { Controller, Get, Param } from '@nestjs/common';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('identity-types')
export class IdentityTypesController {
  constructor(private readonly identityTypesService: IdentityTypesService) {}

  @Get()
  @ApiOperation({ summary: 'Find all identity types' })
  @ApiOkResponse({ description: 'Identity types found' })
  async findAll(@I18n() i18n: I18nContext) {
    return await this.identityTypesService.findAll(i18n);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find one identity type' })
  @ApiOkResponse({ description: 'Identity type found' })
  async findOne(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.identityTypesService.findOne(id, i18n);
  }
}

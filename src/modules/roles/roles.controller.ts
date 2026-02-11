import { Controller, Get, Param } from '@nestjs/common';
import { RolesService } from './roles.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiOperation } from '@nestjs/swagger';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  async findAll(@I18n() i18n: I18nContext) {
    return await this.rolesService.findAll(i18n);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role by id' })
  async findOne(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.rolesService.findOne(id, i18n);
  }
}

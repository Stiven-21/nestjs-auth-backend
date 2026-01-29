import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { UsersService } from './users.service';
import { Auth } from '../auth/decorators/auth.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth('users:read', {
    superadminOnly: true,
  })
  async findAll(@Query() query: DynamicQueryDto, @I18n() i18n: I18nContext) {
    return await this.usersService.findAll(query, i18n);
  }

  @Get(':id')
  @Auth('users:read:id', {
    superadminOnly: true,
  })
  async findOne(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.findOne(id, i18n);
  }

  @Patch(':id')
  @Auth('users:update:id', {
    allowSelf: true,
  })
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.usersService.update(id, updateUserDto, i18n);
  }

  @Delete(':id')
  @Auth('users:delete:id', {
    allowSelf: true,
  })
  async remove(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.remove(id, i18n);
  }
}

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
import { UserSelfOrAdmin } from 'src/modules/users/decorator/user-self-or-admin.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Auth('users:read')
  async findAll(@Query() query: DynamicQueryDto, @I18n() i18n: I18nContext) {
    return await this.usersService.findAll(query, i18n);
  }

  @Get(':id')
  @Auth('users:read:id')
  async findOne(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.findOne(id, i18n);
  }

  @Patch(':id')
  @Auth('users:update:id')
  @UserSelfOrAdmin()
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
    @I18n() i18n: I18nContext,
  ) {
    return await this.usersService.update(id, updateUserDto, i18n);
  }

  @Delete(':id')
  @Auth('users:delete:id')
  @UserSelfOrAdmin()
  async remove(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.remove(id, i18n);
  }
}

import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Post,
  Req,
} from '@nestjs/common';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { I18n, I18nContext } from 'nestjs-i18n';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { UsersService } from 'src/modules/users/users.service';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { ChangeRoleDto } from 'src/modules/users/dto/change-role.dto';
import { Request } from 'express';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lista de usuarios (Paginado)' })
  @ApiOkResponse({ description: 'Lista de usuarios recuperada exitosamente' })
  @Auth('users:read', {
    superadminOnly: true,
  })
  async findAll(@Query() query: DynamicQueryDto, @I18n() i18n: I18nContext) {
    return await this.usersService.findAll(query, i18n);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find user by id' })
  @ApiOkResponse({ description: 'User found successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Auth('users:read:id', {
    superadminOnly: true,
  })
  async findOne(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.findOne(id, i18n);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiOkResponse({ description: 'User updated successfully' })
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
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiOkResponse({ description: 'User deleted successfully' })
  @Auth('users:delete:id', {
    allowSelf: true,
  })
  async remove(@Param('id') id: number, @I18n() i18n: I18nContext) {
    return await this.usersService.remove(id, i18n);
  }

  @Post('change-role/:userId')
  @ApiOperation({ summary: 'Change user role' })
  @ApiOkResponse({ description: 'User role changed successfully' })
  @Auth('users:update:id:role', {
    superadminOnly: true,
  })
  async changeRole(
    @Param('userId') userId: number,
    @Body() changeRoleDto: ChangeRoleDto,
    @I18n() i18n: I18nContext,
    @Req() req: Request,
  ) {
    return await this.usersService.changeRole(req, userId, changeRoleDto, i18n);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiOkResponse({ description: 'Perfil recuperado exitosamente' })
  @Auth()
  async me(@Req() req: Request, @I18n() i18n: I18nContext) {
    return await this.usersService.me(req, i18n);
  }
}

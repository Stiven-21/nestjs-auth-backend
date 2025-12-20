import { Injectable, Logger, Param } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto, UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import {
  conflictError,
  internalServerError,
  notFoundError,
  okResponse,
} from 'src/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import * as bcrypt from 'bcryptjs';
import { v7 as uuidv7 } from 'uuid';
import { TokensService } from './tokens/tokens.service';
import { RolesService } from '../roles/roles.service';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import { MailService } from 'src/mails/mail.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly identityTypesService: IdentityTypesService,
    private readonly dynamicQueryService: DynamicQueryService,
    private readonly tokensService: TokensService,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto, i18n: I18nContext) {
    const create = await this.__ValidateAndCreateUser(createUserDto, i18n);
    const user_secret = uuidv7();
    let user = null;
    const role = await this.rolesService.findOne(3, i18n);
    try {
      user = await this.usersRepository.save({
        user_secret,
        role: role.data,
        ...create,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    return this.tokensService.createTokenEmailVerification({ user }, i18n);
  }

  async findAll(query: DynamicQueryDto, i18n: I18nContext) {
    const { page, limit, sort, ...filters } = query;
    const { data: users, total } = await this.dynamicQueryService.findAndCount(
      this.usersRepository,
      filters,
      page,
      limit,
      i18n,
      sort,
    );
    return okResponse({
      i18n,
      lang: i18n.lang,
      data: { data: users, total },
    });
  }

  async getUserSecret(id: number) {
    try {
      const { user_secret } = await this.usersRepository.findOne({
        where: { id },
        select: ['user_secret'],
      });
      return user_secret;
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async findOne(id: number, i18n: I18nContext) {
    let user: User;
    try {
      user = await this.usersRepository.findOneBy({ id });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!user)
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.common.notFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.users.singular') },
        }),
      });
    return okResponse({
      i18n,
      lang: i18n.lang,
      data: { data: user, total: 1 },
    });
  }

  async findOneByEmail(email: string, i18n: I18nContext) {
    let user = null;
    try {
      user = await this.usersRepository.findOne({
        where: { email },
        select: [
          'id',
          'email',
          'password',
          'status',
          'user_secret',
          'name',
          'lastname',
        ],
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!user)
      notFoundError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.userNotFound', {
          lang: i18n.lang,
          args: { entity: i18n.t('entities.users.singular') },
        }),
      });
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto, i18n: I18nContext) {
    const update = await this.__ValidateAndCreateUser(updateUserDto, i18n, id);
    await this.__ValidateChangeEmail(
      (await this.findOne(id, i18n)).data,
      i18n,
      update.email,
    );
    try {
      return await this.usersRepository.update(id, { ...update });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async updatePassword(
    id: number,
    updatePasswordDto: UpdatePasswordDto,
    i18n: I18nContext,
  ) {
    const { password, password_confirm } = updatePasswordDto;
    if (password !== password_confirm)
      return conflictError({
        i18n,
        lang: i18n.lang,
        description: i18n.translate(
          'messages.auth.error.passwordsDoesNotMatch',
        ),
      });
    const user_secret = uuidv7();
    const hash = await bcrypt.hash(password, 10);
    try {
      return await this.usersRepository.update(id, {
        password: hash,
        user_secret,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async remove(id: number, i18n: I18nContext) {
    this.findOne(id, i18n);
    try {
      return await this.usersRepository.delete(id);
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async verifyEmail(@Param('token') token: string, i18n: I18nContext) {
    const userToken = await this.tokensService.findOneByToken(token, i18n);

    const userId = userToken.data.id;
    try {
      await this.usersRepository.update(userId, {
        status: UserStatusEnum.ACTIVE,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    await this.tokensService.updateTokenIsUsed(token, i18n);
  }

  private async __ValidateChangeEmail(
    user: User,
    i18n: I18nContext,
    newEmail: string,
  ) {
    const valUser = await this.findOneByEmail(newEmail, i18n);
    if (valUser)
      conflictError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.userEmailAlreadyExists', {
          lang: i18n.lang,
          args: { email: newEmail },
        }),
      });

    if (user.email === newEmail) return;

    this.mailService.sendMail(
      user.email,
      'Cambio de correo electrónico',
      'auth-email-update',
      {
        oldEmail: user.email,
        newEmail: newEmail,
      },
    );
  }

  private async __ValidateAndCreateUser(
    dto: CreateUserDto | UpdateUserDto,
    i18n: I18nContext,
    id?: number,
  ) {
    if (id) this.findOne(id, i18n);

    const { documentTypeId, document, email, password, ...rest } = dto;

    const identitiyType = await this.identityTypesService.findOne(
      documentTypeId,
      i18n,
    );

    const user = await this.usersRepository.findOneBy({ email });
    if (user)
      conflictError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.userEmailAlreadyExists', {
          lang: i18n.lang,
          args: { email },
        }),
      });

    const userDocument = await this.usersRepository.findOneBy({ document });
    if (userDocument)
      conflictError({
        i18n,
        lang: i18n.lang,
        description: i18n.t('messages.auth.error.documentAlreadyExists', {
          lang: i18n.lang,
          args: { document },
        }),
      });

    const password_hash = await bcrypt.hash(password, 15);

    return {
      ...rest,
      identitiyType: identitiyType.data,
      document,
      email,
      password: password_hash,
    };
  }
}

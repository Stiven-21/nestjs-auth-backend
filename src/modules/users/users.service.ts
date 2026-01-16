import { forwardRef, Inject, Injectable, Logger, Param } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
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
import { v7 as uuidv7 } from 'uuid';
import { TokensService } from './tokens/tokens.service';
import { RolesService } from '../roles/roles.service';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import { MailService } from 'src/mails/mail.service';
import { GoogleProfileDto } from 'src/modules/users/dto/create-google-user.dto';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { FacebookProfileDto } from 'src/modules/users/dto/create-facebook-user.dto';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import { CreateGithubProfileDto } from 'src/modules/users/dto/create-github-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly identityTypesService: IdentityTypesService,
    private readonly dynamicQueryService: DynamicQueryService,
    private readonly rolesService: RolesService,
    private readonly mailService: MailService,
    private readonly oauthService: OAuthService,
    @Inject(forwardRef(() => TokensService))
    private readonly tokensService: TokensService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const create = await this.__ValidateAndCreateUser(createUserDto, i18n);
    const user_secret = uuidv7();
    let user = null;
    const role = await this.rolesService.findOne(3, i18n);
    try {
      user = await repo.save({
        user_secret,
        role: role.data,
        ...create,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }

    return user;
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
      user = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect(
          'user.userAccountCredentials',
          'userAccountCredentials',
        )
        .leftJoinAndSelect('user.role', 'role')
        .addSelect('userAccountCredentials.password') // 👈 CLAVE
        .where('user.email = :email', { email })
        .getOne();
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
    const { userAccountCredentials, ...rest } = user;
    return { ...rest, password: userAccountCredentials.password };
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

  async updatePassword(id: number, i18n: I18nContext) {
    const user_secret = uuidv7();
    try {
      return await this.usersRepository.update(id, {
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

    const userId = userToken.data.user.id;
    try {
      await this.usersRepository.update(userId, {
        status: UserStatusEnum.ACTIVE,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    await this.tokensService.updateTokenIsUsed(token, i18n);
    return userToken.data.user.email;
  }

  private async __findOneByEmail(email: string, i18n: I18nContext) {
    try {
      return await this.usersRepository.findOneBy({ email });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  private async __ValidateProviderUser(
    providerId: string,
    provider: OAuthProviderEnum,
    email: string,
    i18n: I18nContext,
  ) {
    const userProviders =
      await this.oauthService.getUserWithProviderAndProviderId(
        providerId,
        provider,
      );
    if (userProviders) return userProviders;

    const user = await this.__findOneByEmail(email, i18n);
    if (user) return user;

    return null;
  }

  async validateGoogleUser(googleUser: GoogleProfileDto, i18n?: I18nContext) {
    const { googleId, ...rest } = googleUser;
    const validateUser = await this.__ValidateProviderUser(
      googleId,
      OAuthProviderEnum.GOOGLE,
      googleUser.email,
      i18n,
    );
    if (validateUser) return validateUser;

    const i18nCont = i18n ?? I18nContext.current();
    const role = await this.rolesService.findOne(3, i18nCont);
    const user_secret = uuidv7();
    return await this.usersRepository.save({
      ...rest,
      role: role.data,
      user_secret,
      status: UserStatusEnum.ACTIVE,
    });
  }

  async validateFacebookUser(
    facebookUser: FacebookProfileDto,
    i18n?: I18nContext,
  ) {
    const { facebookId, ...rest } = facebookUser;
    const validateUser = await this.__ValidateProviderUser(
      facebookId,
      OAuthProviderEnum.FACEBOOK,
      facebookUser.email,
      i18n,
    );
    if (validateUser) return validateUser;

    const i18nCont = i18n ?? I18nContext.current();
    const role = await this.rolesService.findOne(3, i18nCont);
    const user_secret = uuidv7();
    return await this.usersRepository.save({
      ...rest,
      role: role.data,
      user_secret,
      status: UserStatusEnum.ACTIVE,
    });
  }

  async validateGithubUser(
    githubUser: CreateGithubProfileDto,
    i18n?: I18nContext,
  ) {
    const { githubId, ...rest } = githubUser;
    const validateUser = await this.__ValidateProviderUser(
      githubId,
      OAuthProviderEnum.GITHUB,
      githubUser.email,
      i18n,
    );
    if (validateUser) return validateUser;

    const i18nCont = i18n ?? I18nContext.current();
    const role = await this.rolesService.findOne(3, i18nCont);
    const user_secret = uuidv7();
    return await this.usersRepository.save({
      ...rest,
      role: role.data,
      user_secret,
      status: UserStatusEnum.ACTIVE,
    });
  }

  async findById(id: number, i18n: I18nContext) {
    const user = await this.findOne(id, i18n);
    return user.data;
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
      i18n,
    );
  }

  private async __ValidateAndCreateUser(
    dto: CreateUserDto | UpdateUserDto,
    i18n: I18nContext,
    id?: number,
  ) {
    if (id) this.findOne(id, i18n);

    const { documentTypeId, document, email, ...rest } = dto;

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

    return {
      ...rest,
      identitiyType: identitiyType.data,
      document,
      email,
    };
  }
}

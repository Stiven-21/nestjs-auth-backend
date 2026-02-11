import { forwardRef, Inject, Injectable, Logger, Param } from '@nestjs/common';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';
import { I18nContext } from 'nestjs-i18n';
import {
  internalServerError,
  noContentResponse,
  okResponse,
  userNotFoundError,
  emailAlreadyExistsError,
} from 'src/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { DynamicQueryDto } from 'src/common/services/query/dto/dynamic.dto';
import { DynamicQueryService } from 'src/common/services/query/dynamic.service';
import { IdentityTypesService } from 'src/modules/users/identity-types/identity-types.service';
import { v7 as uuidv7 } from 'uuid';
import { TokensService } from 'src/modules/users/tokens/tokens.service';
import { RolesService } from 'src/modules/roles/roles.service';
import { UserStatusEnum } from 'src/common/enum/user-status.enum';
import { OAuthService } from 'src/modules/users/oauth/oauth.service';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import { getSafeSelect } from 'src/common/utils/typeorm.utils';
import { ChangeRoleDto } from 'src/modules/users/dto/change-role.dto';
import { Request } from 'express';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { AuditEvent } from 'src/common/enum/audit-event.enum';
import { getIPFromRequest } from 'src/common/helpers/request-info.helper';
import { OAuthProfile } from 'src/common/interfaces/oauth-profile.interface';
import { EmailChangeRequestService } from 'src/modules/users/email-change-request/email-change-request.service';
import { ResponseFactory } from 'src/common/exceptions/response.factory';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly identityTypesService: IdentityTypesService,
    private readonly dynamicQueryService: DynamicQueryService,
    private readonly rolesService: RolesService,
    private readonly oauthService: OAuthService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TokensService))
    private readonly tokensService: TokensService,
    private readonly auditLogService: AuditLogService,
    private readonly emailChangeRequestService: EmailChangeRequestService,
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
    const role = await this.rolesService.getNameRoleOrCreate(
      process.env.ROL_USER_DEFAULT,
      i18n,
    );
    try {
      user = await repo.save({
        user_secret,
        role,
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
    const select = getSafeSelect(this.usersRepository, [
      'id',
      'avatar',
      'name',
      'lastname',
      'document',
      'email',
      'role',
      'status',
      'createdAt',
      'updatedAt',
      'role',
      'identityType',
    ]);
    const { data: users, total } = await this.dynamicQueryService.findAndCount(
      this.usersRepository,
      filters,
      page,
      limit,
      i18n,
      sort,
      select,
    );
    return okResponse({
      data: users,
      meta: {
        page,
        itemsPerPage: limit,
        pages: Math.ceil(total / limit),
        totalItems: total,
      },
    });
  }

  async getUserSecret(id: number, i18n: I18nContext) {
    try {
      const { user_secret } = await this.usersRepository.findOne({
        where: { id, status: UserStatusEnum.ACTIVE, deletedAt: IsNull() },
        select: ['id', 'user_secret', 'status'],
      });
      return user_secret;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findOne(id: number, i18n: I18nContext) {
    let user: User;
    try {
      user = await this.usersRepository.findOne({
        where: { id },
        select: [
          'id',
          'avatar',
          'name',
          'lastname',
          'document',
          'email',
          'role',
          'status',
          'createdAt',
          'updatedAt',
          'user_secret',
          'role',
          'identityType',
          'userSessions',
        ],
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!user) userNotFoundError({ i18n, lang: i18n.lang });
    return okResponse({
      data: user,
      meta: { total: 1 },
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
        .addSelect('userAccountCredentials.password')
        .addSelect('user.user_secret')
        .where('user.email = :email', { email })
        .getOne();
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!user) userNotFoundError({ i18n, lang: i18n.lang });
    const { userAccountCredentials, ...rest } = user;
    return { ...rest, password: userAccountCredentials.password };
  }

  async update(id: number, updateUserDto: UpdateUserDto, i18n: I18nContext) {
    const update = await this.__ValidateAndCreateUser(updateUserDto, i18n, id);
    const { change, oldEmail } = await this.__ValidateChangeEmail(
      (await this.findOne(id, i18n)).data,
      i18n,
      update.email,
      id,
    );
    try {
      if (!change) return await this.usersRepository.update(id, update);

      const user = await this.dataSource.manager.transaction(
        async (manager) => {
          const { email, ...restUpdate } = update;
          await manager.getRepository(User).update(id, restUpdate);
          const user = await manager.getRepository(User).findOneBy({ id });

          await this.emailChangeRequestService.create(
            user,
            oldEmail,
            email,
            i18n,
            manager,
          );

          return user;
        },
      );

      return user;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async updatePassword(id: number, i18n: I18nContext, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    const user_secret = uuidv7();
    try {
      return await repo.update(id, {
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
      await this.usersRepository.softDelete(id);
      return noContentResponse();
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

  async __findOneByEmail(email: string, i18n: I18nContext) {
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

  // Oauth optimizado
  async validateOAuthUser(
    oauth: OAuthProfile,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;

    const validateUser = await this.__ValidateProviderUser(
      oauth.providerId,
      oauth.provider,
      oauth.email,
      i18n,
    );

    if (validateUser) return validateUser;

    const role = await this.rolesService.getNameRoleOrCreate(
      process.env.ROL_USER_DEFAULT,
      i18n,
    );
    const user_secret = uuidv7();

    return await repo.save({
      email: oauth.email,
      name: oauth.name,
      lastname: oauth.lastname,
      avatar: oauth.avatar,
      role,
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
    id?: number,
  ) {
    const valUser = await this.usersRepository.findOneBy({ email: newEmail });
    if (valUser && (!id || valUser.id !== id))
      emailAlreadyExistsError({
        i18n,
        lang: i18n.lang,
        args: { email: newEmail },
      });

    if (user.email === newEmail) return { change: false };
    return { change: true, oldEmail: user.email };
  }

  private async __ValidateAndCreateUser(
    dto: CreateUserDto | UpdateUserDto,
    i18n: I18nContext,
    id?: number,
  ) {
    if (id) this.findOne(id, i18n);

    const { documentTypeId, document, email, ...rest } = dto;

    const { data: identityType } = await this.identityTypesService.findOne(
      documentTypeId,
      i18n,
    );

    const user = await this.usersRepository.findOneBy({ email });
    if (user && (!id || user.id !== id))
      emailAlreadyExistsError({ i18n, lang: i18n.lang, args: { email } });

    const userDocument = await this.usersRepository.findOneBy({ document });
    if (userDocument && (!id || userDocument.id !== id))
      ResponseFactory.error({
        i18n,
        lang: i18n.lang,
        code: 'DOCUMENT_EXISTS',
        args: { document },
      });

    return {
      ...rest,
      identityType,
      document,
      email,
    };
  }

  async changeRole(
    req: Request,
    userId: number,
    changeRoleDto: ChangeRoleDto,
    i18n: I18nContext,
  ) {
    const { data: user } = await this.findOne(userId, i18n);
    const { data: role } = await this.rolesService.findOne(
      changeRoleDto.roleId,
      i18n,
    );
    const after = user.role;

    const userLogged = req.user['sub'];

    user.role = role;
    try {
      await this.usersRepository.save(user);
      await this.auditLogService.create(
        {
          event: AuditEvent.CHANGE_ROLE_USER,
          actorId: userLogged,
          ip: getIPFromRequest(req),
          userAgent: req.headers['user-agent'],
          metadata: {
            after: after,
            before: user.role,
          },
        },
        i18n,
      );
      return noContentResponse();
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async me(req: Request, i18n: I18nContext) {
    const { data: user } = await this.findOne(req.user['sub'], i18n);
    const oauthactive = await this.oauthService.findAllOAuthWithUser(
      req.user['sub'],
      i18n,
    );
    return okResponse({
      data: { ...user, oauth: oauthactive },
      meta: { total: 1 },
    });
  }

  async updateEmail(
    id: number,
    email: string,
    i18n: I18nContext,
    manager?: EntityManager,
  ) {
    const repo = manager ? manager.getRepository(User) : this.usersRepository;
    try {
      return await repo.update(id, { email });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}

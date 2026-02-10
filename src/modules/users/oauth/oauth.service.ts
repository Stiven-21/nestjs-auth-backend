import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccountOAuth } from 'src/modules/users/entities/user-account-oauth.entity';
import { EntityManager, Repository } from 'typeorm';
import { CreateOAuthDto } from 'src/modules/users/dto/create-oauth.dto';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError, notFoundError } from 'src/common/exceptions';
import { OAuthProviderEnum } from 'src/common/enum/user-oauth-providers.enum';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  constructor(
    @InjectRepository(UserAccountOAuth)
    private readonly oauthRepository: Repository<UserAccountOAuth>,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,
  ) {}

  async create(createOAuthDto: CreateOAuthDto, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(UserAccountOAuth)
      : this.oauthRepository;

    const oath = await this.oauthRepository.findOne({
      where: {
        providerId: createOAuthDto.providerId,
        provider: createOAuthDto.provider,
      },
    });

    if (oath) return;
    const i18n = I18nContext.current();
    try {
      await repo.save(createOAuthDto);
      return;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async findAllOAuthWithUser(userId: number, i18n: I18nContext) {
    try {
      const data = await this.oauthRepository.find({
        where: {
          user: { id: userId },
        },
        select: ['id', 'provider', 'providerId', 'avatar', 'user'],
      });
      return data;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async getUserWithProviderAndProviderId(
    id: string,
    provider: OAuthProviderEnum,
  ) {
    const i18n = I18nContext.current();
    try {
      const data = await this.oauthRepository.findOneBy({
        providerId: id,
        provider: provider,
      });
      if (!data) return null;
      return data.user;
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }

  async delete(userId: number, provider: OAuthProviderEnum, i18n: I18nContext) {
    let deleted: UserAccountOAuth | null = null;
    try {
      deleted = await this.oauthRepository.findOne({
        where: {
          user: { id: userId },
          provider: provider,
        },
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
    if (!deleted) notFoundError({ i18n, lang: i18n.lang });
    try {
      await this.oauthRepository.delete({
        user: { id: userId },
        provider: provider,
      });
    } catch (error) {
      this.logger.error(error);
      internalServerError({ i18n, lang: i18n.lang });
    }
  }
}

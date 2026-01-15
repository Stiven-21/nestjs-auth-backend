import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserAccountOAuth } from 'src/modules/users/entities/user-account-oauth.entity';
import { Repository } from 'typeorm';
import { CreateOAuthDto } from 'src/modules/users/dto/create-oauth.dto';
import { I18nContext } from 'nestjs-i18n';
import { internalServerError } from 'src/common/exceptions';
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

  async create(createOAuthDto: CreateOAuthDto) {
    const { userId, ...rest } = createOAuthDto;
    const oath = await this.oauthRepository.findOne({
      where: {
        providerId: createOAuthDto.providerId,
        provider: createOAuthDto.provider,
      },
    });

    if (oath) return;
    const i18n = I18nContext.current();
    const { data: user } = await this.userService.findById(userId, i18n);

    try {
      await this.oauthRepository.save({ ...rest, user });
      return;
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
}
